import type { Metadata } from "next";
import "./globals.css";
import { site, absUrl } from "@/lib/site";
import { SiteNav } from "@/components/SiteNav";
import { Footer } from "@/components/Footer";
import { getCategories } from "@/lib/posts";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name}`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  alternates: {
    canonical: "/",
    types: {
      "application/rss+xml": [{ url: absUrl("/feed.xml"), title: `${site.name} RSS` }],
    },
  },
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: site.locale,
    url: site.url,
    title: site.name,
    description: site.description,
  },
  twitter: {
    card: "summary_large_image",
    title: site.name,
    description: site.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const categories = await getCategories().catch(() => []);
  const brand = { name: site.name, logoUrl: null as string | null };

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
      </head>
      <body className="min-h-screen bg-white text-ink antialiased">
        <SiteNav categories={categories} brand={brand} />
        <div className="flex min-h-screen flex-col lg:pl-64">
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
