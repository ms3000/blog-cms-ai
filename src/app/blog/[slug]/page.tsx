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

      {/* 원본 HTML 의 스타일을 .post-content 스코프로 한정 주입 (원본 디자인 100% 보존) */}
      {post.content_css && (
        <style dangerouslySetInnerHTML={{ __html: scopeCss(post.content_css) }} />
      )}

      {/* breadcrumb */}
      <div className="mx-auto max-w-content px-5 pt-8">
        <nav className="flex items-center gap-1.5 text-sm text-ink-faint" aria-label="breadcrumb">
          <Link href="/" className="hover:text-ink">홈</Link>
          <span aria-hidden>/</span>
          {post.category ? (
            <>
              <Link
                href={`/category/${encodeURIComponent(post.category)}`}
                className="hover:text-ink"
              >
                {post.category}
              </Link>
              <span aria-hidden>/</span>
            </>
          ) : null}
          <span className="text-ink-soft line-clamp-1">{post.title}</span>
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
        <div className="mx-auto max-w-content px-5 pt-10">
          <div className="mx-auto flex max-w-[670px] flex-wrap gap-2">
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
