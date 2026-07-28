import { TimelineEntry } from "@/lib/types";
import { optimizedImageSrc } from "@/lib/utils";
import { PrintPage } from "./PrintPage";
import { PrintHeading } from "./PrintHeading";

// §153 — 웹에서는 연도 탭을 하나씩 눌러 넘겨보지만, 인쇄물은 넘길 수 없으니
// 등록된 연도 전부를 순서대로 이어서 보여준다(연도별 영상은 스펙 5번에
// 따라 재생 대신 poster/대표 이미지를 쓴다).
export function PrintGrowth({ entries, title }: { entries: TimelineEntry[]; title?: string }) {
  const sorted = [...entries].sort((a, b) => a.order - b.order);
  if (sorted.length === 0) return null;

  return (
    <PrintPage>
      <PrintHeading kicker="업무 성장과정" title={title || "입사 이후, 역할은 이렇게 확장되었습니다."} />
      <div className="flex flex-col gap-10">
        {sorted.map((entry) => {
          const experiences = [...entry.experiences].sort((a, b) => a.order - b.order);
          const image = entry.heroVideo?.poster ? { url: entry.heroVideo.poster } : entry.heroImage;
          return (
            <div key={entry.id} className="grid grid-cols-1 md:grid-cols-2 gap-8 print-avoid-break">
              <div>
                <p className="font-en text-xs accent-text mb-1 tracking-wide">{entry.year}</p>
                <h3 className="text-xl md:text-2xl font-bold mb-2 text-korean whitespace-pre-line">{entry.title}</h3>
                <p className="text-sm text-ink-secondary leading-relaxed mb-2 text-korean whitespace-pre-line">
                  {entry.description}
                </p>
                <p className="text-sm font-medium border-l-2 accent-border pl-3 text-korean mb-2 whitespace-pre-line">
                  {entry.message}
                </p>
                {experiences.length > 0 && (
                  <div className="flex flex-wrap gap-x-3 gap-y-1 font-en text-xs text-ink-muted">
                    {experiences.map((t) => (
                      <span key={t.id}>#{t.text.replace(/\s/g, "")}</span>
                    ))}
                  </div>
                )}
              </div>
              {image?.url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={optimizedImageSrc(image.url, 1200)}
                  alt={entry.title}
                  className="w-full h-auto rounded-sm object-contain"
                />
              )}
            </div>
          );
        })}
      </div>
    </PrintPage>
  );
}
