export type Post = {
  id: string;
  slug: string;
  title: string;
  seo_title: string | null;
  excerpt: string | null;
  keywords: string | null;
  cover_url: string | null;
  cover_alt: string | null;
  content_html: string;
  category: string | null;
  author: string | null;
  publisher: string | null;
  json_ld: Record<string, unknown> | null;
  has_faq: boolean;
  has_howto: boolean;
  reading_minutes: number;
  status: string;
  published_at: string;
  updated_at: string;
  created_at: string;
};

/** 목록 카드에 필요한 최소 필드 */
export type PostCardData = Pick<
  Post,
  | "slug"
  | "title"
  | "excerpt"
  | "cover_url"
  | "cover_alt"
  | "category"
  | "author"
  | "published_at"
  | "reading_minutes"
>;

export type Tag = {
  id: string;
  name: string;
  slug: string;
};
