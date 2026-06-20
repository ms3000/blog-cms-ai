import type { Metadata } from "next";
import { searchPosts } from "@/lib/posts";
import { PostGrid } from "@/components/PostGrid";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "검색",
  robots: { index: false, follow: true },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = (searchParams.q || "").trim();
  const posts = q ? await searchPosts(q).catch(() => []) : [];

  return (
    <section className="mx-auto max-w-content px-5 py-12">
      <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">기사 검색</h1>

      <form action="/search" className="mt-5 flex max-w-xl gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="검색어를 입력하세요"
          className="flex-1 rounded-xl border border-line px-4 py-2.5 outline-none focus:border-accent"
        />
        <button className="rounded-xl bg-ink px-5 py-2.5 font-semibold text-white transition hover:opacity-90">
          검색
        </button>
      </form>

      {q && (
        <p className="mt-6 text-sm text-ink-muted">
          <span className="font-semibold text-ink">&ldquo;{q}&rdquo;</span> 검색 결과 {posts.length}건
        </p>
      )}

      <div className="mt-6">
        {q ? (
          <PostGrid posts={posts} />
        ) : (
          <p className="py-16 text-center text-ink-muted">검색어를 입력해 기사를 찾아보세요.</p>
        )}
      </div>
    </section>
  );
}
