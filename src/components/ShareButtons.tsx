"use client";

import { useState } from "react";

export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        /* cancelled */
      }
    } else {
      copy();
    }
  }

  const x = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-ink-muted">공유</span>
      <button
        onClick={copy}
        className="rounded-full border border-line px-3 py-1.5 text-sm transition hover:bg-surface"
      >
        {copied ? "복사됨 ✓" : "링크 복사"}
      </button>
      <a
        href={x}
        target="_blank"
        rel="noreferrer"
        className="rounded-full border border-line px-3 py-1.5 text-sm transition hover:bg-surface"
      >
        X(트위터)
      </a>
      <a
        href={fb}
        target="_blank"
        rel="noreferrer"
        className="rounded-full border border-line px-3 py-1.5 text-sm transition hover:bg-surface"
      >
        페이스북
      </a>
      <button
        onClick={nativeShare}
        className="rounded-full border border-line px-3 py-1.5 text-sm transition hover:bg-surface sm:hidden"
      >
        기타…
      </button>
    </div>
  );
}
