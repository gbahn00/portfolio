import Link from "next/link";
import { Project } from "@/lib/types";
import { MediaFrame } from "@/components/ui/MediaFrame";

// 9라운드 명세서 §11 — 프로젝트 상세 페이지에 이전/다음 프로젝트 이동과
// 목록으로 돌아가는 버튼을 추가한다. 목록에서의 순서(정렬 기준: order)를
// 그대로 따르며, 첫/마지막 프로젝트에서는 없는 쪽 버튼을 자연스럽게 숨긴다.
function NeighborCard({ project, direction }: { project: Project; direction: "prev" | "next" }) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="group relative flex-1 overflow-hidden rounded-sm border border-line transition-all duration-[0.35s] ease-out hover:border-white/20 hover:shadow-2xl"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden">
        <div className="h-full w-full transition-transform duration-[0.35s] ease-out group-hover:scale-[1.02]">
          <MediaFrame media={project.heroImage} className="h-full w-full" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-bg/85 via-bg/20 to-transparent" />
      </div>
      {/* §159 — "다음(Next) 카드는 우측 정렬로, 이전(Previous)과 대칭을
          이루도록" 요청. 카드 자체 위치(좌/우)는 그대로 두고 텍스트
          정렬만 direction에 따라 좌/우로 바꾼다 — 카드 폭 전체에 동일한
          좌우 여백(p-5/md:p-6)을 유지한 채 text-align만 바뀌므로, Next
          카드는 "카드 우측 가장자리 기준"으로 정렬된다(텍스트 시작점
          기준이 아님). */}
      <div className={`absolute inset-x-0 bottom-0 p-5 md:p-6 ${direction === "next" ? "text-right" : "text-left"}`}>
        <p className="font-en text-xs text-ink-secondary tracking-wide mb-1">
          {direction === "prev" ? "← PREVIOUS" : "NEXT →"}
        </p>
        <p className="text-korean text-base md:text-lg font-semibold text-ink line-clamp-1">{project.title}</p>
      </div>
    </Link>
  );
}

export function ProjectNav({ prev, next }: { prev: Project | null; next: Project | null }) {
  return (
    <div className="border-t border-line">
      <div className="pt-10 pb-6">
        <Link
          href="/#projects"
          className="inline-flex items-center gap-2 text-sm text-ink-secondary transition-colors duration-[0.35s] ease-out hover:text-ink"
        >
          ← Back to Projects
        </Link>
      </div>
      {(prev || next) && (
        <div className="flex flex-col md:flex-row gap-4 pb-4">
          {prev ? <NeighborCard project={prev} direction="prev" /> : <div className="flex-1" />}
          {next ? <NeighborCard project={next} direction="next" /> : <div className="flex-1" />}
        </div>
      )}
    </div>
  );
}
