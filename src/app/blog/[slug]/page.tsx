import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostBySlug, getAllSlugs, getTagsForPost, getPosts } from "@/lib/posts";
import { buildJsonLd, buildBreadcrumb } from "@/lib/seo";
import { scopeCss } from "@/lib/css";
import { absUrl, site } from "@/lib/site";
import { formatDate } from "@/lib/format";
import { PostCard } from "@/components/PostCard";
import { Newsletter } from "@/components/Newsletter";

export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    return (await getAllSlugs()).map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await getPostBySlug(decodeURIComponent(params.slug)).catch(() => null);
  if (!post) return { title: "글을 찾을 수 없습니다" };

  const url = absUrl(`/blog/${post.slug}`);
  const images = post.cover_url ? [{ url: post.cover_url }] : [];
  return {
    title: post.seo_title || post.title,
    description: post.excerpt || undefined,
    keywords: post.keywords || undefined,
    authors: post.author ? [{ name: post.author }] : undefined,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: post.seo_title || post.title,
      description: post.excerpt || undefined,
      siteName: site.name,
      locale: site.locale,
      publishedTime: post.published_at,
      modifiedTime: post.updated_at,
      images,
      authors: post.author ? [post.author] : undefined,
      section: post.category || undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.seo_title || post.title,
      description: post.excerpt || undefined,
      images: post.cover_url ? [post.cover_url] : undefined,
    },
  };
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const slug = decodeURIComponent(params.slug);
  const post = await getPostBySlug(slug).catch(() => null);
  if (!post) notFound();

  const tags = await getTagsForPost(post.id).catch(() => []);
  const related = (await getPosts({ limit: 4, category: post.category || undefined }).catch(() => []))
    .filter((p) => p.slug !== post.slug)
    .slice(0, 3);

  const jsonLd = buildJsonLd(post, tags);
  const breadcrumb = buildBreadcrumb(post);
  const cardW = cardWidthFromCss(post.content_css);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />

      {/* 원본 HTML 의 스타일을 .post-content 스코프로 한정 주입.
          기본값(globals)보다 높은 specificity(.post-content.post-content)로 주입해
          순서·레이어와 무관하게 각 글의 원본 디자인이 항상 우선 적용되도록 한다. */}
      {post.content_css && (
        <style
          dangerouslySetInnerHTML={{
            __html: scopeCss(post.content_css, ".post-content.post-content"),
          }}
        />
      )}

      {/* breadcrumb — 카드 폭에 맞춰 정렬, 한 줄 유지(긴 제목 … 축약) */}
      <div className="mx-auto px-5 pt-8" style={{ maxWidth: cardW }}>
        <nav
          className="flex items-center gap-1.5 overflow-hidden whitespace-nowrap text-sm text-ink-faint"
          aria-label="breadcrumb"
        >
          <Link href="/" className="shrink-0 hover:text-ink">홈</Link>
          <span aria-hidden className="shrink-0">/</span>
          {post.category ? (
            <>
              <Link
                href={`/category/${encodeURIComponent(post.category)}`}
                className="shrink-0 hover:text-ink"
              >
                {post.category}
              </Link>
              <span aria-hidden className="shrink-0">/</span>
            </>
          ) : null}
          <span className="min-w-0 flex-1 truncate text-ink-soft">{post.title}</span>
        </nav>
      </div>

      {/* 본문 — 원본의 "회색 배경 위 흰 카드" 디자인을 그대로 재현 */}
      <section className="post-stage mt-6 w-full">
        <div
          className="post-content"
          dangerouslySetInnerHTML={{ __html: post.content_html }}
        />
      </section>

      {/* 태그 링크 */}
      {tags.length > 0 && (
        <div className="mx-auto px-5 pt-10" style={{ maxWidth: cardW }}>
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <Link
                key={t.id}
                href={`/tag/${t.slug}`}
                className="rounded-full bg-surface px-3 py-1.5 text-sm text-ink-soft transition hover:bg-accent-soft hover:text-accent"
              >
                #{t.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 관련 글 */}
      {related.length > 0 && (
        <section className="mx-auto mt-20 max-w-content px-5">
          <h2 className="mb-7 text-xl font-extrabold tracking-tight">관련 글</h2>
          <div className="grid gap-x-7 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <PostCard key={p.slug} post={p} />
            ))}
          </div>
        </section>
      )}

      <div className="pt-24">
        <Newsletter />
      </div>
    </>
  );
}

/** 원본 CSS 의 .bp-card max-width 를 읽어 브레드크럼/태그 폭을 본문 카드와 맞춘다. */
function cardWidthFromCss(css: string | null): number {
  const DEFAULT = 670;
  if (!css) return DEFAULT;
  const m = /\.bp-card\s*\{[^}]*max-width\s*:\s*(\d+)px/.exec(css);
  const w = m ? Number(m[1]) : DEFAULT;
  return w >= 320 && w <= 1200 ? w : DEFAULT;
}
