"use client";

import { useState } from "react";
import type { PostCardData } from "@/lib/types";

export function AdminPostList({
  initialPosts,
  categories,
}: {
  initialPosts: PostCardData[];
  categories: string[];
}) {
  const [posts, setPosts] = useState(initialPosts);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string>("");

  async function remove(slug: string, title: string) {
    if (!confirm(`"${title}" 글을 삭제할까요?\n삭제하면 되돌릴 수 없습니다.`)) return;
    setBusy(slug);
    setMsg("");
    try {
      const res = await fetch("/api/admin/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "삭제 실패");
      setPosts((prev) => prev.filter((p) => p.slug !== slug));
      setMsg(`삭제 완료${data.deletedImages ? ` (이미지 ${data.deletedImages}개 정리)` : ""}`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "삭제 중 오류가 발생했습니다.");
    } finally {
      setBusy(null);
    }
  }

  async function changeAuthor(slug: string, author: string) {
    const cur = posts.find((p) => p.slug === slug);
    if ((cur?.author || "") === author) return; // 변경 없음
    setBusy(slug);
    setMsg("");
    try {
      const res = await fetch("/api/admin/post-author", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, author }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "변경 실패");
      setPosts((prev) => prev.map((p) => (p.slug === slug ? { ...p, author: author || null } : p)));
      setMsg("작성자를 저장했어요.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "변경 중 오류가 발생했습니다.");
    } finally {
      setBusy(null);
    }
  }

  async function changeCategory(slug: string, category: string) {
    setBusy(slug);
    setMsg("");
    try {
      const res = await fetch("/api/admin/post-category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, category }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "변경 실패");
      setPosts((prev) =>
        prev.map((p) => (p.slug === slug ? { ...p, category: category || null } : p))
      );
      setMsg("카테고리를 변경했어요.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "변경 중 오류가 발생했습니다.");
    } finally {
      setBusy(null);
    }
  }

  if (posts.length === 0) {
    return <p className="text-ink-muted">아직 게시글이 없습니다.</p>;
  }

  return (
    <div>
      {msg && <p className="mb-3 text-sm text-ink-muted">{msg}</p>}
      <ul className="divide-y divide-line rounded-2xl border border-line">
        {posts.map((p) => (
          <li key={p.slug} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <a
              href={`/blog/${p.slug}`}
              target="_blank"
              rel="noreferrer"
              className="min-w-0 flex-1 font-medium hover:text-accent line-clamp-1"
            >
              {p.title}
            </a>

            <input
              type="text"
              defaultValue={p.author || ""}
              placeholder="작성자"
              disabled={busy === p.slug}
              onBlur={(e) => changeAuthor(p.slug, e.target.value.trim())}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              }}
              className="w-28 shrink-0 rounded-lg border border-line bg-white px-2 py-1.5 text-sm outline-none focus:border-accent"
              aria-label="작성자"
            />

            <select
              value={p.category || ""}
              onChange={(e) => changeCategory(p.slug, e.target.value)}
              disabled={busy === p.slug}
              className="shrink-0 rounded-lg border border-line bg-white px-2 py-1.5 text-sm outline-none focus:border-accent"
            >
              <option value="">미분류</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              {/* 현재 값이 목록에 없으면(직접 지정 등) 함께 표시 */}
              {p.category && !categories.includes(p.category) && (
                <option value={p.category}>{p.category}</option>
              )}
            </select>

            <a
              href={`/admin/edit/${encodeURIComponent(p.slug)}`}
              className="shrink-0 rounded-lg border border-line px-3 py-1.5 text-sm font-medium hover:bg-surface"
            >
              수정
            </a>

            <button
              onClick={() => remove(p.slug, p.title)}
              disabled={busy === p.slug}
              className="shrink-0 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
            >
              {busy === p.slug ? "처리 중…" : "삭제"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
