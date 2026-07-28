import { Project } from "@/lib/types";
import { optimizedImageSrc, stripPlaceholder } from "@/lib/utils";
import { PrintPage } from "./PrintPage";

// §153 — 스펙 3번의 "대표 프로젝트 N" — 상세페이지로 들어가기 전 한 장으로
// 보여주는 프로젝트 카드(웹의 "대표 프로젝트" 목록 항목에 대응).
export function PrintProjectCard({ project, index }: { project: Project; index: number }) {
  return (
    <PrintPage center className="relative overflow-hidden">
      {project.heroImage?.url && (
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={optimizedImageSrc(project.heroImage.url, 1920)}
            alt=""
            className="h-full w-full object-cover"
            style={{ filter: "brightness(0.5) contrast(1.05)" }}
          />
        </div>
      )}
      <div className="relative z-10">
        <p className="font-en text-sm tabular-nums accent-text mb-3">
          PROJECT {String(index + 1).padStart(2, "0")}
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-korean mb-4 whitespace-pre-line">{project.title}</h2>
        <p className="text-korean text-ink-secondary body-large max-w-lg whitespace-pre-line mb-6">
          {stripPlaceholder(project.description)}
        </p>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-ink-secondary text-korean">
          <span>{project.field}</span>
          {!project.brandHidden && project.brand && <span>{project.brand}</span>}
          <span>{project.year}</span>
          <span>{project.role}</span>
        </div>
      </div>
    </PrintPage>
  );
}
