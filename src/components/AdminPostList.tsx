"use client";

import { useState } from "react";
import type { PostCardData } from "@/lib/types";

export function AdminPostList({ initialPosts }: { initialPosts: PostCardData[] }) {
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

  if (posts.length === 0) {
    return <p className="text-ink-muted">아직 게시글이 없습니다.</p>;
  }

  return (
    <div>
      {msg && <p className="mb-3 text-sm text-ink-muted">{msg}</p>}
      <ul className="divide-y divide-line rounded-2xl border border-line">
        {posts.map((p) => (
          <li key={p.slug} className="flex items-center justify-between gap-3 px-4 py-3">
            <a
              href={`/blog/${p.slug}`}
              target="_blank"
              rel="noreferrer"
              className="min-w-0 flex-1 font-medium hover:text-accent line-clamp-1"
            >
              {p.title}
            </a>
            <span className="hidden shrink-0 text-xs text-ink-faint sm:inline">
              {p.category || "미분류"}
            </span>
            <button
              onClick={() => remove(p.slug, p.title)}
              disabled={busy === p.slug}
              className="shrink-0 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
            >
              {busy === p.slug ? "삭제 중…" : "삭제"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
