"use client";

import { useLayoutEffect, useRef, useState } from "react";
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
// 캐러셀로 확장했다.
//
// §140 — 높이/폭/크롭 방식을 최종적으로 다음과 같이 정리했다(§138의
// "높이·폭 모두 고정 + cover/크롭" → §139의 "높이·폭 모두 고정 +
// contain/여백"을 거쳐, "여백도 크롭도 최소화하면서 높이는 항상
// 맞춰달라"는 요청에 맞춰 재조정):
//   - 높이는 항상 텍스트 칸 높이(targetHeightPx)로 고정 — 예외 없음.
//   - 폭은 "사진 원본 비율 × 고정 높이"로 계산해서, 정상적인 비율의
//     사진/영상이라면 컨테이너가 사진 모양 그대로(크롭도 여백도 없이)
//     맞춰진다. 계산된 폭이 주어진 상한(maxWidthPx — auto 레이아웃은
//     옆 텍스트 칸을 침범하지 않는 값, half 레이아웃은 실제 칸 폭)보다
//     작으면 그 폭 그대로 쓰고 가운데 정렬한다(§135-보정에서 겪었던
//     "half인데 강제로 폭을 채워 세로 사진이 잘리는" 문제 재발 방지).
//   - 계산된 폭이 상한을 넘을 때만(아주 넓은 파노라마 등) 상한으로
//     잘라내고, 그 드문 경우에만 object-fit: cover +
//     object-position(MediaRef.focusX/focusY)으로 "필요한 만큼만" 잘라
//     보여준다. 상한에 걸리지 않는 대부분의 경우엔 컨테이너 비율 자체가
//     사진 비율과 똑같아서 cover가 크롭 없이 꽉 채우는 것과 동일하다.
//   - 영상도 이미지와 동일한 규칙(원본 비율 → 폭 계산)을 적용하기 위해
//     자연 크기(videoWidth/videoHeight)를 로드 시점에 재서 사용한다.
//
// §135 — 보정 위치 마커(RetouchMarker): 사진 위 특정 좌표(%)에 작은 점을
// 찍어두고, 커서를 올리면(hover) 어떤 부분을 보정했는지 설명이 뜬다.
// ============================================================================

const DEFAULT_HEIGHT = 480;
const MAX_W = 640;

// §143 — "원본 비율 그대로, 가로가 잘리면 안 된다"는 요청으로
// BeforeAfterSlider와 동일하게 바꿨다: 폭이 상한을 넘으면 높이도 같은
// 비율로 함께 줄여서 박스 비율이 항상 사진 원본 비율과 정확히 같도록
// 한다 — object-cover가 크롭할 게 없어 어떤 경우에도 잘리지 않는다.
function computeBoxFromHeight(naturalWidth: number, naturalHeight: number, targetHeight: number, maxWidth: number) {
  const ratio = naturalWidth / naturalHeight;
  let w = targetHeight * ratio;
  let h = targetHeight;
  if (w > maxWidth) {
    w = maxWidth;
    h = w / ratio;
  }
  return { w: Math.round(w), h: Math.round(h) };
}

function MediaView({
  item,
  objectPosition,
  onNaturalSize,
  ready,
}: {
  item: MediaRef;
  objectPosition: string;
  onNaturalSize: (w: number, h: number) => void;
  ready: boolean;
}) {
  const isVideo = item.kind === "video-file";
  const imgRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // §123/§128과 동일 — 이미 로드/디코딩이 끝나 있는 경우(캐시된 이미지,
  // 메타데이터가 이미 파악된 영상)를 대비해 마운트/항목 교체 시점에
  // 동기적으로(useLayoutEffect) 먼저 확인한다.
  useLayoutEffect(() => {
    if (isVideo) {
      const v = videoRef.current;
      if (v && v.videoWidth && v.videoHeight) onNaturalSize(v.videoWidth, v.videoHeight);
    } else {
      const img = imgRef.current;
      if (img && img.complete && img.naturalWidth && img.naturalHeight) onNaturalSize(img.naturalWidth, img.naturalHeight);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.url]);

  function handleImgLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    refreshScrollTrigger();
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) onNaturalSize(img.naturalWidth, img.naturalHeight);
  }
  function handleVideoMeta(e: React.SyntheticEvent<HTMLVideoElement>) {
    refreshScrollTrigger();
    const v = e.currentTarget;
    if (v.videoWidth && v.videoHeight) onNaturalSize(v.videoWidth, v.videoHeight);
  }

  return isVideo ? (
    // §148 — 이 박스 크기는 영상의 실제 가로세로 비율(videoWidth/Height)을
    // 재서(onNaturalSize) 계산하므로, 메타데이터 없이는 올바른 크기로
    // 그릴 수 없다. preload="metadata"로 본문(수십 MB)은 미루면서도 비율
    // 정보만 가볍게 먼저 받는다.
    <video
      ref={videoRef}
      src={mediaSrc(item.url)}
      poster={item.poster}
      controls
      controlsList="nodownload noremoteplayback"
      disablePictureInPicture
      onContextMenu={(e) => e.preventDefault()}
      playsInline
      preload="metadata"
      onLoadedMetadata={handleVideoMeta}
      className="absolute inset-0 h-full w-full object-cover"
      style={{ objectPosition, opacity: ready ? 1 : 0, transition: "opacity 200ms ease-out" }}
    />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    // §142 — "원본 해상도를 최대한 유지, 흐릿하게 보이지 않도록"라는
    // 요청으로 최적화 요청 폭을 1080 → 1920으로 올렸다(레티나 화면에서도
    // 이 박스가 가질 수 있는 최대 CSS 폭 대비 넉넉한 여유를 둔다).
    // §152 — opacity를 박스 전체가 아니라 이 이미지 자체에 줘서, 로딩
    // 중에는 박스의 스켈레톤(결) 배경이 그대로 보이다가 이미지만 살짝
    // 나타나도록 바꿨다(예전엔 박스째 투명해져 그 뒤 페이지 배경이 그대로
    // 비쳤다).
    <img
      ref={imgRef}
      src={optimizedImageSrc(item.url, 1920)}
      alt={item.alt || ""}
      onLoad={handleImgLoad}
      className="absolute inset-0 h-full w-full object-cover pointer-events-none"
      style={{ objectPosition, opacity: ready ? 1 : 0, transition: "opacity 200ms ease-out" }}
      draggable={false}
      decoding="async"
    />
  );
}

export function RepresentativeMediaColumn({
  media,
  targetHeightPx,
  maxWidthPx,
  retouchMarkers,
}: {
  media: MediaRef[];
  targetHeightPx?: number;
  // §140 — 컨테이너 폭의 상한. auto 레이아웃(RepresentativeMediaWithText)은
  // 옆 텍스트 칸을 침범하지 않는 값을, half 레이아웃은 실제 칸(50%) 폭을
  // 측정해 넘겨준다. 사진 비율이 이 상한보다 좁은 폭이면 그 좁은 폭
  // 그대로 쓰고(강제로 채우지 않음, 가운데 정렬), 넘을 때만 이 상한으로 잘린다.
  maxWidthPx?: number;
  retouchMarkers?: RetouchMarker[];
}) {
  const sorted = media.filter((m) => m?.url);
  const [index, setIndex] = useState(0);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [hoveredMarker, setHoveredMarker] = useState<string | null>(null);

  if (sorted.length === 0) return null;
  const clampedIndex = Math.min(index, sorted.length - 1);
  const current = sorted[clampedIndex];

  function go(dir: 1 | -1) {
    setIndex((i) => (Math.min(i, sorted.length - 1) + dir + sorted.length) % sorted.length);
  }

  // §140 — 높이는 항상 텍스트 칸의 실제 렌더링 높이(targetHeightPx)로
  // 고정한다. 폭은 사진 원본 비율(natural) × 높이로 계산해서, 사진마다
  // 자연스러운 폭이 나오게 한다(값이 아직 없는 최초 렌더 순간에는
  // DEFAULT_HEIGHT/추정 폭으로 자리만 잡고 실제로 보이진 않는다 — ready 참고).
  const effectiveHeight = Math.round(targetHeightPx ?? DEFAULT_HEIGHT);
  const effectiveMaxW = maxWidthPx ?? MAX_W;
  const box = natural
    ? computeBoxFromHeight(natural.w, natural.h, effectiveHeight, effectiveMaxW)
    : { w: Math.round(Math.min(effectiveHeight * 0.75, effectiveMaxW)), h: effectiveHeight };
  const ready = natural !== null && targetHeightPx !== undefined;
  const objectPosition = `${current.focusX ?? 50}% ${current.focusY ?? 50}%`;

  const currentMarkers = (retouchMarkers ?? [])
    .filter((m) => m.mediaIndex === clampedIndex)
    .sort((a, b) => a.order - b.order);

  return (
    <div style={{ width: `${box.w}px`, maxWidth: "100%" }} className="mx-auto md:mx-0">
      {/* §152 — 박스 자체는 항상 보이게 두고(더 이상 opacity로 통째로
          숨기지 않는다), 준비되기 전까지는 은은한 스켈레톤 결을 배경으로
          보여준다 — 빈 화면 대신 "곧 채워질 자리"라는 느낌을 준다. 실제
          이미지/영상은 MediaView 안에서 자기 자신의 opacity로 따로
          페이드인한다. */}
      <div
        className={`relative overflow-hidden rounded-sm select-none ${ready ? "bg-bg-soft" : "media-skeleton"}`}
        style={{ height: `${box.h}px` }}
      >
        {/* §108과 동일 취지 — 항목이 바뀌어도 같은 DOM 트리를 최대한
            유지한다(이미지/영상 종류가 바뀌는 드문 경우만 예외). */}
        <MediaView item={current} objectPosition={objectPosition} onNaturalSize={(w, h) => setNatural({ w, h })} ready={ready} />

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
