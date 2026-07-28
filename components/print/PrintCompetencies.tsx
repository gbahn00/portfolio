import { Competency } from "@/lib/types";
import { PrintPage } from "./PrintPage";
import { PrintHeading } from "./PrintHeading";

// §155-5 — 페이지 순서표(03. 업무 역량)에 맞춰 Profile 페이지에 함께
// 있던 "업무 역량" 목록을 별도의 독립 페이지로 분리했다(이전엔
// PrintProfile.tsx 안에 같이 있었음).
export function PrintCompetencies({ competencies }: { competencies: Competency[] }) {
  const list = competencies.slice(0, 5);
  if (list.length === 0) return null;

  return (
    <PrintPage>
      <PrintHeading kicker="업무 역량" title="맡은 역할에서, 이렇게 증명했습니다." />
      <div className="flex flex-col gap-6">
        {list.map((c, i) => (
          <div key={c.id} className="flex gap-5 print-avoid-break">
            <span className="font-en text-lg tabular-nums shrink-0 mt-0.5" style={{ color: "var(--accent)" }}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0">
              <h3 className="text-lg font-bold mb-1.5 text-korean whitespace-pre-line">{c.title}</h3>
              {/* §155-14 — 본문은 2~3줄로 제한 */}
              <p className="text-ink-secondary text-sm leading-relaxed text-korean whitespace-pre-line line-clamp-3">
                {c.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </PrintPage>
  );
}
