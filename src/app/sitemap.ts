import type { MetadataRoute } from "next";
import { getPosts, getCategories, getTags } from "@/lib/posts";
import { absUrl } from "@/lib/site";

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, categories, tags] = await Promise.all([
    getPosts().catch(() => []),
    getCategories().catch(() => []),
    getTags().catch(() => []),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: absUrl("/blog"), changeFrequency: "daily", priority: 0.9 },
  ];

  const postRoutes: MetadataRoute.Sitemap = posts.map((p) => ({
    url: absUrl(`/blog/${p.slug}`),
    lastModified: p.published_at,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: absUrl(`/category/${encodeURIComponent(c.name)}`),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const tagRoutes: MetadataRoute.Sitemap = tags.map((t) => ({
    url: absUrl(`/tag/${t.slug}`),
    changeFrequency: "weekly",
    priority: 0.4,
  }));

  return [...staticRoutes, ...postRoutes, ...categoryRoutes, ...tagRoutes];
}
