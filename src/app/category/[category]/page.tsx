import type { Metadata } from "next";
import { getPosts, getCategories } from "@/lib/posts";
import { getCategoryByName } from "@/lib/categories";
import { PostGrid } from "@/components/PostGrid";
import { Newsletter } from "@/components/Newsletter";
import { absUrl, site } from "@/lib/site";

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

export default async function CategoryPage({ params }: { params: { category: string } }) {
  const category = decodeURIComponent(params.category);
  const [posts, meta] = await Promise.all([
    getPosts({ category }).catch(() => []),
    getCategoryByName(category).catch(() => null),
  ]);

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
        <p className="mt-4 text-sm text-ink-muted">{posts.length}개의 글</p>
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
