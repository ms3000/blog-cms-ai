export const site = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || "WEDO 블로그",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  description:
    "상세페이지 자동화로 만든 콘텐츠를 그대로 발행하는 SEO·GEO 최적화 블로그.",
  locale: "ko_KR",
  defaultAuthor: "WEDO",
  defaultPublisher: "WEDO",
  // 상단 내비게이션에 노출할 카테고리(없으면 자동으로 글에서 수집)
  nav: [] as { label: string; href: string }[],
} as const;

/** 절대 URL 생성 (canonical, OG, sitemap, RSS 용) */
export function absUrl(path = "/"): string {
  if (!path.startsWith("/")) path = "/" + path;
  return site.url + path;
}
