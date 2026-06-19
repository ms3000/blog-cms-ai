import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTagBySlug, getPostsByTag, getTags } from "@/lib/posts";
import { PostGrid } from "@/components/PostGrid";
import { Newsletter } from "@/components/Newsletter";
import { absUrl, site } from "@/lib/site";

export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    return (await getTags()).map((t) => ({ slug: t.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const tag = await getTagBySlug(decodeURIComponent(params.slug)).catch(() => null);
  if (!tag) return { title: "태그를 찾을 수 없습니다" };
  return {
    title: `#${tag.name}`,
    description: `#${tag.name} 태그가 달린 글 모음 — ${site.name}`,
    alternates: { canonical: absUrl(`/tag/${tag.slug}`) },
  };
}

export default async function TagPage({ params }: { params: { slug: string } }) {
  const tag = await getTagBySlug(decodeURIComponent(params.slug)).catch(() => null);
  if (!tag) notFound();

  const posts = await getPostsByTag(tag.id).catch(() => []);

  return (
    <>
      <section className="mx-auto max-w-content px-5 pt-12">
        <span className="text-sm font-bold tracking-wide text-accent">태그</span>
        <h1 className="mt-1.5 text-3xl font-extrabold tracking-tight md:text-4xl">#{tag.name}</h1>
        <p className="mt-3 text-ink-muted">{posts.length}개의 글</p>
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
