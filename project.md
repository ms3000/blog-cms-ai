# Blog CMS 프로젝트 문서

## 개요

상세페이지 자동화 프로그램으로 생성된 HTML 파일을 업로드하면 자동으로 메타데이터·이미지를 파싱하여 발행하는 SEO/GEO 최적화 블로그 CMS.

- **라이브 URL**: https://blog-cms-kappa-steel.vercel.app (레인보우CC 적용 도메인: rainbowcc.net)
- **GitHub (원본)**: https://github.com/ms3000/blog-cms
- **GitHub (복사본)**: https://github.com/ms3000/blog-cms-ai
- **관리자 페이지**: `/admin`

---

## 기술 스택

| 항목 | 기술 |
|---|---|
| 프레임워크 | Next.js 14 (App Router) |
| 언어 | TypeScript |
| 스타일 | Tailwind CSS |
| DB / 스토리지 | Supabase (Postgres + Storage) |
| 배포 | Vercel (git push → 자동 배포) |
| 웹폰트 | Pretendard (UI), Gowun Batang / Noto Sans KR (본문) |

---

## 환경변수 (Vercel 설정)

```
NEXT_PUBLIC_SUPABASE_URL        = Supabase 프로젝트 URL
NEXT_PUBLIC_SUPABASE_ANON_KEY   = anon key
SUPABASE_SERVICE_ROLE_KEY       = service_role key
NEXT_PUBLIC_SITE_URL            = https://도메인
ADMIN_PASSWORD_HASH             = 비밀번호 SHA256 해시
```

> `ADMIN_PASSWORD_HASH` 생성: `echo -n "비밀번호" | sha256sum`

---

## Supabase 구성

### 테이블

| 테이블 | 설명 |
|---|---|
| `posts` | 게시글 (slug, title, seo_title, excerpt, keywords, author, category, cover_url, content_html, content_css, view_count 등) |
| `tags` | 태그 (name, slug) |
| `post_tags` | 게시글-태그 중간 테이블 |
| `categories` | 카테고리 (name, description, sort_order) |
| `site_settings` | 사이트 설정 1행 (site_name, logo_url, footer_description, copyright, ga_measurement_id, ga_property_id, ga_service_account) |

### 스토리지

- 버킷명: `post-images` (Public)
- 용도: 업로드 HTML에서 추출한 이미지, 로고 이미지

### RPC 함수

- `increment_view(p_slug TEXT)` — 조회수 +1 (sessionStorage 중복 방지)

---

## 주요 기능

### 1. HTML 업로드 → 자동 발행
- 어드민 `/admin`에서 HTML 파일 업로드
- `src/lib/html-ingest.ts`가 파싱:
  - 제목: `.bp-title` → h1 → og:title
  - 카테고리: `.bp-eyebrow`
  - 태그: `.bp-tags span`
  - 이미지: base64 → Supabase Storage URL 변환
  - CSS: `<style>` 태그 추출 → 포스트별 저장
  - JSON-LD: BlogPosting / FAQPage / HowTo 자동 인식
  - slug: canonical URL에서 추출

### 2. 레이아웃
- 좌측 사이드바 + 본문이 `max-w-[1440px]`로 함께 중앙 정렬
- 푸터는 그룹 밖 — 배경이 화면 전체 폭으로 이어짐
- 모바일: 상단바 + 드로어 메뉴

### 3. 사이드바 (`src/components/SiteNav.tsx`)
- 로고 / 사이트명
- 카테고리 네비게이션 (글 수 표시)
- 전체 글 링크
- 기사 검색
- 인기 글 TOP 5
- 저작권 표시

### 4. 포스트 페이지 (`src/app/blog/[slug]/page.tsx`)
- 브레드크럼 (본문 카드 폭에 맞춰 정렬)
- 목차(TOC) — IntersectionObserver로 현재 위치 하이라이트
- 본문: 원본 CSS를 `.post-content.post-content` (높은 specificity)로 스코프 주입
- 태그 링크
- 공유 버튼 (링크 복사 / X / Facebook / 모바일 네이티브)
- 조회수 표시 (sessionStorage 중복 방지)
- 이전/다음 글 네비게이션
- 관련 글 (같은 카테고리)

### 5. 어드민 (`/admin`)
- **HTML 업로드**: 파일 선택 → 자동 파싱 발행
- **사이트 설정**: 로고, 사이트명, 푸터 소개문구, 저작권
- **Google Analytics 설정**: Measurement ID, Property ID, 서비스 계정 JSON
- **카테고리 관리**: 추가/삭제/순서변경/설명 편집
- **글 목록**: 저자·카테고리 인라인 수정, 삭제, 수정 페이지 이동
- **유입 분석 대시보드**: GA4 Data API 연동 (세션/사용자/페이지뷰/이탈률, 채널 분석, 인기 페이지)

### 6. 글 수정 (`/admin/edit/[slug]`)
- 제목, SEO 제목, 발췌, 저자, 카테고리, 커버 이미지 변경
- HTML 본문 교체 (새 파일 업로드)

### 7. SEO / GEO
- `generateMetadata` — 포스트별 title, description, keywords, OG, Twitter Card
- 루트 레이아웃도 DB 사이트명으로 동적 생성 (`generateMetadata` async)
- JSON-LD: BlogPosting + BreadcrumbList 자동 주입
- FAQPage / HowTo 스키마 자동 인식
- `/sitemap.xml` 자동 생성
- `/feed.xml` RSS 피드
- `/robots.txt`
- OG 타이틀 = `post.title` (어드민 수정 제목 즉시 반영)

### 8. 페이지네이션
- `/blog`, `/category/[name]`, `/tag/[slug]` — 12개/페이지
- `src/components/Pagination.tsx` — 말줄임(ellipsis) 포함

### 9. 검색
- `/search?q=검색어` — `searchPosts()` (title, excerpt, content_html ILIKE)

### 10. Google Analytics
- 어드민에서 Measurement ID 저장 → 전 페이지 `<head>`에 gtag.js 자동 주입
- GA4 Data API (서비스 계정 JWT 인증) → 어드민 유입 분석 대시보드

---

## 주요 파일 구조

```
src/
├── app/
│   ├── layout.tsx              # 루트 레이아웃 (generateMetadata로 DB 사이트명)
│   ├── page.tsx                # 홈 (카테고리별 포스트 섹션)
│   ├── blog/[slug]/page.tsx    # 포스트 상세
│   ├── category/[name]/page.tsx
│   ├── tag/[slug]/page.tsx
│   ├── search/page.tsx
│   ├── sitemap.ts
│   ├── feed.xml/route.ts
│   ├── robots.ts
│   └── admin/
│       ├── page.tsx            # 어드민 메인
│       ├── actions.ts          # 로그인/로그아웃 서버 액션
│       └── edit/[slug]/page.tsx
│   └── api/admin/
│       ├── upload/route.ts     # HTML 업로드
│       ├── post-update/route.ts
│       ├── post-replace/route.ts
│       ├── post-category/route.ts
│       ├── post-author/route.ts
│       ├── delete/route.ts
│       ├── categories/route.ts
│       ├── settings/route.ts
│       └── analytics/route.ts  # GA4 Data API 프록시
├── components/
│   ├── SiteNav.tsx             # 사이드바 (데스크톱) + 드로어 (모바일)
│   ├── Footer.tsx              # 푸터 (DB에서 로고/소개/저작권)
│   ├── PostCard.tsx            # 카드 컴포넌트
│   ├── Pagination.tsx
│   ├── TableOfContents.tsx
│   ├── ShareButtons.tsx
│   ├── ViewTracker.tsx
│   ├── Newsletter.tsx
│   ├── AdminUploader.tsx
│   ├── AdminPostList.tsx
│   ├── AdminEditPost.tsx
│   ├── AdminSettings.tsx       # 사이트설정 + GA 설정
│   ├── AdminCategories.tsx
│   └── AdminAnalytics.tsx      # 유입 분석 대시보드
└── lib/
    ├── site.ts                 # 기본 상수 (URL, locale 등)
    ├── settings.ts             # getSettings() → DB
    ├── posts.ts                # DB 쿼리 (getPosts, getPostBySlug 등)
    ├── categories.ts
    ├── html-ingest.ts          # HTML 파싱 핵심 로직
    ├── save-post.ts            # DB 저장 (savePostFromHtml 등)
    ├── css.ts                  # scopeCss() — @import 처리 포함
    ├── toc.ts                  # addHeadingIds()
    ├── seo.ts                  # buildJsonLd(), buildBreadcrumb()
    ├── format.ts               # slugify, formatDate, readingMinutes
    └── auth.ts                 # SHA256 쿠키 인증
```

---

## 알려진 기술 이슈 및 해결 내역

| 이슈 | 원인 | 해결 |
|---|---|---|
| Safari 세리프 폰트 | `var(--font-sans)` 미정의 | Pretendard 직접 지정 |
| `view_count.toLocaleString()` TypeError | 기존 포스트 undefined | `?? 0` 널 병합 |
| Vercel 배포 Blocked | git author email 불일치 | noreply email로 변경 |
| `@import url()` CSS 파싱 오류 | `;` 가 URL 파라미터 안에 있음 | @import 먼저 추출 후 처리 |
| 기본 CSS가 포스트 CSS 덮어씀 | specificity 충돌 | `.post-content.post-content` 이중 클래스 |
| 목록 불릿 사라짐 | Tailwind preflight | `list-style: disc` 명시 |
| 브레드크럼 폭 불일치 | 카드 폭과 별개 | `cardWidthFromCss()` 적용 |
| OG 타이틀이 사이트명으로 고정 | `seo_title` 우선 적용 | OG는 `post.title` 직접 사용 |
| 브라우저 탭이 WEDO 블로그 고정 | `metadata` 정적 export | `generateMetadata()` async로 교체 |

---

## 향후 작업 목록

- [ ] Google Search Console 등록 + 사이트맵 제출
- [ ] 네이버 웹마스터 등록
- [ ] Supabase 보안 경고 3건 해결 (newsletter INSERT 정책, storage 버킷 listing, function search_path)
- [ ] 중복 포스트 정리 (골프 글 2쌍 중복)
- [ ] blog-cms-ai 새 Supabase 프로젝트 연결 + Vercel 배포

---

## 복사 사이트 세팅 가이드 (blog-cms-ai)

### ① Supabase 새 프로젝트
1. supabase.com → New Project
2. SQL Editor → `schema.sql` 전체 붙여넣기 → Run
3. Storage → New Bucket → `post-images` → Public ON

### ② Vercel 새 프로젝트
1. vercel.com → Add New Project → `blog-cms-ai` 선택
2. 환경변수 입력 (새 Supabase 키로)
3. Deploy

### ③ 어드민 초기 설정
1. `/admin` 접속 → 사이트 이름/로고 변경
2. GA4 Measurement ID 입력 (선택)
