# WEDO 블로그 CMS

상세페이지 자동화 프로그램으로 생성한 HTML을 **그대로 업로드**하면, 메타·태그·이미지가 자동 처리되어 발행되는 **SEO·GEO 최적화 블로그 CMS**.

## 스택
- **Next.js 14 (App Router) + TypeScript + Tailwind CSS**
- **Supabase** (Postgres + Storage)
- 배포: Vercel (1차) → Cafe24 (추후)

## 핵심 기능
1. **HTML 업로드 발행** — `/admin` 에서 드래그앤드롭. `<head>` 메타·JSON-LD·본문 자동 파싱
2. **이미지 자동 분리** — base64 이미지를 Supabase Storage 로 분리, URL 치환 (페이지 경량화)
3. **SEO** — 포스트별 메타태그·OG·Twitter Card·canonical, `sitemap.xml`·`robots.txt`·`feed.xml`(RSS)
4. **GEO** — JSON-LD `@graph`(BlogPosting + FAQPage + HowTo) 재구성, AI 검색 인용 최적화
5. **미니멀 디자인** — 화이트 카드 그리드, 카테고리/태그, 뉴스레터

## 로컬 실행
```bash
npm install
# .env.local 설정 (아래 참고)
npm run dev      # 개발
npm run build && npm run start   # 프로덕션
```

## 환경변수 (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://hlsulrqehngcrbyelplx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable key>
SUPABASE_SERVICE_ROLE_KEY=<service_role secret>   # 서버 전용, 업로드에 필요
NEXT_PUBLIC_SITE_URL=https://your-domain.com       # 배포 도메인 (canonical 기준)
NEXT_PUBLIC_SITE_NAME=WEDO 블로그
ADMIN_PASSWORD=<관리자 비밀번호>
```
> `service_role` 키: Supabase 대시보드 → Project Settings → API → `service_role` (secret)

## 구조
```
src/
├─ app/
│  ├─ page.tsx                  # 홈 (피처드 + 카드 그리드)
│  ├─ blog/page.tsx             # 전체 글
│  ├─ blog/[slug]/page.tsx      # 포스트 상세 (+ JSON-LD)
│  ├─ category/[category]/      # 카테고리
│  ├─ tag/[slug]/               # 태그
│  ├─ admin/                    # 관리자 (로그인 + 업로드)
│  ├─ api/admin/upload/         # 업로드 처리 API
│  ├─ api/newsletter/           # 구독 API
│  ├─ sitemap.ts / robots.ts / feed.xml/   # SEO
├─ components/                  # Header, Footer, PostCard, Newsletter ...
└─ lib/
   ├─ html-ingest.ts            # ★ HTML 파서 (메타/JSON-LD/본문/이미지)
   ├─ save-post.ts              # 이미지 업로드 + DB 저장
   ├─ posts.ts                  # 데이터 조회
   ├─ seo.ts                    # JSON-LD / breadcrumb 빌더
   └─ supabase/                 # 클라이언트 (public / admin)
```

## 배포 (Vercel)
1. GitHub 저장소 연결
2. 환경변수 등록 (위 항목 전부, `NEXT_PUBLIC_SITE_URL` 은 실제 도메인)
3. Deploy → 업로드 즉시 게시 반영 (revalidate)

## Cafe24 이전 (추후)
- Node 지원 서버: `npm run build && npm run start` 그대로 운영
- 정적 호스팅만 가능: `next.config` 에 `output: 'export'` 추가 후 정적 빌드 → FTP 업로드 (업로드 시 재빌드 필요)
