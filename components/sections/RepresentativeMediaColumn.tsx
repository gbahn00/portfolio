"use client";

import { useState } from "react";
import { MediaRef, RetouchMarker } from "@/lib/types";
import { mediaSrc, optimizedImageSrc } from "@/lib/utils";
import { refreshScrollTrigger } from "@/lib/gsap";

// ============================================================================
// §131 — "보정 전후 사진이 없다면 그 자리에 대표 이미지 또는 영상으로
// 대체할 수 있도록 해줘"라는 요청으로 만들었다.
//
// §135 — "여러 장 첨부 + 보정 전후와 같은 화살표 이전/다음 방식"으로
// 요청이 바뀌면서, media를 단일 MediaRef가 아니라 배열로 받아
// BeforeAfterSlider.tsx(§103~129)와 같은 인덱스 기반 이전/다음 버튼
// 캐러셀로 확장했다. §108과 동일하게 DOM에 key를 주지 않아(같은 요소
// 유지, src만 교체) "화면이 새로고침되는 느낌"이 나지 않도록 했다.
//
// §138 — "좌측 이미지와 우측 상세 콘텐츠의 시작·끝이 항상 같은 높이로
// 정렬돼야 한다"는 요청으로, 컨테이너 크기(높이=텍스트 칸 높이, 폭=
// 레이아웃이 정한 값)를 사진 자신의 원본 비율과 무관하게 고정했다.
// 처음엔 object-cover(+ focusX/focusY로 크롭 위치 조절)로 채웠는데,
// §139 — "미디어 원본 비율은 유지하고 세로가 잘리거나 가로로 과도하게
// 늘어나서는 안 되며, 그러면서도 컨테이너 높이는 미디어와 무관하게
// 항상 고정이어야 한다"는 더 구체적인 요청으로 object-contain으로
// 바꿨다. 컨테이너 자체는 (크롭 없이, 늘어남 없이) 항상 텍스트 칸과
// 같은 높이를 유지하고, 그 안에서 사진/영상은 원본 비율 그대로 최대한
// 크게 표시되며 남는 여백(letterbox)이 생길 수 있다 — "컨테이너 크기는
// 미디어가 아니라 텍스트 높이가 기준"이라는 요청에 가장 정확히 맞는
// 조합이다(크롭 0, 늘어남 0, 높이 불변 0예외).
//
// §135 — 보정 위치 마커(RetouchMarker): 사진 위 특정 좌표(%)에 작은 점을
// 찍어두고, 커서를 올리면(hover) 어떤 부분을 보정했는지 설명이 뜬다.
// ============================================================================

const DEFAULT_HEIGHT = 480;
const MAX_W = 640;

function MediaView({ item }: { item: MediaRef }) {
  const isVideo = item.kind === "video-file";

  return isVideo ? (
    <video
      src={mediaSrc(item.url)}
      poster={item.poster}
      controls
      controlsList="nodownload noremoteplayback"
      disablePictureInPicture
      onContextMenu={(e) => e.preventDefault()}
      playsInline
      onLoadedMetadata={refreshScrollTrigger}
      className="absolute inset-0 h-full w-full object-contain"
    />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={optimizedImageSrc(item.url, 1080)}
      alt={item.alt || ""}
      onLoad={refreshScrollTrigger}
      className="absolute inset-0 h-full w-full object-contain pointer-events-none"
      draggable={false}
    />
  );
}

export function RepresentativeMediaColumn({
  media,
  targetHeightPx,
  maxWidthPx,
  fillWidth,
  retouchMarkers,
}: {
  media: MediaRef[];
  targetHeightPx?: number;
  maxWidthPx?: number;
  // §135 — half 레이아웃에서 주어진 폭(부모가 이미 50%로 나눠준 칸)을
  // 그대로 채운다(100%). auto 레이아웃에서는 maxWidthPx(또는 기본 MAX_W)를 쓴다.
  fillWidth?: boolean;
  retouchMarkers?: RetouchMarker[];
}) {
  const sorted = media.filter((m) => m?.url);
  const [index, setIndex] = useState(0);
  const [hoveredMarker, setHoveredMarker] = useState<string | null>(null);

  if (sorted.length === 0) return null;
  const clampedIndex = Math.min(index, sorted.length - 1);
  const current = sorted[clampedIndex];

  function go(dir: 1 | -1) {
    setIndex((i) => (Math.min(i, sorted.length - 1) + dir + sorted.length) % sorted.length);
  }

  // §138 — 높이는 항상 텍스트 칸의 실제 렌더링 높이(targetHeightPx)를
  // 그대로 쓴다. 값이 아직 없는 아주 짧은 최초 렌더 순간에는
  // DEFAULT_HEIGHT로 자리만 잡고, 실제로 보이진 않는다(ready 참고).
  const effectiveHeight = Math.round(targetHeightPx ?? DEFAULT_HEIGHT);
  const effectiveMaxW = maxWidthPx ?? MAX_W;
  const ready = targetHeightPx !== undefined;

  const currentMarkers = (retouchMarkers ?? [])
    .filter((m) => m.mediaIndex === clampedIndex)
    .sort((a, b) => a.order - b.order);

  return (
    <div style={fillWidth ? { width: "100%" } : { width: `${effectiveMaxW}px`, maxWidth: "100%" }}>
      <div
        className="relative overflow-hidden rounded-sm select-none bg-bg-soft"
        style={{
          height: `${effectiveHeight}px`,
          opacity: ready ? 1 : 0,
          transition: ready ? "opacity 200ms ease-out" : "none",
        }}
      >
        {/* §108과 동일 취지 — 항목이 바뀌어도 같은 DOM 트리를 최대한
            유지한다(이미지/영상 종류가 바뀌는 드문 경우만 예외). */}
        <MediaView item={current} />

        {/* §135 — 보정 위치 마커. 퍼센트 좌표라 사진 표시 크기가 반응형으로
            바뀌어도 항상 같은 상대 위치를 가리킨다. */}
        {currentMarkers.map((m) => (
          <div
            key={m.id}
            className="absolute z-10"
            style={{ left: `${m.x}%`, top: `${m.y}%`, transform: "translate(-50%, -50%)" }}
            onMouseEnter={() => setHoveredMarker(m.id)}
            onMouseLeave={() => setHoveredMarker((h) => (h === m.id ? null : h))}
          >
            <span
              className="absolute rounded-full animate-ping"
              style={{
                left: "50%",
                top: "50%",
                width: "28px",
                height: "28px",
                marginLeft: "-14px",
                marginTop: "-14px",
                background: "var(--accent)",
                opacity: 0.6,
              }}
            />
            <span
              className="relative block h-5 w-5 rounded-full border-2 border-white cursor-help transition-transform duration-200 hover:scale-125"
              style={{ background: "var(--accent)", boxShadow: "0 0 0 3px rgba(0,0,0,0.45), 0 2px 6px rgba(0,0,0,0.4)" }}
            />
            {hoveredMarker === m.id && m.label && (
              <div
                className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-max max-w-[260px] whitespace-normal text-center rounded-md bg-black/90 px-3.5 py-2.5 text-base font-medium leading-snug text-white shadow-lg pointer-events-none"
                role="tooltip"
              >
                {m.label}
              </div>
            )}
          </div>
        ))}

        {sorted.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="이전 사진"
              className="absolute left-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white text-lg leading-none hover:bg-black/75 transition-colors duration-300 z-20"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="다음 사진"
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white text-lg leading-none hover:bg-black/75 transition-colors duration-300 z-20"
            >
              ›
            </button>
          </>
        )}
      </div>

      {sorted.length > 1 && (
        <div className="mt-1 text-center">
          <span className="font-en text-xs text-ink-muted tabular-nums">
            {clampedIndex + 1} / {sorted.length}
          </span>
        </div>
      )}
    </div>
  );
}
