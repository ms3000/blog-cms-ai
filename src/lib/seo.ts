import type { Post, Tag } from "@/lib/types";
import { site, absUrl } from "@/lib/site";

/** 저장된 json_ld @graph 에서 특정 타입 노드들을 추출 */
function extractNodes(jsonLd: Record<string, unknown> | null, type: string): Record<string, unknown>[] {
  if (!jsonLd) return [];
  const graph = (jsonLd["@graph"] as Record<string, unknown>[]) || [jsonLd];
  return (Array.isArray(graph) ? graph : []).filter((n) => {
    const t = n["@type"];
    return Array.isArray(t) ? t.includes(type) : t === type;
  });
}

/**
 * 포스트용 JSON-LD @graph 생성.
 * - BlogPosting: 절대 canonical URL 로 새로 구성 (검색엔진/GEO 신뢰도)
 * - FAQPage / HowTo: 원본 HTML 에 있던 내용을 그대로 재사용 (GEO 인용 최적화)
 */
export function buildJsonLd(post: Post, tags: Tag[]): Record<string, unknown> {
  const url = absUrl(`/blog/${post.slug}`);
  const images = post.cover_url ? [post.cover_url] : [];

  const blogPosting: Record<string, unknown> = {
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt || undefined,
    image: images.length ? images : undefined,
    datePublished: post.published_at,
    dateModified: post.updated_at || post.published_at,
    keywords: tags.length ? tags.map((t) => t.name).join(", ") : post.keywords || undefined,
    articleSection: post.category || undefined,
    author: { "@type": "Person", name: post.author || site.defaultAuthor },
    publisher: {
      "@type": "Organization",
      name: post.publisher || site.name,
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    inLanguage: "ko-KR",
  };

  const graph: Record<string, unknown>[] = [blogPosting];

  // FAQ / HowTo 재사용
  for (const faq of extractNodes(post.json_ld, "FAQPage")) graph.push(faq);
  for (const howto of extractNodes(post.json_ld, "HowTo")) graph.push(howto);

  return { "@context": "https://schema.org", "@graph": graph };
}

/** 빵부스러기(BreadcrumbList) JSON-LD */
export function buildBreadcrumb(post: Post): Record<string, unknown> {
  const items = [
    { name: "홈", url: site.url },
    ...(post.category
      ? [{ name: post.category, url: absUrl(`/category/${encodeURIComponent(post.category)}`) }]
      : []),
    { name: post.title, url: absUrl(`/blog/${post.slug}`) },
  ];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}
