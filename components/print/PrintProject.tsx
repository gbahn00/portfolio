import { Project, MediaRef } from "@/lib/types";
import { optimizedImageSrc } from "@/lib/utils";
import { PrintProjectView, cleanMetaText } from "@/lib/print-content";
import { PrintPage } from "./PrintPage";
import { PrintToolIcons } from "./PrintToolIcons";

// §156-5/21 — 세로로 긴 사진 하나 때문에 페이지가 다음 장으로 밀리는
// 문제를 막기 위해 미디어 영역 높이를 고정 상한으로 감싼다(A4 가로
// 페이지의 실제 사용 가능 높이를 기준으로 넉넉히 잡은 값). object-contain
// 이라 원본 비율은 그대로 유지되고, 세로형 사진은 이 상자 안에서 자동으로
// 작아질 뿐 잘리지 않는다.
const MEDIA_BOX = "w-full flex items-center justify-center overflow-hidden rounded-sm max-h-[430px]";

function ImageBlock({ media, size = 1400 }: { media: MediaRef; size?: number }) {
  return (
    <div className={MEDIA_BOX}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={optimizedImageSrc(media.url, size)}
        alt={media.alt || ""}
        className="max-h-[430px] w-auto max-w-full h-auto object-contain"
      />
    </div>
  );
}

function VideoPosterBlock({ poster, size = 1400 }: { poster: string; size?: number }) {
  return (
    <div className={`relative ${MEDIA_BOX}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={optimizedImageSrc(poster, size)} alt="" className="max-h-[430px] w-auto max-w-full h-auto object-contain" />
      <span className="absolute left-2 bottom-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white text-sm">
        ▶
      </span>
    </div>
  );
}

// ============================================================================
// §155 — 이전 버전은 프로젝트 하나를 "카드 페이지(PrintProjectCard)"와
// "상세 페이지(PrintProjectDetail)" 2장으로 나눴다. 이번 스펙(16~22페이지
// 목표, 프로젝트당 대표 이미지 1~2장·Before/After 1쌍만)에 맞춰 두 페이지를
// 하나로 합쳤다: 제목·메타 정보 + 대표 이미지(또는 Before/After 1쌍) +
// 핵심 본문 3섹션(각 2~3줄) + Tools를 한 페이지 안에 담는다. 내용이 유난히
// 많은 프로젝트만 자연스럽게 다음 페이지로 흘러넘칠 뿐, 강제로 2페이지로
// 나누지 않는다.
// ============================================================================
export function PrintProject({ project, view, index }: { project: Project; view: PrintProjectView; index: number }) {
  const { sections, toolsList, primaryImage, secondaryImage, beforeAfterPair, videoThumb } = view;
  // §156-5 — 권장 비율(미디어 55~60% : 설명 40~45%)에 맞춰 3fr/2fr(60/40)로
  // 나눈다. 대표 이미지·Before/After·영상 썸네일이 전부 없는 프로젝트는
  // 왼쪽을 빈 채로 두지 않고 본문이 전체 폭을 쓰도록 1단으로 바꾼다.
  const hasMedia = Boolean(beforeAfterPair || primaryImage || videoThumb);

  return (
    <PrintPage>
      <div className="mb-6 print-avoid-break">
        <p className="font-en text-xs tabular-nums accent-text mb-2 tracking-wide">
          PROJECT {String(index + 1).padStart(2, "0")}
        </p>
        <h2 className="text-2xl md:text-3xl font-bold text-korean whitespace-pre-line mb-2">{project.title}</h2>
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-muted text-korean">
          {cleanMetaText(project.field) && <span>{cleanMetaText(project.field)}</span>}
          {!project.brandHidden && cleanMetaText(project.brand) && <span>{cleanMetaText(project.brand)}</span>}
          {cleanMetaText(project.year) && <span>{cleanMetaText(project.year)}</span>}
          {cleanMetaText(project.role) && <span>{cleanMetaText(project.role)}</span>}
        </div>
      </div>

      <div className={`grid grid-cols-1 gap-10 items-start ${hasMedia ? "md:grid-cols-[3fr_2fr]" : ""}`}>
        {/* 왼쪽 — 대표 이미지 1~2장, 또는 Before/After 1쌍 (§155-8/9) */}
        {hasMedia && (
        <div className="flex flex-col gap-4 print-avoid-break">
          {beforeAfterPair ? (
            <div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-semibold tracking-wide text-ink-muted mb-1">BEFORE</p>
                  <ImageBlock media={beforeAfterPair.before} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold tracking-wide accent-text mb-1">AFTER</p>
                  <ImageBlock media={beforeAfterPair.after} />
                </div>
              </div>
              {beforeAfterPair.caption && !beforeAfterPair.caption.startsWith("[") && (
                <p className="mt-1.5 text-xs text-ink-muted text-korean">{beforeAfterPair.caption}</p>
              )}
            </div>
          ) : primaryImage ? (
            <>
              <ImageBlock media={primaryImage} />
              {secondaryImage && <ImageBlock media={secondaryImage} size={900} />}
              {!secondaryImage && videoThumb && <VideoPosterBlock poster={videoThumb.poster} />}
            </>
          ) : videoThumb ? (
            <VideoPosterBlock poster={videoThumb.poster} />
          ) : null}
        </div>
        )}

        {/* 오른쪽 — 프로젝트 개요 / 제작 의도 / 기여도 (각 2~3줄) + Tools */}
        <div className="flex flex-col gap-4 min-w-0">
          {sections.map((s) => (
            <div key={s.key} className="print-avoid-break">
              <h3 className="text-sm font-semibold mb-1 text-korean">{s.title}</h3>
              <p className="text-sm text-ink-secondary leading-relaxed whitespace-pre-line text-korean line-clamp-3">
                {s.body}
              </p>
            </div>
          ))}

          {toolsList.length > 0 && (
            <div className="print-avoid-break">
              <h3 className="text-sm font-semibold mb-2 text-korean">Tools</h3>
              <PrintToolIcons tools={toolsList} />
            </div>
          )}
        </div>
      </div>
    </PrintPage>
  );
}
