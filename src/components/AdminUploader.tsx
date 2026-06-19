"use client";

import { useRef, useState } from "react";

type UploadResult = {
  name: string;
  ok: boolean;
  slug?: string;
  title?: string;
  error?: string;
  tags?: string[];
  imageCount?: number;
};

export function AdminUploader() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<UploadResult[]>([]);

  async function upload(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => /\.html?$/i.test(f.name));
    if (list.length === 0) return;

    setBusy(true);
    setResults([]);
    try {
      const fd = new FormData();
      for (const f of list) fd.append("files", f);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setResults([{ name: "요청", ok: false, error: data.error || "업로드 실패" }]);
      } else {
        setResults(data.results || []);
      }
    } catch (e) {
      setResults([{ name: "요청", ok: false, error: e instanceof Error ? e.message : "오류" }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files) upload(e.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-16 text-center transition ${
          dragging ? "border-accent bg-accent-soft" : "border-line bg-surface hover:border-ink-faint"
        }`}
      >
        <div className="text-4xl" aria-hidden>📄</div>
        <p className="mt-3 font-semibold">
          {busy ? "업로드 중…" : "HTML 파일을 끌어다 놓거나 클릭해서 선택"}
        </p>
        <p className="mt-1 text-sm text-ink-muted">여러 개 한 번에 업로드 가능 (.html)</p>
        <input
          ref={inputRef}
          type="file"
          accept=".html,.htm,text/html"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files) upload(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {busy && (
        <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-line">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-accent" />
        </div>
      )}

      {results.length > 0 && (
        <ul className="mt-6 space-y-2">
          {results.map((r, i) => (
            <li
              key={i}
              className={`rounded-xl border px-4 py-3 text-sm ${
                r.ok ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium line-clamp-1">{r.title || r.name}</span>
                {r.ok ? (
                  <a
                    href={`/blog/${r.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 font-semibold text-accent hover:underline"
                  >
                    보기 →
                  </a>
                ) : (
                  <span className="shrink-0 text-red-600">실패</span>
                )}
              </div>
              {r.ok ? (
                <div className="mt-1 text-xs text-ink-muted">
                  이미지 {r.imageCount ?? 0}개 처리
                  {r.tags && r.tags.length > 0 ? ` · 태그 ${r.tags.length}개` : ""}
                </div>
              ) : (
                <div className="mt-1 text-xs text-red-600">{r.error}</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
