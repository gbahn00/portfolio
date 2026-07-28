import { TimelineEntry } from "@/lib/types";
import { optimizedImageSrc } from "@/lib/utils";
import { PrintPage } from "./PrintPage";
import { PrintHeading } from "./PrintHeading";

// §153 — 웹에서는 연도 탭을 하나씩 눌러 넘겨보지만, 인쇄물은 넘길 수 없으니
// 등록된 연도 전부를 순서대로 이어서 보여준다(연도별 영상은 스펙 5번에
// 따라 재생 대신 poster/대표 이미지를 쓴다).
// §155-6 — "이미지가 페이지를 지배하지 않도록" 이미지 칼럼 비중을 줄이고
// (1fr → 1fr, 텍스트 쪽을 1.4fr로 넓힘) 높이를 고정 비율(4:3)로 잘라
// 세로로 긴 사진이 페이지를 밀어내지 않게 했다. 본문도 2~3줄로 제한.
export function PrintGrowth({ entries, title }: { entries: TimelineEntry[]; title?: string }) {
  const sorted = [...entries].sort((a, b) => a.order - b.order);
  if (sorted.length === 0) return null;

  return (
    <PrintPage>
      <PrintHeading kicker="업무 성장과정" title={title || "입사 이후, 역할은 이렇게 확장되었습니다."} />
      <div className="flex flex-col gap-7">
        {sorted.map((entry) => {
          const experiences = [...entry.experiences].sort((a, b) => a.order - b.order);
          const image = entry.heroVideo?.poster ? { url: entry.heroVideo.poster } : entry.heroImage;
          return (
            <div key={entry.id} className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-8 print-avoid-break">
              <div>
                <p className="font-en text-xs accent-text mb-1 tracking-wide">{entry.year}</p>
                <h3 className="text-xl md:text-2xl font-bold mb-2 text-korean whitespace-pre-line">{entry.title}</h3>
                <p className="text-sm text-ink-secondary leading-relaxed mb-2 text-korean whitespace-pre-line line-clamp-3">
                  {entry.description}
                </p>
                <p className="text-sm font-medium border-l-2 accent-border pl-3 text-korean mb-2 whitespace-pre-line line-clamp-2">
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
                <div className="w-full aspect-[4/3] max-h-56 overflow-hidden rounded-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={optimizedImageSrc(image.url, 900)}
                    alt={entry.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </PrintPage>
  );
}
