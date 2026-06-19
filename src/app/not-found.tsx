import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-content flex-col items-center justify-center px-5 text-center">
      <p className="text-sm font-bold tracking-wide text-accent">404</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight">페이지를 찾을 수 없습니다</h1>
      <p className="mt-3 text-ink-muted">요청하신 페이지가 없거나 이동되었습니다.</p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-ink px-6 py-3 font-semibold text-white transition hover:opacity-90"
      >
        홈으로 가기
      </Link>
    </div>
  );
}
