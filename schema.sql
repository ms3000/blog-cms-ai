-- ============================================================
-- blog-cms-ai  Supabase 초기 스키마
-- Supabase Dashboard > SQL Editor 에 전체 붙여넣기 후 실행
-- ============================================================

-- ── 1. 포스트 ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.posts (
  id               BIGSERIAL PRIMARY KEY,
  slug             TEXT        NOT NULL UNIQUE,
  title            TEXT        NOT NULL,
  seo_title        TEXT,
  excerpt          TEXT,
  keywords         TEXT,
  author           TEXT,
  category         TEXT,
  cover_url        TEXT,
  cover_alt        TEXT,
  content_html     TEXT        NOT NULL DEFAULT '',
  content_css      TEXT,
  json_ld          JSONB,
  has_faq          BOOLEAN     NOT NULL DEFAULT FALSE,
  has_howto        BOOLEAN     NOT NULL DEFAULT FALSE,
  reading_minutes  INTEGER     NOT NULL DEFAULT 0,
  view_count       INTEGER     NOT NULL DEFAULT 0,
  published_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2. 태그 ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tags (
  id         BIGSERIAL PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,
  slug       TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 3. 포스트-태그 중간 테이블 ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.post_tags (
  post_id BIGINT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  tag_id  BIGINT NOT NULL REFERENCES public.tags(id)  ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- ── 4. 카테고리 관리 ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.categories (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT        NOT NULL UNIQUE,
  description TEXT,
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 5. 사이트 설정 ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.site_settings (
  id                  INTEGER     PRIMARY KEY DEFAULT 1,
  site_name           TEXT        NOT NULL DEFAULT '내 블로그',
  logo_url            TEXT,
  footer_description  TEXT,
  copyright           TEXT,
  ga_measurement_id   TEXT,
  ga_property_id      TEXT,
  ga_service_account  TEXT,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- 설정 행 초기 삽입 (없으면 insert)
INSERT INTO public.site_settings (id, site_name)
VALUES (1, '내 블로그')
ON CONFLICT (id) DO NOTHING;

-- ── 6. 조회수 증가 함수 ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.increment_view(p_slug TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.posts SET view_count = view_count + 1 WHERE slug = p_slug;
END;
$$;

-- ── 7. RLS 활성화 ────────────────────────────────────────────
ALTER TABLE public.posts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_tags     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- 공개 읽기 정책
CREATE POLICY "public read posts"         ON public.posts         FOR SELECT USING (TRUE);
CREATE POLICY "public read tags"          ON public.tags          FOR SELECT USING (TRUE);
CREATE POLICY "public read post_tags"     ON public.post_tags     FOR SELECT USING (TRUE);
CREATE POLICY "public read categories"    ON public.categories    FOR SELECT USING (TRUE);
CREATE POLICY "public read site_settings" ON public.site_settings FOR SELECT USING (TRUE);

-- ── 8. 스토리지 버킷 ─────────────────────────────────────────
-- Supabase Dashboard > Storage > New bucket
-- 이름: post-images  /  Public bucket: ON
-- (SQL 로는 생성이 안 되므로 대시보드에서 수동 생성)

-- ── 완료 ──────────────────────────────────────────────────────
-- 다음 단계:
-- 1. Storage > post-images 버킷 생성 (Public)
-- 2. Vercel 환경변수 설정 후 배포
