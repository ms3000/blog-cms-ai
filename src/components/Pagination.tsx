import Link from "next/link";

export function Pagination({
  page,
  totalPages,
  basePath,
}: {
  page: number;
  totalPages: number;
  basePath: string;
}) {
  if (totalPages <= 1) return null;

  const href = (p: number) => (p <= 1 ? basePath : `${basePath}?page=${p}`);

  // 현재 페이지 주변 윈도우 (최대 5개)
  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  for (let i = Math.max(1, end - 4); i <= end; i++) pages.push(i);

  const itemCls = "min-w-9 rounded-lg border border-line px-3 py-2 text-center text-sm transition hover:border-ink";
  const activeCls = "min-w-9 rounded-lg bg-ink px-3 py-2 text-center text-sm font-semibold text-white";

  return (
    <nav className="mt-14 flex items-center justify-center gap-1.5" aria-label="페이지">
      {page > 1 && (
        <Link href={href(page - 1)} className={itemCls} aria-label="이전 페이지">←</Link>
      )}
      {pages[0] > 1 && (
        <>
          <Link href={href(1)} className={itemCls}>1</Link>
          {pages[0] > 2 && <span className="px-1 text-ink-faint">…</span>}
        </>
      )}
      {pages.map((p) => (
        <Link key={p} href={href(p)} className={p === page ? activeCls : itemCls} aria-current={p === page ? "page" : undefined}>
          {p}
        </Link>
      ))}
      {pages[pages.length - 1] < totalPages && (
        <>
          {pages[pages.length - 1] < totalPages - 1 && <span className="px-1 text-ink-faint">…</span>}
          <Link href={href(totalPages)} className={itemCls}>{totalPages}</Link>
        </>
      )}
      {page < totalPages && (
        <Link href={href(page + 1)} className={itemCls} aria-label="다음 페이지">→</Link>
      )}
    </nav>
  );
}
