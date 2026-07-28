/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
    ],
    // §148 — "이미지·영상 화질은 유지하되 로딩 속도를 최적화해달라"는
    // 요청. avif를 webp보다 먼저 시도하게 하면(브라우저가 지원할 때만)
    // 같은 화질(lib/utils.ts의 q=82)에서 파일 용량이 추가로 더 줄어든다
    // (지원하지 않는 브라우저는 자동으로 webp로 폴백). minimumCacheTTL은
    // /_next/image가 한 번 최적화한 결과를 얼마나 오래 재사용할지로,
    // 업로드마다 새 파일 경로(Supabase Storage)를 쓰는 구조라 길게 잡아도
    // "예전 사진이 안 바뀐다" 문제가 생기지 않는다.
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 31536000,
  },
  // Next.js는 기본값이 이미 true지만, "Gzip/Brotli 압축 적용" 요청에
  // 맞춰 의도를 명시적으로 남겨둔다.
  compress: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  // §148 — 자주 바뀌지 않는 정적 리소스(툴 아이콘, 자리표시자 이미지)에
  // 브라우저 캐싱을 명시적으로 지정해, 재방문/페이지 이동 시 다시
  // 내려받지 않도록 한다. 새 배포가 이루어져 파일 내용이 바뀌어도
  // must-revalidate가 있어 만료 후에는 서버에 변경 여부를 확인한다.
  async headers() {
    return [
      {
        source: "/icons/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" }],
      },
      {
        source: "/placeholders/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" }],
      },
      {
        source: "/fonts/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

module.exports = nextConfig;
