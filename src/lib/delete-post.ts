import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "post-images";

/** content_html / cover_url 에서 스토리지 경로(images/<hash>.<ext>)들을 추출 */
function extractImagePaths(html: string, coverUrl: string | null): string[] {
  const set = new Set<string>();
  const re = /post-images\/(images\/[A-Za-z0-9._-]+)/g;
  let m: RegExpExecArray | null;
  const haystack = (html || "") + " " + (coverUrl || "");
  while ((m = re.exec(haystack))) set.add(m[1]);
  return [...set];
}

export async function deletePostBySlug(slug: string): Promise<{ deletedImages: number }> {
  const admin = createAdminClient();

  const { data: post, error: findErr } = await admin
    .from("posts")
    .select("id, content_html, cover_url")
    .eq("slug", slug)
    .maybeSingle();
  if (findErr) throw new Error(`조회 실패: ${findErr.message}`);
  if (!post) throw new Error("글을 찾을 수 없습니다.");

  const imagePaths = extractImagePaths(post.content_html, post.cover_url);

  // 글 삭제 (post_tags 는 FK cascade 로 함께 삭제됨)
  const { error: delErr } = await admin.from("posts").delete().eq("id", post.id);
  if (delErr) throw new Error(`삭제 실패: ${delErr.message}`);

  // 다른 글에서 더 이상 쓰이지 않는 이미지만 스토리지에서 제거
  const orphans: string[] = [];
  for (const path of imagePaths) {
    const filename = path.split("/").pop() || path;
    const { count, error } = await admin
      .from("posts")
      .select("id", { count: "exact", head: true })
      .or(`content_html.ilike.%${filename}%,cover_url.ilike.%${filename}%`);
    if (error) continue; // 확인 실패 시 안전하게 보존
    if ((count ?? 0) === 0) orphans.push(path);
  }
  if (orphans.length > 0) {
    await admin.storage.from(BUCKET).remove(orphans);
  }

  return { deletedImages: orphans.length };
}
