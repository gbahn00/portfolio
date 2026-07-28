import { FaqItem } from "@/lib/types";
import { PrintPage } from "./PrintPage";
import { PrintHeading } from "./PrintHeading";

export function PrintFaq({ items }: { items: FaqItem[] }) {
  const visible = [...items].filter((i) => i.visible !== false).sort((a, b) => a.order - b.order).slice(0, 6);
  if (visible.length === 0) return null;

  return (
    <PrintPage>
      <PrintHeading
        kicker="추가 설명"
        title={
          <>
            궁금할 수 있는
            <br />
            질문에 답했습니다.
          </>
        }
      />
      <div className="border-t border-line">
        {visible.map((item, i) => (
          <div key={item.id} className="border-b border-line py-4 print-avoid-break">
            <p className="flex items-baseline gap-3 mb-2">
              <span className="font-en text-xs accent-text shrink-0">{String(i + 1).padStart(2, "0")}</span>
              <span className="text-base font-medium text-korean">{item.question}</span>
            </p>
            <p className="text-sm text-ink-secondary leading-relaxed text-korean whitespace-pre-line pl-7">
              {item.answer}
            </p>
          </div>
        ))}
      </div>
    </PrintPage>
  );
}
