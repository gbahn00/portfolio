import type { MetadataRoute } from "next";
import { getContent } from "@/lib/data/repo";

// §148 — "Lighthouse SEO 점수를 높여달라"는 요청. 공개된 프로젝트
// 상세페이지들이 검색엔진에 잘 발견되도록 sitemap을 만든다. 비공개
// (publicOk가 아닌) 프로젝트나 관리자 페이지는 포함하지 않는다.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const content = await getContent();
  const projectUrls: MetadataRoute.Sitemap = (content.projects ?? [])
    .filter((p) => p.publicOk)
    .map((p) => ({
      url: `${SITE_URL}/projects/${p.id}`,
      changeFrequency: "monthly",
      priority: 0.8,
    }));

  return [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    ...projectUrls,
  ];
}
