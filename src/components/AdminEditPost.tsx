"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type EditPost = {
  slug: string;
  title: string;
  seo_title: string | null;
  excerpt: string | null;
  author: string | null;
  category: string | null;
  cover_url: string | null;
};

export function AdminEditPost({ post, categories }: { post: EditPost; categories: string[] }) {
  const router = useRouter();
  const [title, setTitle] = useState(post.title);
  const [seoTitle, setSeoTitle] = useState(post.seo_title || "");
  const [excerpt, setExcerpt] = useState(post.excerpt || "");
  const [author, setAuthor] = useState(post.author || "");
  const [category, setCategory] = useState(post.category || "");
  const [cover, setCover] = useState<string | null>(post.cover_url);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const coverRef = useRef<HTMLInputElement>(null);
  const htmlRef = useRef<HTMLInputElement>(null);

  async function save() {
    setBusy(true);
    setMsg("");
    try {
      const fd = new FormData();
      fd.append("slug", post.slug);
      fd.append("title", title);
      fd.append("seo_title", seoTitle);
      fd.append("excerpt", excerpt);
      fd.append("author", author);
      fd.append("category", category);
      if (coverFile) fd.append("cover", coverFile);
      const res = await fetch("/api/admin/post-update", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "저장 실패");
      if (data.cover_url) setCover(data.cover_url);
      setCoverFile(null);
      setCoverPreview(null);
      setMsg("저장됐어요.");
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function replaceHtml(file: File) {
    if (!confirm("본문을 이 HTML로 교체할까요?\n(작성자·카테고리는 유지, 본문/이미지/태그는 새로 반영됩니다)")) return;
    setBusy(true);
    setMsg("");
    try {
      const fd = new FormData();
      fd.append("slug", post.slug);
      fd.append("file", file);
      const res = await fetch("/api/admin/post-replace", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "교체 실패");
      setMsg(`본문을 교체했어요. (이미지 ${data.imageCount ?? 0}개)`);
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  const shownCover = coverPreview || cover;

  return (
    <div className="space-y-6">
      {/* 기본 정보 */}
      <div className="rounded-2xl border border-line p-5">
        <h2 className="text-lg font-bold">기본 정보</h2>

        <label className="mt-4 block text-sm font-medium">제목</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full rounded-xl border border-line px-4 py-2.5 outline-none focus:border-accent" />

        <label className="mt-4 block text-sm font-medium">SEO 제목 (검색 결과 제목)</label>
        <input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)}
          placeholder="비우면 제목 사용"
          className="mt-1 w-full rounded-xl border border-line px-4 py-2.5 outline-none focus:border-accent" />

        <label className="mt-4 block text-sm font-medium">요약 (메타 설명)</label>
        <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={3}
          className="mt-1 w-full resize-y rounded-xl border border-line px-4 py-2.5 outline-none focus:border-accent" />

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">작성자</label>
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="WEDO"
              className="mt-1 w-full rounded-xl border border-line px-4 py-2.5 outline-none focus:border-accent" />
          </div>
          <div>
            <label className="block text-sm font-medium">카테고리</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-xl border border-line bg-white px-4 py-2.5 outline-none focus:border-accent">
              <option value="">미분류</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              {category && !categories.includes(category) && <option value={category}>{category}</option>}
            </select>
          </div>
        </div>

        <label className="mt-4 block text-sm font-medium">커버 이미지 (목록 썸네일/OG)</label>
        <div className="mt-1 flex items-center gap-4">
          <div className="h-20 w-32 overflow-hidden rounded-lg border border-line bg-surface">
            {shownCover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shownCover} alt="cover" className="h-full w-full object-cover" />
            ) : <div className="flex h-full w-full items-center justify-center text-xs text-ink-faint">없음</div>}
          </div>
          <button onClick={() => coverRef.current?.click()}
            className="rounded-lg border border-line px-3 py-1.5 text-sm hover:bg-surface">이미지 변경</button>
          <input ref={coverRef} type="file" accept="image/*" hidden
            onChange={(e) => { const f = e.target.files?.[0] || null; setCoverFile(f); setCoverPreview(f ? URL.createObjectURL(f) : null); }} />
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button onClick={save} disabled={busy}
            className="rounded-xl bg-ink px-5 py-2.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-50">
            {busy ? "저장 중…" : "저장"}
          </button>
          <a href={`/blog/${post.slug}`} target="_blank" rel="noreferrer" className="text-sm text-ink-muted hover:text-ink">글 보기 →</a>
          {msg && <span className="text-sm text-ink-muted">{msg}</span>}
        </div>
      </div>

      {/* 본문 HTML 교체 */}
      <div className="rounded-2xl border border-line p-5">
        <h2 className="text-lg font-bold">본문 교체</h2>
        <p className="mt-1 text-sm text-ink-muted">
          새 HTML 파일을 올리면 본문·이미지·태그·구조화데이터가 새로 반영됩니다. (주소·작성자·카테고리는 유지)
        </p>
        <button onClick={() => htmlRef.current?.click()} disabled={busy}
          className="mt-3 rounded-xl border border-line px-4 py-2.5 text-sm font-medium hover:bg-surface disabled:opacity-50">
          HTML 파일 선택
        </button>
        <input ref={htmlRef} type="file" accept=".html,.htm,text/html" hidden
          onChange={(e) => { const f = e.target.files?.[0]; if (f) replaceHtml(f); e.target.value = ""; }} />
      </div>
    </div>
  );
}
