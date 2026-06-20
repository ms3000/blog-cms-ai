import Link from "next/link";
import { getPosts } from "@/lib/posts";
import { getMenuCategories } from "@/lib/categories";
import { PostCard } from "@/components/PostCard";
import { Newsletter } from "@/components/Newsletter";
import { formatDate } from "@/lib/format";

export const revalidate = 60;

export default async function HomePage() {
  const [posts, categories] = await Promise.all([
    getPosts({ limit: 13 }).catch(() => []),
    getMenuCategories().catch(() => []),
  ]);

  if (posts.length === 0) {
    return (
      <div className="mx-auto max-w-content px-5 py-32 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight">아직 발행된 글이 없습니다</h1>
        <p className="mt-4 text-ink-muted">
          관리자 페이지에서 HTML 파일을 업로드하면 첫 글이 게시됩니다.
        </p>
        <Link
          href="/admin"
          className="mt-8 inline-block rounded-full bg-ink px-6 py-3 font-semibold text-white"
        >
          관리자로 이동
        </Link>
      </div>
    );
  }

  const [featured, ...rest] = posts;

  return (
    <>
      {/* Hero / Featured */}
      <section className="mx-auto max-w-content px-5 pt-10 md:pt-16">
        <Link href={`/blog/${featured.slug}`} className="group grid items-center gap-8 md:grid-cols-2">
          <div className="aspect-[16/10] overflow-hidden rounded-3xl bg-line order-1 md:order-none">
            {featured.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={featured.cover_url}
                alt={featured.cover_alt || featured.title}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
              />
            ) : null}
          </div>
          <div>
            {featured.category && (
              <span className="text-sm font-bold tracking-wide text-accent">
                {featured.category}
              </span>
            )}
            <h1 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight md:text-4xl group-hover:text-accent">
              {featured.title}
            </h1>
            {featured.excerpt && (
              <p className="mt-4 text-base leading-relaxed text-ink-muted line-clamp-3">
                {featured.excerpt}
              </p>
            )}
            <div className="mt-5 flex items-center gap-2 text-sm text-ink-faint">
              <span>{featured.author || "WEDO"}</span>
              <span aria-hidden>·</span>
              <time dateTime={featured.published_at}>{formatDate(featured.published_at)}</time>
              <span aria-hidden>·</span>
              <span>{featured.reading_minutes}분</span>
            </div>
          </div>
        </Link>
      </section>

      {/* 카테고리 칩 */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-content px-5 pt-14">
          <div className="flex flex-wrap gap-2">
            <Link
              href="/blog"
              className="rounded-full border border-line px-4 py-2 text-sm font-medium text-ink-soft transition hover:border-ink hover:text-ink"
            >
              전체
            </Link>
            {categories.map((c) => (
              <Link
                key={c.name}
                href={`/category/${encodeURIComponent(c.name)}`}
                className="rounded-full border border-line px-4 py-2 text-sm font-medium text-ink-soft transition hover:border-ink hover:text-ink"
              >
                {c.name} <span className="text-ink-faint">{c.count}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 최신 글 그리드 */}
      <section className="mx-auto max-w-content px-5 pt-10">
        <h2 className="mb-7 text-xl font-extrabold tracking-tight">최신 글</h2>
        <div className="grid gap-x-7 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((p) => (
            <PostCard key={p.slug} post={p} />
          ))}
        </div>
      </section>

      <div className="pt-24">
        <Newsletter />
      </div>
    </>
  );
}
