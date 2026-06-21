import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { isAuthed } from "@/lib/auth";
import { getPostBySlug } from "@/lib/posts";
import { getManagedCategories } from "@/lib/categories";
import { AdminEditPost } from "@/components/AdminEditPost";

export const dynamic = "force-dynamic";
export const metadata = { title: "글 수정", robots: { index: false, follow: false } };

export default async function EditPostPage({ params }: { params: { slug: string } }) {
  if (!isAuthed()) redirect("/admin");
  const slug = decodeURIComponent(params.slug);
  const [post, categories] = await Promise.all([
    getPostBySlug(slug).catch(() => null),
    getManagedCategories().catch(() => []),
  ]);
  if (!post) notFound();

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight">글 수정</h1>
        <Link href="/admin" className="text-sm text-ink-muted hover:text-ink">← 관리자</Link>
      </div>
      <AdminEditPost
        post={{
          slug: post.slug,
          title: post.title,
          seo_title: post.seo_title,
          excerpt: post.excerpt,
          author: post.author,
          category: post.category,
          cover_url: post.cover_url,
        }}
        categories={categories.map((c) => c.name)}
      />
    </div>
  );
}
