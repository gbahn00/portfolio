import type { MetadataRoute } from "next";

// §148 — "Lighthouse SEO 점수를 높여달라"는 요청. robots.txt가 아예
// 없으면 검색엔진이 관리자 페이지(/admin, /api)까지 그대로 크롤링을
// 시도할 수 있다. 공개 페이지는 전부 허용하고 관리자/내부 API 경로만
// 명시적으로 막는다. NEXT_PUBLIC_SITE_URL은 Vercel 배포 환경변수에
// 실제 도메인으로 설정해두면 sitemap 링크가 그 도메인을 가리킨다.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
