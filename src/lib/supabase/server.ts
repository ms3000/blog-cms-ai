import { createClient } from "@supabase/supabase-js";

/**
 * 공개 읽기용 클라이언트 (anon key). RLS 정책에 따라 published 글만 조회된다.
 * 서버 컴포넌트/route 에서 사용.
 */
export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Supabase 환경변수(NEXT_PUBLIC_SUPABASE_URL / ANON_KEY)가 설정되지 않았습니다.");
  }
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
