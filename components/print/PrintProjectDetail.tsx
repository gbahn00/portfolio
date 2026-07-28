import { PrintProjectView } from "@/lib/print-content";
import { optimizedImageSrc } from "@/lib/utils";
import { MediaRef } from "@/lib/types";
import { PrintPage } from "./PrintPage";
import { PrintToolIcons } from "./PrintToolIcons";

function PosterThumb({ media, size = 1200 }: { media: MediaRef; size?: number }) {
  const src = media.kind === "video-file" ? media.poster : media.url;
  if (!src) return null;
  return (
    <div className="relative print-avoid-break">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={optimizedImageSrc(src, size)} alt={media.alt || ""} className="w-full h-auto rounded-sm object-contain" />
      {media.kind === "video-file" && (
        <span className="absolute left-2 bottom-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white text-sm">
          ▶
        </span>
      )}
      {(media.caption || media.alt) && (
        <p className="mt-1 text-xs text-ink-muted text-korean">{media.caption || media.alt}</p>
      )}
    </div>
  );
}

// §153 — 스펙 6번 "프로젝트 상세페이지" 요구사항을 그대로 구현. 웹
// 상세페이지(app/projects/[id]/page.tsx)와 같은 데이터(lib/print-content.ts의
// getProjectPrintView)를 쓰되, 캐러셀/드래그/자동 스크롤처럼 인쇄물에서
// 의미가 없는 인터랙션은 정적인 격자/스택 배치로 바꿨다. 영상은 스펙
// 5번에 따라 재생 대신 poster 썸네일 + ▶ 아이콘으로 표시한다.
export function PrintProjectDetail({ view }: { view: PrintProjectView }) {
  const { project, sections, toolsList, beforeAfterPairs, hasBeforeAfter, fallbackMediaList, gallery, contents, finalVideo } =
    view;

  return (
    <PrintPage>
      <div className="mb-8 print-avoid-break">
        <p className="font-en text-xs tracking-wide text-ink-muted mb-2">{project.field}</p>
        <h2 className="text-2xl md:text-3xl font-bold text-korean whitespace-pre-line">{project.title}</h2>
      </div>

      {/* 보정 전/후, 또는 대체 대표 이미지·영상 */}
      {hasBeforeAfter ? (
        <div className="mb-10 flex flex-col gap-6">
          {beforeAfterPairs.map((pair) => (
            <div key={pair.id} className="print-avoid-break">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-semibold tracking-wide text-ink-muted mb-1">BEFORE</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={optimizedImageSrc(pair.before.url, 1200)}
                    alt={pair.before.alt || "보정 전"}
                    className="w-full h-auto rounded-sm object-contain"
                  />
                </div>
                <div>
                  <p className="text-[10px] font-semibold tracking-wide accent-text mb-1">AFTER</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={optimizedImageSrc(pair.after.url, 1200)}
                    alt={pair.after.alt || "보정 후"}
                    className="w-full h-auto rounded-sm object-contain"
                  />
                </div>
              </div>
              {pair.caption && !pair.caption.startsWith("[") && (
                <p className="mt-1.5 text-xs text-ink-muted text-korean">{pair.caption}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        fallbackMediaList.length > 0 && (
          <div className="mb-10 grid grid-cols-1 md:grid-cols-2 gap-4">
            {fallbackMediaList.map((m, i) => (
              <PosterThumb key={i} media={m} />
            ))}
            {project.retouchMarkers && project.retouchMarkers.length > 0 && (
              <div className="md:col-span-2 print-avoid-break">
                <p className="text-xs font-semibold text-ink-secondary mb-1">보정 포인트</p>
                <ul className="text-xs text-ink-muted text-korean space-y-0.5">
                  {[...project.retouchMarkers]
                    .sort((a, b) => a.order - b.order)
                    .filter((m) => m.label)
                    .map((m) => (
                      <li key={m.id}>· {m.label}</li>
                    ))}
                </ul>
              </div>
            )}
          </div>
        )
      )}

      {/* 프로젝트 개요 / 제작 의도 / 기여도 */}
      <div className="flex flex-col gap-6 mb-10">
        {sections.map((s) => (
          <div key={s.key} className="print-avoid-break">
            <h3 className="text-lg font-semibold mb-2 text-korean">{s.title}</h3>
            {s.body && <p className="text-sm text-ink-secondary leading-relaxed whitespace-pre-line text-korean mb-2">{s.body}</p>}
            {s.images.length > 0 && (
              <div className="grid grid-cols-2 gap-3 mt-2">
                {s.images.map((img, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={optimizedImageSrc(img.url, 900)}
                    alt={img.alt || ""}
                    className="w-full h-auto rounded-sm object-contain"
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {toolsList.length > 0 && (
        <div className="mb-10 print-avoid-break">
          <h3 className="text-lg font-semibold mb-3 text-korean">Tools</h3>
          <PrintToolIcons tools={toolsList} />
        </div>
      )}

      {finalVideo?.url && (
        <div className="mb-10">
          <h3 className="text-lg font-semibold mb-3 text-korean">대표 영상</h3>
          <PosterThumb media={finalVideo} size={1600} />
        </div>
      )}

      {gallery.length > 0 && (
        <div className="mb-10">
          <h3 className="text-lg font-semibold mb-3 text-korean">상세 이미지</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {gallery.map((m, i) => (
              <PosterThumb key={i} media={m} size={800} />
            ))}
          </div>
        </div>
      )}

      {contents.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 text-korean">Contents</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {contents.map((m, i) => (
              <PosterThumb key={i} media={m} size={800} />
            ))}
          </div>
        </div>
      )}
    </PrintPage>
  );
}
