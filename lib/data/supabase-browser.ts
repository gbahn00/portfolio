"use client";

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// §77 — 브라우저에서 Supabase Storage에 직접 업로드하기 위한 클라이언트.
// NEXT_PUBLIC_ 접두사가 붙은 URL/anon key만 쓰므로 브라우저 번들에 포함돼도
// 안전하다(service role 키는 서버 쪽 lib/data/supabase-store.ts에서만 쓰인다).
// anon key로도 서명된 업로드 URL(createSignedUploadUrl로 발급받은 토큰)에
// 대한 업로드는 허용된다 — 토큰 자체가 그 한 번의 업로드 권한을 담고 있다.
let cached: SupabaseClient | null = null;

export function supabaseBrowserClient(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Supabase 브라우저 환경변수(NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)가 설정되지 않았습니다.");
  }
  cached = createClient(url, key);
  return cached;
}
