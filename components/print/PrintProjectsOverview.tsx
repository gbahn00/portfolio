import { Project } from "@/lib/types";
import { PrintPage } from "./PrintPage";
import { PrintHeading } from "./PrintHeading";

// §153 — 스펙 3번 순서의 "4. 대표 프로젝트" — 개별 프로젝트 상세로 들어가기
// 전에 전체 목록을 한눈에 보여주는 인덱스 페이지.
export function PrintProjectsOverview({ projects }: { projects: Project[] }) {
  return (
    <PrintPage center>
      <PrintHeading kicker="대표 프로젝트" title="촬영부터 영상, 생성형 AI와 업무 체계까지." />
      <div className="flex flex-col gap-3">
        {projects.map((p, i) => (
          <div key={p.id} className="flex items-baseline gap-4 border-b border-line pb-3">
            <span className="font-en text-sm tabular-nums accent-text shrink-0 w-8">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="text-lg font-medium text-korean flex-1">{p.title}</span>
            <span className="text-xs text-ink-muted text-korean shrink-0">{p.field}</span>
          </div>
        ))}
      </div>
    </PrintPage>
  );
}
