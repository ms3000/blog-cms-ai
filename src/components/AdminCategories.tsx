"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Category = { id: string; name: string; slug: string; sort_order: number };

export function AdminCategories({ initial }: { initial: Category[] }) {
  const router = useRouter();
  const [cats, setCats] = useState(initial);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function call(payload: Record<string, unknown>) {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "실패");
      router.refresh();
      return true;
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "오류");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function add() {
    const name = newName.trim();
    if (!name) return;
    if (await call({ action: "create", name })) {
      setCats((c) => [...c, { id: `tmp-${Date.now()}`, name, slug: name, sort_order: c.length + 1 }]);
      setNewName("");
    }
  }

  async function rename(id: string, oldName: string) {
    const name = prompt("새 카테고리 이름", oldName);
    if (name == null) return;
    const trimmed = name.trim();
    if (!trimmed || trimmed === oldName) return;
    if (await call({ action: "rename", id, name: trimmed })) {
      setCats((c) => c.map((x) => (x.id === id ? { ...x, name: trimmed } : x)));
    }
  }

  async function del(id: string, name: string) {
    if (!confirm(`"${name}" 카테고리를 삭제할까요?\n이 카테고리의 글들은 '미분류'가 됩니다.`)) return;
    if (await call({ action: "delete", id })) {
      setCats((c) => c.filter((x) => x.id !== id));
    }
  }

  async function move(id: string, dir: "up" | "down") {
    const idx = cats.findIndex((c) => c.id === id);
    const swap = dir === "up" ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= cats.length) return;
    if (await call({ action: "reorder", id, dir })) {
      const next = [...cats];
      [next[idx], next[swap]] = [next[swap], next[idx]];
      setCats(next);
    }
  }

  return (
    <div className="rounded-2xl border border-line p-5">
      <h2 className="text-lg font-bold">카테고리 관리</h2>
      <p className="mt-1 text-sm text-ink-muted">
        사이드바 메뉴에 보이는 카테고리입니다. 순서를 바꾸거나 이름을 수정/삭제할 수 있어요.
      </p>

      <div className="mt-4 flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="새 카테고리 이름"
          className="flex-1 rounded-xl border border-line px-4 py-2.5 outline-none focus:border-accent"
        />
        <button
          onClick={add}
          disabled={busy}
          className="rounded-xl bg-ink px-4 py-2.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          추가
        </button>
      </div>

      {msg && <p className="mt-3 text-sm text-red-600">{msg}</p>}

      <ul className="mt-4 divide-y divide-line rounded-xl border border-line">
        {cats.length === 0 && <li className="px-4 py-3 text-sm text-ink-muted">카테고리가 없습니다.</li>}
        {cats.map((c, i) => (
          <li key={c.id} className="flex items-center gap-2 px-4 py-2.5">
            <span className="flex-1 font-medium">{c.name}</span>
            <button
              onClick={() => move(c.id, "up")}
              disabled={busy || i === 0}
              className="rounded-md border border-line px-2 py-1 text-xs disabled:opacity-30"
              aria-label="위로"
            >
              ↑
            </button>
            <button
              onClick={() => move(c.id, "down")}
              disabled={busy || i === cats.length - 1}
              className="rounded-md border border-line px-2 py-1 text-xs disabled:opacity-30"
              aria-label="아래로"
            >
              ↓
            </button>
            <button
              onClick={() => rename(c.id, c.name)}
              disabled={busy}
              className="rounded-md border border-line px-2.5 py-1 text-xs hover:bg-surface"
            >
              이름변경
            </button>
            <button
              onClick={() => del(c.id, c.name)}
              disabled={busy}
              className="rounded-md border border-red-200 px-2.5 py-1 text-xs text-red-600 hover:bg-red-50"
            >
              삭제
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
