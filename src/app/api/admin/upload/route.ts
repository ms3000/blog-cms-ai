import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAuthed } from "@/lib/auth";
import { savePostFromHtml } from "@/lib/save-post";

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

  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ ok: false, error: "HTML 파일이 없습니다." }, { status: 400 });
  }

  const results: { name: string; ok: boolean; slug?: string; title?: string; error?: string; tags?: string[]; imageCount?: number }[] = [];

  for (const file of files) {
    try {
      const html = await file.text();
      if (!/<html|<article|<body/i.test(html)) {
        throw new Error("HTML 형식이 아닙니다.");
      }
      const saved = await savePostFromHtml(html);
      results.push({
        name: file.name,
        ok: true,
        slug: saved.slug,
        title: saved.title,
        tags: saved.tags,
        imageCount: saved.imageCount,
      });
    } catch (e) {
      results.push({ name: file.name, ok: false, error: e instanceof Error ? e.message : String(e) });
    }
  }

  // 캐시 갱신 → 즉시 게시 반영 (홈/목록/카테고리/태그/사이트맵/피드 전체)
  revalidatePath("/", "layout");
  revalidatePath("/sitemap.xml");
  revalidatePath("/feed.xml");
  for (const r of results) if (r.ok && r.slug) revalidatePath(`/blog/${r.slug}`);

  const okCount = results.filter((r) => r.ok).length;
  return NextResponse.json({ ok: okCount > 0, count: okCount, results });
}
