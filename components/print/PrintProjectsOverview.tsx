import { Project } from "@/lib/types";
import { PrintPage } from "./PrintPage";
import { PrintHeading } from "./PrintHeading";

// §154 — "웹과 다른 형태의 문서 레이아웃으로 바꾸지 않는다"는 요청에 맞춰,
// 웹의 대표 프로젝트 목록(components/sections/SelectedWork.tsx)과 같은
// 구성을 그대로 따른다: 순서상 앞 4개는 Design, 다음 4개는 Content
// 칼럼으로 두 칸에 나눠 배치한다.
const COLUMN_SPLIT = 4;

export function PrintProjectsOverview({ projects }: { projects: Project[] }) {
  const list = projects.slice(0, 8);
  const columns = [
    { label: "Design", items: list.slice(0, COLUMN_SPLIT), offset: 0 },
    { label: "Content", items: list.slice(COLUMN_SPLIT, 8), offset: COLUMN_SPLIT },
  ];

  return (
    <PrintPage center>
      <PrintHeading kicker="대표 프로젝트" title="촬영부터 영상, 생성형 AI와 업무 체계까지." />
      <div className="grid grid-cols-2 gap-x-16 gap-y-3">
        {columns.map((col) => (
          <div key={col.label}>
            <p className="font-en text-xs text-ink-muted tracking-[0.2em] mb-3">{col.label}</p>
            <div className="flex flex-col gap-3">
              {col.items.map((p, i) => (
                <div key={p.id} className="flex items-baseline gap-4 border-b border-line pb-2.5">
                  <span className="font-en text-sm tabular-nums accent-text shrink-0 w-8">
                    {String(col.offset + i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-base font-medium text-korean flex-1">{p.title}</span>
                  <span className="text-xs text-ink-muted text-korean shrink-0">{p.field}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </PrintPage>
  );
}
