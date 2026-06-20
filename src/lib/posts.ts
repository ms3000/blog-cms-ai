import { createPublicClient } from "@/lib/supabase/server";
import type { Post, PostCardData, Tag } from "@/lib/types";

const CARD_FIELDS =
  "slug,title,excerpt,cover_url,cover_alt,category,author,published_at,reading_minutes";

export async function getPosts(opts?: {
  limit?: number;
  offset?: number;
  category?: string;
}): Promise<PostCardData[]> {
  const sb = createPublicClient();
  let q = sb
    .from("posts")
    .select(CARD_FIELDS)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (opts?.category) q = q.eq("category", opts.category);
  if (opts?.limit != null) {
    const from = opts.offset ?? 0;
    q = q.range(from, from + opts.limit - 1);
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as PostCardData[];
}

export async function countPosts(category?: string): Promise<number> {
  const sb = createPublicClient();
  let q = sb
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("status", "published");
  if (category) q = q.eq("category", category);
  const { count, error } = await q;
  if (error) throw error;
  return count ?? 0;
}

export async function searchPosts(query: string): Promise<PostCardData[]> {
  const term = (query || "").replace(/[%,()*]/g, " ").trim();
  if (!term) return [];
  const sb = createPublicClient();
  const { data, error } = await sb
    .from("posts")
    .select(CARD_FIELDS)
    .eq("status", "published")
    .or(`title.ilike.%${term}%,excerpt.ilike.%${term}%,keywords.ilike.%${term}%`)
    .order("published_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as PostCardData[];
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const sb = createPublicClient();
  const { data, error } = await sb
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  return (data as Post) ?? null;
}

export async function getAllSlugs(): Promise<string[]> {
  const sb = createPublicClient();
  const { data, error } = await sb
    .from("posts")
    .select("slug")
    .eq("status", "published");
  if (error) throw error;
  return (data ?? []).map((r: { slug: string }) => r.slug);
}

export async function getCategories(): Promise<{ name: string; count: number }[]> {
  const sb = createPublicClient();
  const { data, error } = await sb
    .from("posts")
    .select("category")
    .eq("status", "published")
    .not("category", "is", null);
  if (error) throw error;
  const counts = new Map<string, number>();
  for (const row of (data ?? []) as { category: string | null }[]) {
    const c = (row.category || "").trim();
    if (!c) continue;
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export async function getTags(limit?: number): Promise<Tag[]> {
  const sb = createPublicClient();
  let q = sb.from("tags").select("id,name,slug").order("name");
  if (limit) q = q.limit(limit);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Tag[];
}

export async function getTagBySlug(slug: string): Promise<Tag | null> {
  const sb = createPublicClient();
  const { data, error } = await sb
    .from("tags")
    .select("id,name,slug")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return (data as Tag) ?? null;
}

export async function getPostsByTag(tagId: string): Promise<PostCardData[]> {
  const sb = createPublicClient();
  const { data, error } = await sb
    .from("post_tags")
    .select(`posts!inner(${CARD_FIELDS})`)
    .eq("tag_id", tagId);
  if (error) throw error;
  const posts = (data ?? [])
    .map((r: { posts: unknown }) => r.posts as PostCardData)
    .filter(Boolean);
  // 최신순
  posts.sort(
    (a, b) =>
      new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );
  return posts;
}

export async function getTagsForPost(postId: string): Promise<Tag[]> {
  const sb = createPublicClient();
  const { data, error } = await sb
    .from("post_tags")
    .select("tags!inner(id,name,slug)")
    .eq("post_id", postId);
  if (error) throw error;
  return (data ?? [])
    .map((r: { tags: unknown }) => r.tags as Tag)
    .filter(Boolean);
}
