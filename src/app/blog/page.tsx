import type { Metadata } from "next";
import Link from "next/link";
import { getPosts, getCategories } from "@/lib/posts";
import { PostGrid } from "@/components/PostGrid";
import { Newsletter } from "@/components/Newsletter";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "전체 글",
  description: "모든 블로그 글을 최신순으로 모았습니다.",
  alternates: { canonical: "/blog" },
};

export default async function BlogIndex() {
  const [posts, categories] = await Promise.all([
    getPosts().catch(() => []),
    getCategories().catch(() => []),
  ]);

  return (
    <>
      <section className="mx-auto max-w-content px-5 pt-12">
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">전체 글</h1>
        <p className="mt-3 text-ink-muted">총 {posts.length}개의 글</p>

        {categories.length > 0 && (
          <div className="mt-7 flex flex-wrap gap-2">
            <span className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-white">
              전체
            </span>
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
        )}
      </section>

      <section className="mx-auto max-w-content px-5 pt-10">
        <PostGrid posts={posts} />
      </section>

      <div className="pt-24">
        <Newsletter />
      </div>
    </>
  );
}
