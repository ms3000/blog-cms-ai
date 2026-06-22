"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type Category = { name: string; count: number };
type Brand = { name: string; logoUrl: string | null };
type PopularItem = { slug: string; title: string };

export function SiteNav({
  categories,
  brand,
  popular = [],
}: {
  categories: Category[];
  brand: Brand;
  popular?: PopularItem[];
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const router = useRouter();
  const pathname = usePathname() || "/";
  const current = safeDecode(pathname);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(term)}`);
  }

  const isHome = current === "/";
  const isActiveCategory = (name: string) => current === `/category/${name}`;

  const Logo = (
    <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
      {brand.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={brand.logoUrl} alt={brand.name} className="h-8 w-auto max-w-[160px] object-contain" />
      ) : (
        <>
          <span className="inline-block h-7 w-7 rounded-lg bg-accent" aria-hidden />
          <span className="text-lg font-extrabold tracking-tight">{brand.name}</span>
        </>
      )}
    </Link>
  );

  const NavLinks = (
    <nav className="flex flex-col gap-1 text-[15px]">
      <Link
        href="/"
        onClick={() => setOpen(false)}
        className={navItemCls(isHome)}
      >
        홈
      </Link>
      {categories.map((c) => (
        <Link
          key={c.name}
          href={`/category/${encodeURIComponent(c.name)}`}
          onClick={() => setOpen(false)}
          className={navItemCls(isActiveCategory(c.name))}
        >
          <span className="truncate">{c.name}</span>
          <span className="ml-auto text-xs text-ink-faint">{c.count}</span>
        </Link>
      ))}
      <Link
        href="/blog"
        onClick={() => setOpen(false)}
        className={navItemCls(current === "/blog")}
      >
        전체 글
      </Link>

      {/* 기사 검색 — 전체 글 바로 아래 */}
      <form onSubmit={submitSearch} className="mt-2 px-1">
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="기사 검색"
            aria-label="기사 검색"
            className="w-full rounded-lg border border-line bg-surface py-2 pl-9 pr-3 text-sm outline-none transition focus:border-accent focus:bg-white"
          />
        </div>
      </form>
    </nav>
  );

  return (
    <>
      {/* ===== Desktop: 좌측 사이드바 (본문과 함께 중앙 그룹) ===== */}
      <aside className="sticky top-0 z-40 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto border-r border-line bg-white px-5 py-7 lg:flex">
        <div className="mb-8">{Logo}</div>
        <div className="mb-3 px-3 text-xs font-bold uppercase tracking-wider text-ink-faint">
          블로그
        </div>
        {NavLinks}

        {popular.length > 0 && (
          <div className="mt-8">
            <div className="mb-2 px-3 text-xs font-bold uppercase tracking-wider text-ink-faint">
              인기 글
            </div>
            <ol className="space-y-1">
              {popular.map((p, i) => (
                <li key={p.slug}>
                  <Link
                    href={`/blog/${p.slug}`}
                    className="flex gap-2 rounded-lg px-3 py-1.5 text-sm text-ink-soft transition hover:bg-surface hover:text-ink"
                  >
                    <span className="font-bold text-accent">{i + 1}</span>
                    <span className="line-clamp-2">{p.title}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        )}

        <div className="mt-auto pt-6 text-xs text-ink-faint">
          © {new Date().getFullYear()} {brand.name}
        </div>
      </aside>

      {/* ===== Mobile: 상단바 ===== */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-white/90 px-4 backdrop-blur lg:hidden">
        {Logo}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="메뉴 열기"
          className="rounded-lg p-2 hover:bg-surface"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </header>

      {/* ===== Mobile: 드로어 ===== */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[80%] overflow-y-auto bg-white px-5 py-6 shadow-xl">
            <div className="mb-8 flex items-center justify-between">
              {Logo}
              <button onClick={() => setOpen(false)} aria-label="닫기" className="rounded-lg p-2 hover:bg-surface">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="6" y1="18" x2="18" y2="6" />
                </svg>
              </button>
            </div>
            <div className="mb-3 px-3 text-xs font-bold uppercase tracking-wider text-ink-faint">블로그</div>
            {NavLinks}
          </div>
        </div>
      )}
    </>
  );
}

function navItemCls(active: boolean): string {
  return [
    "flex items-center gap-2 rounded-lg px-3 py-2 font-medium transition",
    active ? "bg-accent-soft text-accent" : "text-ink-soft hover:bg-surface hover:text-ink",
  ].join(" ");
}

function safeDecode(p: string): string {
  try {
    return decodeURIComponent(p);
  } catch {
    return p;
  }
}
