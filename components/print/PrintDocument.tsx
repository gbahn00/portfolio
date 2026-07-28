import { SiteContent, MediaRef } from "@/lib/types";
import { visibleSorted } from "@/lib/publish";
import { getProjectPrintView, getPublicProjectsSorted } from "@/lib/print-content";
import { PrintCover } from "./PrintCover";
import { PrintProfile } from "./PrintProfile";
import { PrintCompetencies } from "./PrintCompetencies";
import { PrintGrowth } from "./PrintGrowth";
import { PrintProjectsOverview } from "./PrintProjectsOverview";
import { PrintProjectHero } from "./PrintProjectHero";
import { PrintProject } from "./PrintProject";
import { PrintFuturePlans } from "./PrintFuturePlans";
import { PrintFaq } from "./PrintFaq";
import { PrintClosing } from "./PrintClosing";

// ============================================================================
// §155/§156 — "PDF 출력 구조 전면 개선"에 이어 "PDF 가로형 출력·미디어
// 배치 개선" 요청까지 반영한 최종 페이지 순서:
//   1. 표지 → 2. Profile → 3. 업무 역량(별도 페이지) → 4. 업무 성장과정 →
//   5. 대표 프로젝트 목차 →
//   (프로젝트마다 2페이지: 6. 대표페이지[전체화면 이미지 + 공통 검정
//   그라데이션 + 하단 텍스트] → 7. 상세페이지[좌 미디어 / 우 본문 2단 +
//   Tools]) → 실행 계획 → FAQ → 마지막 페이지.
// 이미지·텍스트가 전혀 없는(=아직 채워지지 않은) 프로젝트는 기본값대로
// PDF에서 제외한다(§155-12). 대표 이미지 1~2장 또는 Before/After 1쌍만
// 쓰고 전체 갤러리를 옮기지 않는 원칙(§155)은 그대로 유지한다.
// ============================================================================
export function PrintDocument({ content }: { content: SiteContent }) {
  const publicProjects = getPublicProjectsSorted(content);
  const projectViews = publicProjects
    .map((project) => ({ project, view: getProjectPrintView(project) }))
    .filter((x) => x.view.hasUsableContent);

  const heroStackImages: MediaRef[] = [
    content.hero?.backgroundImage,
    ...publicProjects.slice(0, 2).map((p) => p.heroImage),
    ...(content.profile?.onSitePhotos ?? []),
  ].filter((m): m is MediaRef => Boolean(m));

  return (
    <div className="print-doc">
      <PrintCover hero={content.hero} fallbackImage={heroStackImages[0]} />
      <PrintProfile profile={content.profile} philosophy={content.philosophy} />
      <PrintCompetencies competencies={visibleSorted(content.competencies)} />
      <PrintGrowth entries={visibleSorted(content.timeline)} title={content.growth?.title} />
      <PrintProjectsOverview projects={projectViews.map((x) => x.project)} />
      {projectViews.map(({ project, view }, i) => (
        <div key={project.id}>
          <PrintProjectHero project={project} view={view} index={i} />
          <PrintProject project={project} view={view} index={i} />
        </div>
      ))}
      <PrintFuturePlans items={content.futurePlans} />
      <PrintFaq items={content.faq ?? []} />
      <PrintClosing data={content.closing} />
    </div>
  );
}
