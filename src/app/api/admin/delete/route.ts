import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAuthed } from "@/lib/auth";
import { deletePostBySlug } from "@/lib/delete-post";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!isAuthed()) {
    return NextResponse.json({ ok: false, error: "인증이 필요합니다." }, { status: 401 });
  }

  let slug = "";
  try {
    const body = await req.json();
    slug = String(body.slug || "").trim();
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청입니다." }, { status: 400 });
  }
  if (!slug) {
    return NextResponse.json({ ok: false, error: "slug 가 없습니다." }, { status: 400 });
  }

  try {
    const { deletedImages } = await deletePostBySlug(slug);
    // 캐시 갱신 (홈/목록/카테고리/태그/사이트맵/피드)
    revalidatePath("/", "layout");
    revalidatePath("/sitemap.xml");
    revalidatePath("/feed.xml");
    revalidatePath(`/blog/${slug}`);
    return NextResponse.json({ ok: true, deletedImages });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
