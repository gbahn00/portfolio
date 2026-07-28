import { SiteContent, MediaRef } from "@/lib/types";
import { visibleSorted } from "@/lib/publish";
import { getProjectPrintView, getPublicProjectsSorted } from "@/lib/print-content";
import { PrintCover } from "./PrintCover";
import { PrintProfile } from "./PrintProfile";
import { PrintGrowth } from "./PrintGrowth";
import { PrintProjectsOverview } from "./PrintProjectsOverview";
import { PrintProjectCard } from "./PrintProjectCard";
import { PrintProjectDetail } from "./PrintProjectDetail";
import { PrintFuturePlans } from "./PrintFuturePlans";
import { PrintFaq } from "./PrintFaq";
import { PrintClosing } from "./PrintClosing";

// ============================================================================
// §153 — Admin PDF Export. 스펙 3번의 페이지 순서를 그대로 구현한다:
//   1. 메인 페이지 → 2. Profile → 3. 업무 성장 과정 → 4. 대표 프로젝트 →
//   (5. 프로젝트 1 → 6. 프로젝트 1 상세 → 7. 프로젝트 2 → 8. 프로젝트 2 상세 → ...) →
//   N. 특별진급 이후 실행 계획 → N+1. FAQ → N+2. 마지막 페이지
// 각 섹션의 "무엇을 보여줄지" 판단(공개 여부·순서·상한 개수 등)은 웹
// 홈페이지(app/page.tsx)·프로젝트 상세페이지(app/projects/[id]/page.tsx)와
// 동일한 기준(visibleSorted, publicOk, lib/print-content.ts)을 그대로
// 쓴다 — "웹과 PDF가 항상 같은 데이터를 쓴다"는 요청의 핵심.
// ============================================================================
export function PrintDocument({ content }: { content: SiteContent }) {
  const publicProjects = getPublicProjectsSorted(content);
  const heroStackImages: MediaRef[] = [
    content.hero?.backgroundImage,
    ...publicProjects.slice(0, 2).map((p) => p.heroImage),
    ...(content.profile?.onSitePhotos ?? []),
  ].filter((m): m is MediaRef => Boolean(m));

  return (
    <div className="print-doc">
      <PrintCover hero={content.hero} fallbackImage={heroStackImages[0]} />
      <PrintProfile
        profile={content.profile}
        philosophy={content.philosophy}
        competencies={visibleSorted(content.competencies)}
      />
      <PrintGrowth entries={visibleSorted(content.timeline)} title={content.growth?.title} />
      <PrintProjectsOverview projects={publicProjects} />
      {publicProjects.map((project, i) => (
        <div key={project.id}>
          <PrintProjectCard project={project} index={i} />
          <PrintProjectDetail view={getProjectPrintView(project)} />
        </div>
      ))}
      <PrintFuturePlans items={content.futurePlans} />
      <PrintFaq items={content.faq ?? []} />
      <PrintClosing data={content.closing} />
    </div>
  );
}
