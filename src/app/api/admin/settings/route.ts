import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { isAuthed } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const BUCKET = "post-images";
const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "image/gif": "gif",
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

  const admin = createAdminClient();
  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  const siteName = String(form.get("site_name") || "").trim();
  if (siteName) update.site_name = siteName;

  if (form.has("footer_description")) {
    update.footer_description = String(form.get("footer_description") || "").trim() || null;
  }
  if (form.has("copyright")) {
    update.copyright = String(form.get("copyright") || "").trim() || null;
  }
  if (form.has("ga_measurement_id")) {
    update.ga_measurement_id = String(form.get("ga_measurement_id") || "").trim() || null;
  }
  if (form.has("ga_property_id")) {
    update.ga_property_id = String(form.get("ga_property_id") || "").trim() || null;
  }
  if (form.has("ga_service_account")) {
    const sa = String(form.get("ga_service_account") || "").trim();
    update.ga_service_account = sa || null;
  }

  if (form.get("remove_logo") === "1") {
    update.logo_url = null;
  }

  const logo = form.get("logo");
  if (logo instanceof File && logo.size > 0) {
    const buf = Buffer.from(await logo.arrayBuffer());
    const ext = EXT[logo.type] || "png";
    const hash = crypto.createHash("md5").update(buf).digest("hex").slice(0, 12);
    const path = `logos/${hash}.${ext}`;
    const { error } = await admin.storage
      .from(BUCKET)
      .upload(path, buf, { contentType: logo.type || "image/png", upsert: true, cacheControl: "31536000" });
    if (error && !/exists/i.test(error.message)) {
      return NextResponse.json({ ok: false, error: `로고 업로드 실패: ${error.message}` }, { status: 500 });
    }
    update.logo_url = admin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }

  const { error: upErr } = await admin.from("site_settings").update(update).eq("id", 1);
  if (upErr) {
    return NextResponse.json({ ok: false, error: `저장 실패: ${upErr.message}` }, { status: 500 });
  }

  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true, logo_url: update.logo_url });
}
