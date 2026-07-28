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

// §156-27 — 대용량 영상을 재개형(TUS resumable) 업로드로 올릴 때 쓰는
// 값들. Supabase 문서 권장대로 "direct storage hostname"
// (project-id.storage.supabase.co)을 쓰면 project-id.supabase.co를 거칠 때
// 보다 대용량 업로드 성능이 더 좋다.
// https://supabase.com/docs/guides/storage/uploads/resumable-uploads
export function supabaseResumableUploadEndpoint(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL이 설정되지 않았습니다.");
  const projectId = new URL(url).hostname.split(".")[0];
  return `https://${projectId}.storage.supabase.co/storage/v1/upload/resumable`;
}

export function supabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY가 설정되지 않았습니다.");
  return key;
}
