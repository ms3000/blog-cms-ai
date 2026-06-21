import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { isAuthed } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureCategory } from "@/lib/save-post";

export const runtime = "nodejs";

const BUCKET = "post-images";
const EXT: Record<string, string> = {
  "image/png": "png", "image/jpeg": "jpg", "image/jpg": "jpg",
  "image/webp": "webp", "image/gif": "gif", "image/avif": "avif",
};

export async function POST(req: Request) {
  if (!isAuthed()) {
    return NextResponse.json({ ok: false, error: "인증이 필요합니다." }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청입니다." }, { status: 400 });
  }

  const slug = String(form.get("slug") || "").trim();
  if (!slug) return NextResponse.json({ ok: false, error: "slug가 없습니다." }, { status: 400 });

  const admin = createAdminClient();
  const update: Record<string, unknown> = {
    title: String(form.get("title") || "").trim() || "제목 없음",
    seo_title: String(form.get("seo_title") || "").trim() || null,
    excerpt: String(form.get("excerpt") || "").trim() || null,
    author: String(form.get("author") || "").trim() || null,
    category: String(form.get("category") || "").trim() || null,
  };

  const cover = form.get("cover");
  if (cover instanceof File && cover.size > 0) {
    const buf = Buffer.from(await cover.arrayBuffer());
    const ext = EXT[cover.type] || "jpg";
    const hash = crypto.createHash("md5").update(buf).digest("hex").slice(0, 16);
    const path = `images/${hash}.${ext}`;
    const { error } = await admin.storage
      .from(BUCKET)
      .upload(path, buf, { contentType: cover.type || "image/jpeg", upsert: true, cacheControl: "31536000" });
    if (error && !/exists/i.test(error.message)) {
      return NextResponse.json({ ok: false, error: `커버 업로드 실패: ${error.message}` }, { status: 500 });
    }
    update.cover_url = admin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }

  const { error: upErr } = await admin.from("posts").update(update).eq("slug", slug);
  if (upErr) return NextResponse.json({ ok: false, error: upErr.message }, { status: 500 });

  if (update.category) await ensureCategory(admin, String(update.category));

  revalidatePath("/", "layout");
  revalidatePath(`/blog/${slug}`);
  return NextResponse.json({ ok: true, cover_url: update.cover_url });
}
