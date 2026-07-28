// §77 — Supabase Storage 버킷 이름을 서버 코드(lib/data/supabase-store.ts)와
// 브라우저 코드(components/admin/MediaUpload.tsx → lib/data/supabase-browser.ts)
// 양쪽에서 똑같이 참조해야 해서 별도 파일로 분리했다. 이 파일은 환경변수나
// 비밀 키를 전혀 담지 않으므로 브라우저 번들에 포함돼도 안전하다.
export const MEDIA_BUCKET = "portfolio-media";

// §120 — "상세 이미지에 gif 파일이 업로드가 안 된다"는 요청으로
// image/gif를 허용 목록에 추가했다. lib/utils.ts의 optimizedImageSrc()도
// .gif는 Next.js 이미지 최적화(정적 변환 과정에서 움직이는 gif가 첫
// 프레임만 남은 정지 이미지가 될 수 있음)를 건너뛰도록 함께 손봤다.
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/svg+xml", "image/gif"];
export const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
export const MAX_IMAGE_BYTES = 20 * 1024 * 1024; // 20MB
export const MAX_VIDEO_BYTES = 300 * 1024 * 1024; // 300MB
