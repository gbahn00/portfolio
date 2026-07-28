import { FuturePlan } from "@/lib/types";
import { PrintPage } from "./PrintPage";
import { PrintHeading } from "./PrintHeading";

export function PrintFuturePlans({ items }: { items: FuturePlan[] }) {
  const visible = [...items].filter((i) => i.visible !== false).sort((a, b) => a.order - b.order).slice(0, 3);
  if (visible.length === 0) return null;

  return (
    <PrintPage>
      <PrintHeading kicker="특별진급 이후 실행 계획" title="다음 역할을 위한 준비" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {visible.map((plan, i) => (
          <div key={plan.id} className="rounded-sm border border-line bg-bg-soft p-5 flex flex-col print-avoid-break">
            <p className="font-en text-xs tracking-wide accent-text mb-2">PLAN {String(i + 1).padStart(2, "0")}</p>
            <h3 className="text-lg font-bold mb-2 text-korean whitespace-pre-line">{plan.title}</h3>
            <p className="text-sm text-ink-secondary text-korean mb-3 flex-1 whitespace-pre-line">{plan.summary}</p>
            {plan.details.length > 0 && (
              <ul className="space-y-1 mb-3">
                {[...plan.details].sort((a, b) => a.order - b.order).map((d) => (
                  <li key={d.id} className="flex gap-2 text-xs text-ink/80 text-korean">
                    <span className="accent-text">·</span>
                    {d.text}
                  </li>
                ))}
              </ul>
            )}
            <span className="inline-block self-start text-xs rounded-full border border-line px-3 py-1 text-ink-muted">
              {plan.progress}
            </span>
          </div>
        ))}
      </div>
    </PrintPage>
  );
}
