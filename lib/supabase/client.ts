import { createBrowserClient } from "@supabase/ssr";

// 브라우저(클라이언트 컴포넌트)에서 Supabase Auth 로그인 등에 사용합니다.
// DATA_MODE=supabase 일 때만 실제로 사용됩니다.
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  );
}
