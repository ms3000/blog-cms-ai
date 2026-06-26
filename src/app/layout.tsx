import type { Metadata } from "next";
import "./globals.css";
import { site, absUrl } from "@/lib/site";
import { SiteNav } from "@/components/SiteNav";
import { Footer } from "@/components/Footer";
import { getMenuCategories } from "@/lib/categories";
import { getPopularPosts } from "@/lib/posts";
import { getSettings } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const siteName = settings.siteName;
  const description = settings.footerDescription || site.description;

  return {
    metadataBase: new URL(site.url),
    title: {
      default: siteName,
      template: `%s | ${siteName}`,
    },
    description,
    applicationName: siteName,
    alternates: {
      canonical: "/",
      types: {
        "application/rss+xml": [{ url: absUrl("/feed.xml"), title: `${siteName} RSS` }],
      },
    },
    openGraph: {
      type: "website",
      siteName,
      locale: site.locale,
      url: site.url,
      title: siteName,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: siteName,
      description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [categories, settings, popular] = await Promise.all([
    getMenuCategories().catch(() => []),
    getSettings(),
    getPopularPosts(5).catch(() => []),
  ]);
  const brand = { name: settings.siteName, logoUrl: settings.logoUrl };
  const popularItems = popular.map((p) => ({ slug: p.slug, title: p.title }));
  const copyrightText =
    settings.copyright || `© ${new Date().getFullYear()} ${settings.siteName}. All rights reserved.`;

  const gaId = settings.gaMeasurementId;

  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* 본문(원본 디자인)용 웹폰트 */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&family=Noto+Sans+KR:wght@400;500;700;900&display=swap"
        />
        {/* Google Analytics */}
        {gaId && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`,
              }}
            />
          </>
        )}
      </head>
      <body className="flex min-h-screen flex-col bg-white text-ink antialiased">
        {/* 사이드바 + 본문을 하나의 그룹으로 묶어 화면 중앙에 배치 */}
        <div className="mx-auto block w-full max-w-[1440px] flex-1 lg:flex">
          <SiteNav categories={categories} brand={brand} popular={popularItems} copyright={copyrightText} />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
        {/* Footer 는 그룹 밖 — 배경이 화면 전체 폭으로 이어짐 */}
        <Footer />
      </body>
    </html>
  );
}
