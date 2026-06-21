import { createAdminClient } from "@/lib/supabase/admin";
import { ingestHtml, type ParsedImage } from "@/lib/html-ingest";
import { slugify } from "@/lib/format";

const BUCKET = "post-images";

export type SaveResult = {
  id: string;
  slug: string;
  title: string;
  tags: string[];
  imageCount: number;
};

export async function savePostFromHtml(html: string): Promise<SaveResult> {
  const admin = createAdminClient();
  let imageCount = 0;

  const uploadImage = async (img: ParsedImage): Promise<string> => {
    const path = `images/${img.hash}.${img.ext}`;
    const contentType = `image/${img.ext === "jpg" ? "jpeg" : img.ext}`;
    const { error } = await admin.storage
      .from(BUCKET)
      .upload(path, img.buffer, { contentType, upsert: true, cacheControl: "31536000" });
    if (error && !/exists/i.test(error.message)) {
      throw new Error(`이미지 업로드 실패: ${error.message}`);
    }
    imageCount++;
    return admin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  };

  const parsed = await ingestHtml(html, uploadImage);

  // 슬러그 중복 처리
  const slug = await ensureUniqueSlug(admin, parsed.slug);

  const { data: inserted, error: insErr } = await admin
    .from("posts")
    .insert({
      slug,
      title: parsed.title,
      seo_title: parsed.seo_title,
      excerpt: parsed.excerpt,
      keywords: parsed.keywords,
      cover_url: parsed.cover_url,
      cover_alt: parsed.cover_alt,
      content_html: parsed.content_html,
      content_css: parsed.content_css,
      category: parsed.category,
      author: parsed.author,
      publisher: parsed.publisher,
      json_ld: parsed.json_ld,
      has_faq: parsed.has_faq,
      has_howto: parsed.has_howto,
      reading_minutes: parsed.reading_minutes,
      status: "published",
      published_at: parsed.published_at || new Date().toISOString(),
    })
    .select("id, slug, title")
    .single();
  if (insErr) throw new Error(`글 저장 실패: ${insErr.message}`);

  // 태그 연결
  await linkTags(admin, inserted.id, parsed.tags);

  // 카테고리를 관리 목록에 자동 등록
  if (parsed.category) await ensureCategory(admin, parsed.category);

  return {
    id: inserted.id,
    slug: inserted.slug,
    title: inserted.title,
    tags: parsed.tags,
    imageCount,
  };
}

/** 카테고리명을 categories 테이블에 없으면 추가 (맨 뒤 순서로) */
export async function ensureCategory(
  admin: ReturnType<typeof createAdminClient>,
  name: string
): Promise<void> {
  const clean = name.trim();
  if (!clean) return;
  const { data: existing } = await admin
    .from("categories")
    .select("id")
    .eq("name", clean)
    .maybeSingle();
  if (existing) return;
  const { data: last } = await admin
    .from("categories")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = ((last?.sort_order as number) ?? 0) + 1;
  await admin
    .from("categories")
    .insert({ name: clean, slug: slugify(clean) || clean, sort_order: nextOrder });
}

/** 기존 글(slug 유지)의 본문을 새 HTML 로 교체. 이미지·태그·구조화데이터 재처리. */
export async function replacePostHtml(slug: string, html: string): Promise<SaveResult> {
  const admin = createAdminClient();

  const { data: existing, error: findErr } = await admin
    .from("posts")
    .select("id, category, author")
    .eq("slug", slug)
    .maybeSingle();
  if (findErr) throw new Error(`조회 실패: ${findErr.message}`);
  if (!existing) throw new Error("글을 찾을 수 없습니다.");

  let imageCount = 0;
  const uploadImage = async (img: ParsedImage): Promise<string> => {
    const path = `images/${img.hash}.${img.ext}`;
    const contentType = `image/${img.ext === "jpg" ? "jpeg" : img.ext}`;
    const { error } = await admin.storage
      .from(BUCKET)
      .upload(path, img.buffer, { contentType, upsert: true, cacheControl: "31536000" });
    if (error && !/exists/i.test(error.message)) throw new Error(`이미지 업로드 실패: ${error.message}`);
    imageCount++;
    return admin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  };

  const parsed = await ingestHtml(html, uploadImage);

  const { error: upErr } = await admin
    .from("posts")
    .update({
      title: parsed.title,
      seo_title: parsed.seo_title,
      excerpt: parsed.excerpt,
      keywords: parsed.keywords,
      cover_url: parsed.cover_url,
      cover_alt: parsed.cover_alt,
      content_html: parsed.content_html,
      content_css: parsed.content_css,
      json_ld: parsed.json_ld,
      has_faq: parsed.has_faq,
      has_howto: parsed.has_howto,
      reading_minutes: parsed.reading_minutes,
      // category/author 는 사용자가 지정한 값 유지
    })
    .eq("id", existing.id);
  if (upErr) throw new Error(`본문 교체 실패: ${upErr.message}`);

  // 태그 재연결 (기존 태그 링크 제거 후 새로)
  await admin.from("post_tags").delete().eq("post_id", existing.id);
  await linkTags(admin, existing.id, parsed.tags);

  return { id: existing.id, slug, title: parsed.title, tags: parsed.tags, imageCount };
}

async function ensureUniqueSlug(
  admin: ReturnType<typeof createAdminClient>,
  base: string
): Promise<string> {
  let candidate = base;
  for (let i = 2; i < 100; i++) {
    const { data } = await admin.from("posts").select("id").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
    candidate = `${base}-${i}`;
  }
  return `${base}-${Date.now()}`;
}

async function linkTags(
  admin: ReturnType<typeof createAdminClient>,
  postId: string,
  tags: string[]
): Promise<void> {
  for (const name of tags) {
    const clean = name.trim();
    if (!clean) continue;
    const tagSlug = slugify(clean);
    // upsert by slug
    const { data: existing } = await admin
      .from("tags")
      .select("id")
      .eq("slug", tagSlug)
      .maybeSingle();

    let tagId = existing?.id as string | undefined;
    if (!tagId) {
      const { data: created, error } = await admin
        .from("tags")
        .insert({ name: clean, slug: tagSlug })
        .select("id")
        .single();
      if (error) {
        // 경합으로 이미 생성됐다면 재조회
        const { data: again } = await admin
          .from("tags")
          .select("id")
          .eq("slug", tagSlug)
          .maybeSingle();
        tagId = again?.id as string | undefined;
      } else {
        tagId = created.id;
      }
    }
    if (!tagId) continue;
    await admin.from("post_tags").upsert(
      { post_id: postId, tag_id: tagId },
      { onConflict: "post_id,tag_id", ignoreDuplicates: true }
    );
  }
}
