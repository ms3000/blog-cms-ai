"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Category = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  description: string | null;
};

export function AdminCategories({ initial }: { initial: Category[] }) {
  const router = useRouter();
  const [cats, setCats] = useState(initial);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

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
      setCats((c) => [
        ...c,
        { id: `tmp-${Date.now()}`, name, slug: name, sort_order: c.length + 1, description: null },
      ]);
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

  function startEdit(c: Category) {
    setEditing(c.id);
    setDraft(c.description || "");
  }

  async function saveDesc(id: string) {
    if (await call({ action: "describe", id, description: draft })) {
      setCats((c) => c.map((x) => (x.id === id ? { ...x, description: draft.trim() || null } : x)));
      setEditing(null);
    }
  }

  return (
    <div className="rounded-2xl border border-line p-5">
      <h2 className="text-lg font-bold">카테고리 관리</h2>
      <p className="mt-1 text-sm text-ink-muted">
        사이드바 메뉴 카테고리입니다. 순서·이름·삭제와 함께 <b>카테고리 설명</b>을 넣으면 해당 카테고리 페이지 상단에 표시돼요.
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
          <li key={c.id} className="px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="flex-1 truncate font-medium">{c.name}</span>
              <button onClick={() => move(c.id, "up")} disabled={busy || i === 0} className="rounded-md border border-line px-2 py-1 text-xs disabled:opacity-30" aria-label="위로">↑</button>
              <button onClick={() => move(c.id, "down")} disabled={busy || i === cats.length - 1} className="rounded-md border border-line px-2 py-1 text-xs disabled:opacity-30" aria-label="아래로">↓</button>
              <button onClick={() => (editing === c.id ? setEditing(null) : startEdit(c))} disabled={busy} className="rounded-md border border-line px-2.5 py-1 text-xs hover:bg-surface">설명</button>
              <button onClick={() => rename(c.id, c.name)} disabled={busy} className="rounded-md border border-line px-2.5 py-1 text-xs hover:bg-surface">이름변경</button>
              <button onClick={() => del(c.id, c.name)} disabled={busy} className="rounded-md border border-red-200 px-2.5 py-1 text-xs text-red-600 hover:bg-red-50">삭제</button>
            </div>

            {editing === c.id ? (
              <div className="mt-2">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={3}
                  placeholder="이 카테고리에 대한 설명을 입력하세요. (줄바꿈 가능)"
                  className="w-full resize-y rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-accent"
                />
                <div className="mt-1.5 flex gap-2">
                  <button onClick={() => saveDesc(c.id)} disabled={busy} className="rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-white">저장</button>
                  <button onClick={() => setEditing(null)} className="rounded-lg border border-line px-3 py-1.5 text-xs">취소</button>
                </div>
              </div>
            ) : (
              c.description && <p className="mt-1 line-clamp-2 text-xs text-ink-muted">{c.description}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
