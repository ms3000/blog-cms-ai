import { createClient } from "@supabase/supabase-js";

/**
 * 서버 전용 관리자 클라이언트 (service_role key). RLS 우회.
 * 절대 클라이언트 번들에 포함되면 안 됨 — route handler / server action 에서만 import.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || key.startsWith("PASTE_")) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY 가 설정되지 않았습니다. .env.local 에 service_role 키를 넣어주세요."
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
