"use client";

import { useState } from "react";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "구독에 실패했습니다.");
      setState("done");
      setMsg("구독 완료! 새 글을 보내드릴게요.");
      setEmail("");
    } catch (err) {
      setState("error");
      setMsg(err instanceof Error ? err.message : "오류가 발생했습니다.");
    }
  }

  return (
    <section className="mx-auto max-w-content px-5">
      <div className="rounded-3xl bg-ink px-6 py-12 text-center text-white md:px-12">
        <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">
          새 글을 가장 먼저 받아보세요
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-white/70">
          이메일을 남기시면 새로운 콘텐츠가 올라올 때 알려드립니다.
        </p>
        <form onSubmit={submit} className="mx-auto mt-7 flex max-w-md flex-col gap-3 sm:flex-row">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="flex-1 rounded-full border-0 px-5 py-3 text-ink outline-none ring-2 ring-transparent focus:ring-accent"
          />
          <button
            type="submit"
            disabled={state === "loading"}
            className="rounded-full bg-accent px-6 py-3 font-semibold transition hover:opacity-90 disabled:opacity-50"
          >
            {state === "loading" ? "구독 중…" : "구독하기"}
          </button>
        </form>
        {msg && (
          <p className={`mt-4 text-sm ${state === "error" ? "text-red-300" : "text-white/80"}`}>
            {msg}
          </p>
        )}
      </div>
    </section>
  );
}
