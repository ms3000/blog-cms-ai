import { isAuthed } from "@/lib/auth";
import { loginAction, logoutAction } from "./actions";
import { AdminUploader } from "@/components/AdminUploader";
import { AdminPostList } from "@/components/AdminPostList";
import { AdminSettings } from "@/components/AdminSettings";
import { AdminCategories } from "@/components/AdminCategories";
import { getPosts } from "@/lib/posts";
import { getSettings } from "@/lib/settings";
import { getManagedCategories } from "@/lib/categories";

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

  const [recent, settings, managed] = await Promise.all([
    getPosts({ limit: 50 }).catch(() => []),
    getSettings(),
    getManagedCategories().catch(() => []),
  ]);
  const categoryNames = managed.map((c) => c.name);

  return (
    <div className="mx-auto max-w-content px-5 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight">관리자</h1>
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

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <AdminSettings initialName={settings.siteName} initialLogo={settings.logoUrl} />
        <AdminCategories initial={managed} />
      </div>

      <div className="mt-14">
        <h2 className="mb-4 text-lg font-bold">최근 게시글</h2>
        <AdminPostList initialPosts={recent} categories={categoryNames} />
      </div>
    </div>
  );
}
