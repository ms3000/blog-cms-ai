import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAuthed } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureCategory } from "@/lib/save-post";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!isAuthed()) {
    return NextResponse.json({ ok: false, error: "인증이 필요합니다." }, { status: 401 });
  }

  let body: { slug?: string; category?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청입니다." }, { status: 400 });
  }

  const slug = String(body.slug || "").trim();
  const category = String(body.category || "").trim();
  if (!slug) {
    return NextResponse.json({ ok: false, error: "slug가 없습니다." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("posts")
    .update({ category: category || null })
    .eq("slug", slug);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  if (category) await ensureCategory(admin, category);

  revalidatePath("/", "layout");
  revalidatePath(`/blog/${slug}`);
  return NextResponse.json({ ok: true });
}
