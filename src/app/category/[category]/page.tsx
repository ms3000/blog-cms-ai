import type { Metadata } from "next";
import { getPosts, getCategories, countPosts } from "@/lib/posts";
import { getCategoryByName } from "@/lib/categories";
import { PostGrid } from "@/components/PostGrid";
import { Pagination } from "@/components/Pagination";
import { Newsletter } from "@/components/Newsletter";
import { absUrl, site } from "@/lib/site";

const PAGE_SIZE = 12;

export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    return (await getCategories()).map((c) => ({ category: c.name }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: { category: string };
}): Promise<Metadata> {
  const category = decodeURIComponent(params.category);
  const meta = await getCategoryByName(category).catch(() => null);
  return {
    title: `${category}`,
    description: meta?.description || `${category} 카테고리의 글 모음 — ${site.name}`,
    alternates: { canonical: absUrl(`/category/${encodeURIComponent(category)}`) },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { category: string };
  searchParams: { page?: string };
}) {
  const category = decodeURIComponent(params.category);
  const page = Math.max(1, Number(searchParams.page) || 1);
  const [posts, total, meta] = await Promise.all([
    getPosts({ category, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }).catch(() => []),
    countPosts(category).catch(() => 0),
    getCategoryByName(category).catch(() => null),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <section className="mx-auto max-w-content px-5 pt-12">
        <span className="text-sm font-bold tracking-wide text-accent">카테고리</span>
        <h1 className="mt-1.5 text-3xl font-extrabold tracking-tight md:text-4xl">{category}</h1>
        {meta?.description && (
          <p className="mt-4 max-w-2xl whitespace-pre-line text-[15px] leading-7 text-ink-soft">
            {meta.description}
          </p>
        )}
        <p className="mt-4 text-sm text-ink-muted">{total}개의 글</p>
      </section>
      <section className="mx-auto max-w-content px-5 pt-10">
        <PostGrid posts={posts} />
        <Pagination
          page={page}
          totalPages={totalPages}
          basePath={`/category/${encodeURIComponent(category)}`}
        />
      </section>
      <div className="pt-24">
        <Newsletter />
      </div>
    </>
  );
}
