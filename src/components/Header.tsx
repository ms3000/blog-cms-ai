import Link from "next/link";
import { site } from "@/lib/site";
import { getCategories } from "@/lib/posts";

export async function Header() {
  let categories: { name: string; count: number }[] = [];
  try {
    categories = (await getCategories()).slice(0, 6);
  } catch {
    categories = [];
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-content items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2 font-extrabold tracking-tight text-lg">
          <span className="inline-block h-5 w-5 rounded-md bg-accent" aria-hidden />
          <span>{site.name}</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-ink-soft md:flex">
          <Link href="/blog" className="transition hover:text-ink">
            전체 글
          </Link>
          {categories.map((c) => (
            <Link
              key={c.name}
              href={`/category/${encodeURIComponent(c.name)}`}
              className="transition hover:text-ink"
            >
              {c.name}
            </Link>
          ))}
        </nav>

        <Link
          href="/blog"
          className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          둘러보기
        </Link>
      </div>
    </header>
  );
}
