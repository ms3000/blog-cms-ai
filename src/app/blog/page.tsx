import type { Metadata } from "next";
import Link from "next/link";
import { getPosts, countPosts } from "@/lib/posts";
import { getMenuCategories } from "@/lib/categories";
import { PostGrid } from "@/components/PostGrid";
import { Pagination } from "@/components/Pagination";
import { Newsletter } from "@/components/Newsletter";

export const revalidate = 60;
const PAGE_SIZE = 12;

export const metadata: Metadata = {
  title: "전체 글",
  description: "모든 블로그 글을 최신순으로 모았습니다.",
  alternates: { canonical: "/blog" },
};

export default async function BlogIndex({ searchParams }: { searchParams: { page?: string } }) {
  const page = Math.max(1, Number(searchParams.page) || 1);
  const [posts, total, categories] = await Promise.all([
    getPosts({ limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }).catch(() => []),
    countPosts().catch(() => 0),
    getMenuCategories().catch(() => []),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <section className="mx-auto max-w-content px-5 pt-12">
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">전체 글</h1>
        <p className="mt-3 text-ink-muted">총 {total}개의 글</p>

        {categories.length > 0 && (
          <div className="mt-7 flex flex-wrap gap-2">
            <span className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-white">전체</span>
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
        <Pagination page={page} totalPages={totalPages} basePath="/blog" />
      </section>

      <div className="pt-24">
        <Newsletter />
      </div>
    </>
  );
}
