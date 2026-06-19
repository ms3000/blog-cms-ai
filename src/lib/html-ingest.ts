import crypto from "node:crypto";
import { parse, type HTMLElement } from "node-html-parser";
import { slugify, readingMinutes } from "@/lib/format";

export type ParsedImage = {
  dataUri: string;
  buffer: Buffer;
  ext: string;
  hash: string;
};

export type IngestResult = {
  slug: string;
  title: string; // 화면용 제목 (h1)
  seo_title: string | null; // <title>
  excerpt: string | null; // meta description
  keywords: string | null;
  cover_url: string | null;
  cover_alt: string | null;
  content_html: string; // <article> 내부, base64 → URL 치환됨
  category: string | null;
  author: string | null;
  publisher: string | null;
  tags: string[];
  json_ld: Record<string, unknown> | null;
  has_faq: boolean;
  has_howto: boolean;
  reading_minutes: number;
  published_at: string | null;
};

export type UploadImage = (img: ParsedImage) => Promise<string>;

const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "image/avif": "avif",
};

const DATA_URI_RE = /data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/g;

function extFromDataUri(uri: string): string {
  const m = /^data:(image\/[a-zA-Z0-9.+-]+);base64,/.exec(uri);
  const mime = (m?.[1] || "image/jpeg").toLowerCase();
  return MIME_EXT[mime] || "bin";
}

function collectDataUris(html: string): ParsedImage[] {
  const seen = new Map<string, ParsedImage>();
  const matches = html.match(DATA_URI_RE) || [];
  for (const uri of matches) {
    if (seen.has(uri)) continue;
    const base64 = uri.slice(uri.indexOf(",") + 1);
    let buffer: Buffer;
    try {
      buffer = Buffer.from(base64, "base64");
    } catch {
      continue;
    }
    const hash = crypto.createHash("md5").update(buffer).digest("hex").slice(0, 16);
    seen.set(uri, { dataUri: uri, buffer, ext: extFromDataUri(uri), hash });
  }
  return [...seen.values()];
}

function metaContent(root: HTMLElement, selector: string): string | null {
  const el = root.querySelector(selector);
  const v = el?.getAttribute("content")?.trim();
  return v || null;
}

function firstJsonLd(root: HTMLElement): Record<string, unknown> | null {
  const scripts = root.querySelectorAll('script[type="application/ld+json"]');
  for (const s of scripts) {
    const raw = s.text?.trim();
    if (!raw) continue;
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      /* ignore malformed */
    }
  }
  return null;
}

/** @graph 또는 단일 객체에서 type 별 노드 추출 */
function graphNodes(jsonLd: Record<string, unknown> | null): Record<string, unknown>[] {
  if (!jsonLd) return [];
  const graph = (jsonLd["@graph"] as Record<string, unknown>[]) || null;
  if (Array.isArray(graph)) return graph;
  return [jsonLd];
}

function hasType(nodes: Record<string, unknown>[], type: string): boolean {
  return nodes.some((n) => {
    const t = n["@type"];
    return Array.isArray(t) ? t.includes(type) : t === type;
  });
}

function getArticleNode(nodes: Record<string, unknown>[]): Record<string, unknown> | null {
  return (
    nodes.find((n) => {
      const t = n["@type"];
      const arr = Array.isArray(t) ? t : [t];
      return arr.some((x) => ["BlogPosting", "Article", "NewsArticle", "Review"].includes(String(x)));
    }) || null
  );
}

/**
 * 업로드된 단일 HTML 문자열을 파싱하여 CMS 저장용 데이터로 변환한다.
 * base64 이미지는 uploadImage 콜백으로 외부 스토리지에 올린 뒤 URL 로 치환한다.
 */
export async function ingestHtml(html: string, uploadImage: UploadImage): Promise<IngestResult> {
  const root = parse(html, {
    comment: false,
    blockTextElements: { script: true, style: true, noscript: false, pre: true },
  });

  // ---------- 메타 ----------
  const headTitle = root.querySelector("title")?.text?.trim() || null;
  const ogTitle = metaContent(root, 'meta[property="og:title"]');
  const description =
    metaContent(root, 'meta[name="description"]') ||
    metaContent(root, 'meta[property="og:description"]');
  const keywords = metaContent(root, 'meta[name="keywords"]');
  const metaAuthor = metaContent(root, 'meta[name="author"]');
  const canonical = root.querySelector('link[rel="canonical"]')?.getAttribute("href") || null;
  const ogImage = metaContent(root, 'meta[property="og:image"]');

  // ---------- JSON-LD ----------
  const jsonLd = firstJsonLd(root);
  const nodes = graphNodes(jsonLd);
  const articleNode = getArticleNode(nodes);
  const has_faq = hasType(nodes, "FAQPage");
  const has_howto = hasType(nodes, "HowTo");
  const ldPublished = (articleNode?.datePublished as string) || null;
  const ldAuthor =
    (() => {
      const a = articleNode?.author as Record<string, unknown> | string | undefined;
      if (!a) return null;
      if (typeof a === "string") return a;
      return (a.name as string) || null;
    })() || null;
  const ldPublisher = (() => {
    const p = articleNode?.publisher as Record<string, unknown> | string | undefined;
    if (!p) return null;
    if (typeof p === "string") return p;
    return (p.name as string) || null;
  })();

  // ---------- 본문 article ----------
  const article =
    root.querySelector("article.bp-card") ||
    root.querySelector("article") ||
    root.querySelector(".bp-card") ||
    root.querySelector("body");
  if (!article) throw new Error("본문(article)을 찾을 수 없습니다.");

  const displayTitle =
    article.querySelector(".bp-title")?.text?.trim().replace(/\s+/g, " ") ||
    ogTitle ||
    headTitle ||
    "제목 없음";

  const eyebrow = article.querySelector(".bp-eyebrow")?.text?.trim() || null;
  const category = eyebrow
    ? eyebrow.split(",")[0].replace(/#/g, "").trim() || null
    : null;

  const byline = article.querySelector(".bp-byline")?.text?.trim() || null;
  const bylineDate = parseKoreanDate(byline);

  const tags = article
    .querySelectorAll(".bp-tags span")
    .map((s) => s.text.replace(/^#/, "").trim())
    .filter(Boolean);
  // 태그가 본문에 없으면 keywords 로 대체
  const fallbackTags =
    tags.length === 0 && keywords
      ? keywords
          .split(",")
          .map((t) => t.replace(/^#/, "").trim())
          .filter(Boolean)
      : tags;
  const uniqueTags = [...new Set(fallbackTags)];

  const coverAlt =
    article.querySelector(".bp-cover img")?.getAttribute("alt") || displayTitle;

  // ---------- 이미지 분리 & 치환 ----------
  // og:image + 본문 전체에서 data URI 수집 (중복 제거)
  const scope = (ogImage && ogImage.startsWith("data:") ? ogImage : "") + "\n" + article.toString();
  const images = collectDataUris(scope);
  const replaceMap = new Map<string, string>();
  for (const img of images) {
    const url = await uploadImage(img);
    replaceMap.set(img.dataUri, url);
  }

  const replaceAll = (input: string): string => {
    let out = input;
    for (const [from, to] of replaceMap) {
      out = out.split(from).join(to);
    }
    return out;
  };

  let content_html = replaceAll(article.toString());

  // 커버: og:image(data) → 치환된 URL, 아니면 본문 .bp-cover img, 아니면 원본 og:image(url)
  let cover_url: string | null = null;
  if (ogImage && ogImage.startsWith("data:")) {
    cover_url = replaceMap.get(ogImage) || null;
  }
  if (!cover_url) {
    const coverSrc = parse(content_html).querySelector(".bp-cover img")?.getAttribute("src") || null;
    cover_url = coverSrc;
  }
  if (!cover_url && ogImage && !ogImage.startsWith("data:")) {
    cover_url = ogImage;
  }

  // ---------- 슬러그 ----------
  const slugSource =
    (canonical && canonical.replace(/^https?:\/\/[^/]+/, "").replace(/^\//, "").trim()) ||
    displayTitle;
  const slug = slugify(slugSource);

  // ---------- 읽기 시간 ----------
  const plainText = article.text || "";
  const reading = readingMinutes(plainText);

  return {
    slug,
    title: displayTitle,
    seo_title: headTitle || ogTitle || displayTitle,
    excerpt: description,
    keywords,
    cover_url,
    cover_alt: coverAlt,
    content_html,
    category,
    author: metaAuthor || ldAuthor,
    publisher: ldPublisher,
    tags: uniqueTags,
    json_ld: jsonLd,
    has_faq,
    has_howto,
    reading_minutes: reading,
    published_at: ldPublished || bylineDate,
  };
}

/** "2026. 6. 20." / "2026-06-20" 같은 한글/일반 날짜 → ISO, 실패 시 null */
function parseKoreanDate(input: string | null): string | null {
  if (!input) return null;
  const m = /(\d{4})\s*[.\-/]\s*(\d{1,2})\s*[.\-/]\s*(\d{1,2})/.exec(input);
  if (!m) return null;
  const [, y, mo, d] = m;
  const date = new Date(Number(y), Number(mo) - 1, Number(d), 9, 0, 0);
  return isNaN(date.getTime()) ? null : date.toISOString();
}
