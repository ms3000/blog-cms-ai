import { isAuthed } from "@/lib/auth";
import { loginAction, logoutAction } from "./actions";
import { AdminUploader } from "@/components/AdminUploader";
import { getPosts } from "@/lib/posts";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "관리자",
  robots: { index: false, follow: false },
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  if (!isAuthed()) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-5">
        <h1 className="text-2xl font-extrabold tracking-tight">관리자 로그인</h1>
        <p className="mt-2 text-sm text-ink-muted">업로드를 위해 비밀번호를 입력하세요.</p>
        <form action={loginAction} className="mt-6 space-y-3">
          <input
            type="password"
            name="password"
            required
            placeholder="비밀번호"
            className="w-full rounded-xl border border-line px-4 py-3 outline-none focus:border-accent"
          />
          {searchParams.error && (
            <p className="text-sm text-red-500">비밀번호가 올바르지 않습니다.</p>
          )}
          <button
            type="submit"
            className="w-full rounded-xl bg-ink px-4 py-3 font-semibold text-white transition hover:opacity-90"
          >
            로그인
          </button>
        </form>
      </div>
    );
  }

  const recent = await getPosts({ limit: 10 }).catch(() => []);

  return (
    <div className="mx-auto max-w-content px-5 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight">콘텐츠 업로드</h1>
        <form action={logoutAction}>
          <button className="text-sm text-ink-muted hover:text-ink">로그아웃</button>
        </form>
      </div>
      <p className="mt-2 text-sm text-ink-muted">
        상세페이지 자동화 프로그램으로 만든 HTML 파일을 올리면 메타·태그·이미지가 자동 처리되어 게시됩니다.
      </p>

      <div className="mt-8">
        <AdminUploader />
      </div>

      <div className="mt-14">
        <h2 className="mb-4 text-lg font-bold">최근 게시글</h2>
        {recent.length === 0 ? (
          <p className="text-ink-muted">아직 게시글이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-line rounded-2xl border border-line">
            {recent.map((p) => (
              <li key={p.slug} className="flex items-center justify-between px-4 py-3">
                <a href={`/blog/${p.slug}`} className="font-medium hover:text-accent line-clamp-1">
                  {p.title}
                </a>
                <span className="ml-4 shrink-0 text-xs text-ink-faint">
                  {p.category || "미분류"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
