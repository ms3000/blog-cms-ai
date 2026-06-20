import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAuthed } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/format";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!isAuthed()) {
    return NextResponse.json({ ok: false, error: "인증이 필요합니다." }, { status: 401 });
  }

  let body: { action?: string; id?: string; name?: string; dir?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청입니다." }, { status: 400 });
  }

  const admin = createAdminClient();
  const action = body.action;

  try {
    if (action === "create") {
      const name = String(body.name || "").trim();
      if (!name) throw new Error("카테고리 이름을 입력하세요.");
      const { data: last } = await admin
        .from("categories")
        .select("sort_order")
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle();
      const nextOrder = ((last?.sort_order as number) ?? 0) + 1;
      const { error } = await admin
        .from("categories")
        .insert({ name, slug: slugify(name) || name, sort_order: nextOrder });
      if (error) throw new Error(/duplicate|unique/i.test(error.message) ? "이미 있는 카테고리예요." : error.message);
    } else if (action === "rename") {
      const id = String(body.id || "");
      const name = String(body.name || "").trim();
      if (!id || !name) throw new Error("입력이 올바르지 않습니다.");
      const { data: cur } = await admin.from("categories").select("name").eq("id", id).maybeSingle();
      const { error } = await admin
        .from("categories")
        .update({ name, slug: slugify(name) || name })
        .eq("id", id);
      if (error) throw new Error(/duplicate|unique/i.test(error.message) ? "이미 있는 이름이에요." : error.message);
      // 글들의 카테고리명도 함께 변경
      if (cur?.name && cur.name !== name) {
        await admin.from("posts").update({ category: name }).eq("category", cur.name);
      }
    } else if (action === "delete") {
      const id = String(body.id || "");
      if (!id) throw new Error("id가 없습니다.");
      const { data: cur } = await admin.from("categories").select("name").eq("id", id).maybeSingle();
      const { error } = await admin.from("categories").delete().eq("id", id);
      if (error) throw new Error(error.message);
      // 해당 카테고리 글은 미분류 처리
      if (cur?.name) await admin.from("posts").update({ category: null }).eq("category", cur.name);
    } else if (action === "reorder") {
      const id = String(body.id || "");
      const dir = body.dir === "up" ? "up" : "down";
      const { data: all } = await admin
        .from("categories")
        .select("id, sort_order")
        .order("sort_order", { ascending: true });
      const list = (all ?? []) as { id: string; sort_order: number }[];
      const idx = list.findIndex((c) => c.id === id);
      if (idx === -1) throw new Error("카테고리를 찾을 수 없습니다.");
      const swapIdx = dir === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= list.length) {
        return NextResponse.json({ ok: true }); // 끝이라 이동 없음
      }
      const a = list[idx];
      const b = list[swapIdx];
      await admin.from("categories").update({ sort_order: b.sort_order }).eq("id", a.id);
      await admin.from("categories").update({ sort_order: a.sort_order }).eq("id", b.id);
    } else {
      throw new Error("알 수 없는 작업입니다.");
    }
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 400 }
    );
  }

  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
