import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAuthed } from "@/lib/auth";
import { replacePostHtml } from "@/lib/save-post";

export const runtime = "nodejs";
export const maxDuration = 60;

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
  const file = form.get("file");
  if (!slug) return NextResponse.json({ ok: false, error: "slug가 없습니다." }, { status: 400 });
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ ok: false, error: "HTML 파일이 없습니다." }, { status: 400 });
  }

  try {
    const html = await file.text();
    if (!/<html|<article|<body/i.test(html)) throw new Error("HTML 형식이 아닙니다.");
    const res = await replacePostHtml(slug, html);
    revalidatePath("/", "layout");
    revalidatePath(`/blog/${slug}`);
    return NextResponse.json({ ok: true, ...res });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
