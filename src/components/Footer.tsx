import Link from "next/link";
import { site } from "@/lib/site";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <div className="mx-auto max-w-content px-5 py-14">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-2 font-extrabold text-lg">
              <span className="inline-block h-5 w-5 rounded-md bg-accent" aria-hidden />
              {site.name}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">{site.description}</p>
          </div>

          <div className="flex gap-16 text-sm">
            <div>
              <div className="mb-3 font-semibold text-ink">콘텐츠</div>
              <ul className="space-y-2 text-ink-muted">
                <li><Link href="/blog" className="hover:text-ink">전체 글</Link></li>
                <li><Link href="/feed.xml" className="hover:text-ink">RSS 피드</Link></li>
                <li><Link href="/sitemap.xml" className="hover:text-ink">사이트맵</Link></li>
              </ul>
            </div>
            <div>
              <div className="mb-3 font-semibold text-ink">관리</div>
              <ul className="space-y-2 text-ink-muted">
                <li><Link href="/admin" className="hover:text-ink">관리자</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-line pt-6 text-xs text-ink-faint">
          © {year} {site.name}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
