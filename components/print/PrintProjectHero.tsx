import { Project } from "@/lib/types";
import { optimizedImageSrc } from "@/lib/utils";
import { PrintProjectView, cleanMetaText } from "@/lib/print-content";
import { PrintPage } from "./PrintPage";
import { GradientOverlay } from "@/components/ui/GradientOverlay";

// ============================================================================
// §156-6 — "프로젝트 대표페이지" 복원. 대표 이미지(또는 Before/After의
// After, 또는 영상 썸네일) 한 장을 전체 화면으로 깔고, 웹의 ProjectCover와
// 동일한 공통 그라데이션(GradientOverlay) 위에 번호·제목·소개·연도를
// 하단에 배치한다. 대표페이지 다음에는 바로 PrintProject(상세페이지)가
// 이어진다 — 제목만 있는 별도 페이지가 아니라 항상 이미지 위에 얹힌다.
// ============================================================================
export function PrintProjectHero({ project, view, index }: { project: Project; view: PrintProjectView; index: number }) {
  const heroImage = view.primaryImage || view.beforeAfterPair?.after || (view.videoThumb ? { url: view.videoThumb.poster } : undefined);
  const intro = view.sections[0]?.body || "";

  return (
    <PrintPage center className="relative overflow-hidden">
      {heroImage?.url && (
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={optimizedImageSrc(heroImage.url, 1920)} alt="" className="h-full w-full object-cover" />
          <GradientOverlay />
        </div>
      )}
      <div className="relative z-10">
        <p className="font-en text-sm tabular-nums accent-text mb-3">
          PROJECT {String(index + 1).padStart(2, "0")}
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-korean mb-4 whitespace-pre-line text-white">{project.title}</h2>
        {intro && (
          <p className="text-white/85 body-large max-w-lg whitespace-pre-line mb-6 line-clamp-2">{intro}</p>
        )}
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-white/75 text-korean">
          {cleanMetaText(project.field) && <span>{cleanMetaText(project.field)}</span>}
          {cleanMetaText(project.year) && <span>{cleanMetaText(project.year)}</span>}
          {cleanMetaText(project.role) && <span>{cleanMetaText(project.role)}</span>}
        </div>
      </div>
    </PrintPage>
  );
}
