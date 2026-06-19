import { getPosts } from "@/lib/posts";
import { absUrl, site } from "@/lib/site";

export const revalidate = 300;

function esc(s: string): string {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET() {
  const posts = await getPosts({ limit: 50 }).catch(() => []);
  const updated = posts[0]?.published_at || new Date().toISOString();

  const items = posts
    .map(
      (p) => `    <item>
      <title>${esc(p.title)}</title>
      <link>${absUrl(`/blog/${p.slug}`)}</link>
      <guid isPermaLink="true">${absUrl(`/blog/${p.slug}`)}</guid>
      <pubDate>${new Date(p.published_at).toUTCString()}</pubDate>
      ${p.category ? `<category>${esc(p.category)}</category>` : ""}
      <description>${esc(p.excerpt || "")}</description>
    </item>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(site.name)}</title>
    <link>${site.url}</link>
    <description>${esc(site.description)}</description>
    <language>ko-kr</language>
    <lastBuildDate>${new Date(updated).toUTCString()}</lastBuildDate>
    <atom:link href="${absUrl("/feed.xml")}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
