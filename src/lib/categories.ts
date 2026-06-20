import { createPublicClient } from "@/lib/supabase/server";
import { getCategories } from "@/lib/posts";

export type ManagedCategory = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
};

export type MenuCategory = { name: string; count: number };

export async function getManagedCategories(): Promise<ManagedCategory[]> {
  const sb = createPublicClient();
  const { data, error } = await sb
    .from("categories")
    .select("id, name, slug, sort_order")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) return [];
  return (data ?? []) as ManagedCategory[];
}

/** 글 수를 카테고리명 기준으로 집계 */
async function categoryCounts(): Promise<Map<string, number>> {
  const sb = createPublicClient();
  const { data } = await sb
    .from("posts")
    .select("category")
    .eq("status", "published")
    .not("category", "is", null);
  const counts = new Map<string, number>();
  for (const row of (data ?? []) as { category: string | null }[]) {
    const c = (row.category || "").trim();
    if (!c) continue;
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  return counts;
}

/**
 * 사이드바 메뉴용 카테고리.
 * - 관리 카테고리(categories 테이블, 지정 순서)가 있으면 그것을 사용
 * - 없으면 글에서 자동 수집(폴백)
 */
export async function getMenuCategories(): Promise<MenuCategory[]> {
  const managed = await getManagedCategories();
  if (managed.length === 0) {
    return getCategories().catch(() => []);
  }
  const counts = await categoryCounts();
  return managed.map((c) => ({ name: c.name, count: counts.get(c.name) ?? 0 }));
}
