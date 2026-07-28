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

// §153/§154 — 웹 상세페이지(app/projects/[id]/page.tsx)는 "왼쪽: 보정
// 전후 또는 대표 이미지, 오른쪽: 프로젝트 개요·제작 의도·기여도·Tools"
// 2단 구성이다. §154("웹과 다른 문서 레이아웃으로 바꾸지 않는다")에 맞춰
// 인쇄물도 같은 좌우 2단 구성을 그대로 따르고, 최종 영상·상세 이미지·
// Contents처럼 그 아래로 이어지는 영역만 전체 폭으로 배치한다(웹에서도
// 같은 자리에 온다).
export function PrintProjectDetail({ view }: { view: PrintProjectView }) {
  const { project, sections, toolsList, beforeAfterPairs, hasBeforeAfter, fallbackMediaList, gallery, contents, finalVideo } =
    view;

  return (
    <PrintPage>
      <div className="mb-6 print-avoid-break">
        <p className="font-en text-xs tracking-wide text-ink-muted mb-2">{project.field}</p>
        <h2 className="text-2xl md:text-3xl font-bold text-korean whitespace-pre-line">{project.title}</h2>
      </div>

      {/* 웹과 동일한 좌(사진) / 우(본문) 2단 구성 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-8 items-start">
        {/* 왼쪽 — 보정 전/후, 또는 대체 대표 이미지·영상 */}
        <div className="flex flex-col gap-5">
          {hasBeforeAfter
            ? beforeAfterPairs.map((pair) => (
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
              ))
            : fallbackMediaList.map((m, i) => <PosterThumb key={i} media={m} />)}

          {!hasBeforeAfter && project.retouchMarkers && project.retouchMarkers.length > 0 && (
            <div className="print-avoid-break">
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

        {/* 오른쪽 — 프로젝트 개요 / 제작 의도 / 기여도 / Tools */}
        <div className="flex flex-col gap-5 min-w-0">
          {sections.map((s) => (
            <div key={s.key} className="print-avoid-break">
              <h3 className="text-base font-semibold mb-1.5 text-korean">{s.title}</h3>
              {s.body && (
                <p className="text-sm text-ink-secondary leading-relaxed whitespace-pre-line text-korean">{s.body}</p>
              )}
              {s.images.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {s.images.map((img, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={optimizedImageSrc(img.url, 700)}
                      alt={img.alt || ""}
                      className="w-full h-auto rounded-sm object-contain"
                    />
                  ))}
                </div>
              )}
            </div>
          ))}

          {toolsList.length > 0 && (
            <div className="print-avoid-break">
              <h3 className="text-base font-semibold mb-2 text-korean">Tools</h3>
              <PrintToolIcons tools={toolsList} />
            </div>
          )}
        </div>
      </div>

      {/* 아래로 이어지는 영역 — 웹에서도 좌우 2단 구성 다음에 전체 폭으로 온다 */}
      {finalVideo?.url && (
        <div className="mb-8">
          <h3 className="text-base font-semibold mb-3 text-korean">대표 영상</h3>
          <div className="max-w-md">
            <PosterThumb media={finalVideo} size={1600} />
          </div>
        </div>
      )}

      {gallery.length > 0 && (
        <div className="mb-8">
          <h3 className="text-base font-semibold mb-3 text-korean">상세 이미지</h3>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
            {gallery.map((m, i) => (
              <PosterThumb key={i} media={m} size={800} />
            ))}
          </div>
        </div>
      )}

      {contents.length > 0 && (
        <div>
          <h3 className="text-base font-semibold mb-3 text-korean">Contents</h3>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
            {contents.map((m, i) => (
              <PosterThumb key={i} media={m} size={800} />
            ))}
          </div>
        </div>
      )}
    </PrintPage>
  );
}
