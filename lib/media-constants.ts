// §77 — Supabase Storage 버킷 이름을 서버 코드(lib/data/supabase-store.ts)와
// 브라우저 코드(components/admin/MediaUpload.tsx → lib/data/supabase-browser.ts)
// 양쪽에서 똑같이 참조해야 해서 별도 파일로 분리했다. 이 파일은 환경변수나
// 비밀 키를 전혀 담지 않으므로 브라우저 번들에 포함돼도 안전하다.
export const MEDIA_BUCKET = "portfolio-media";

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/svg+xml"];
export const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
export const MAX_IMAGE_BYTES = 20 * 1024 * 1024; // 20MB
export const MAX_VIDEO_BYTES = 300 * 1024 * 1024; // 300MB
