"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { MediaRef, RetouchMarker } from "@/lib/types";
import { mediaSrc, optimizedImageSrc } from "@/lib/utils";
import { refreshScrollTrigger } from "@/lib/gsap";

// ============================================================================
// §131 — "보정 전후 사진이 없다면 그 자리에 대표 이미지 또는 영상으로
// 대체할 수 있도록 해줘"라는 요청으로 만들었다. BeforeAfterSlider.tsx의
// "텍스트 칸 높이에 맞춰 원본 비율대로 크기를 계산하고, 크기가 확정되기
// 전엔 감춰서 잘못된 크기가 보이지 않게 한다(§128)" 로직을 그대로
// 가져오되, 비교 슬라이더가 아니라 이미지/영상 한 장만 고정으로 보여주는
// 훨씬 단순한 버전이다. 이미지는 <img>로, 영상은 <video controls>로
// 보여준다.
//
// §135 — "여러 장 첨부 + 보정 전후와 같은 화살표 이전/다음 방식"으로
// 요청이 바뀌면서, media를 단일 MediaRef가 아니라 배열로 받아
// BeforeAfterSlider.tsx(§103~129)와 같은 인덱스 기반 이전/다음 버튼
// 캐러셀로 확장했다. §108과 동일하게 DOM에 key를 주지 않아(같은 요소
// 유지, src만 교체) "화면이 새로고침되는 느낌"이 나지 않도록 했다.
//
// §135 — "인물 프로필" 프로젝트처럼 사진이 좌/우 정확히 50%를 채워야 하는
// 레이아웃(RepresentativeMediaWithText의 layout="half")에서는 폭을 100%
// 채우는 fillWidth 모드를 추가했다.
//
// §135-보정 — 처음엔 fillWidth일 때 높이를 텍스트 칸 높이에 고정하고
// object-cover로 채워서, 세로로 긴(인물) 사진을 첨부하면 위아래가
// 잘려나오는 문제가 있었다("50/50은 잘 되는데 세로 사진이 잘린다"는
// 피드백). 폭은 그대로 100%로 꽉 채우되, 높이는 사진 원본 가로세로
// 비율대로 CSS aspect-ratio로 계산해(자바스크립트로 실제 폭을 잴 필요
// 없이, 브라우저가 알아서 "폭 100% × 비율"로 높이를 정한다) 잘리지 않게
// 했다. 즉 폭은 항상 정확히 절반, 높이는 사진마다(가로가 넓으면 낮게,
// 세로로 길면 높게) 원본 비율 그대로 따라간다.
//
// §135 — 보정 위치 마커(RetouchMarker): 사진 위 특정 좌표(%)에 작은 점을
// 찍어두고, 커서를 올리면(hover) 어떤 부분을 보정했는지 설명이 뜬다.
// ============================================================================

const DEFAULT_HEIGHT = 480;
const MAX_W = 640;

function computeBoxFromHeight(naturalWidth: number, naturalHeight: number, targetHeight: number, maxWidth: number) {
  const ratio = naturalWidth / naturalHeight;
  let h = targetHeight;
  let w = h * ratio;
  if (w > maxWidth) {
    w = maxWidth;
    h = w / ratio;
  }
  return { w: Math.round(w), h: Math.round(h) };
}

function MediaView({
  item,
  onNaturalSize,
  fillWidth,
}: {
  item: MediaRef;
  onNaturalSize: (w: number, h: number) => void;
  fillWidth?: boolean;
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

  const fitClass = fillWidth ? "object-cover" : "object-cover";

  return isVideo ? (
    <video
      ref={videoRef}
      src={mediaSrc(item.url)}
      poster={item.poster}
      controls
      controlsList="nodownload noremoteplayback"
      disablePictureInPicture
      onContextMenu={(e) => e.preventDefault()}
      playsInline
      onLoadedMetadata={handleVideoMeta}
      className={`absolute inset-0 h-full w-full ${fitClass}`}
    />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imgRef}
      src={optimizedImageSrc(item.url, 1080)}
      alt={item.alt || ""}
      onLoad={handleImgLoad}
      className={`absolute inset-0 h-full w-full ${fitClass} pointer-events-none`}
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
  // 그대로 채운다. true일 때는 aspect-ratio 계산 없이 폭 100% + 목표 높이만 쓴다.
  fillWidth?: boolean;
  // §135 — 현재 보이는 사진(index)에 해당하는 마커만 여기서 필터링해
  // 전달받는다고 가정하지 않고, 이 컴포넌트 안에서 mediaIndex로 직접 거른다.
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

  const effectiveHeight = targetHeightPx ?? DEFAULT_HEIGHT;
  const effectiveMaxW = maxWidthPx ?? MAX_W;
  const box = fillWidth
    ? { w: 0, h: 0 } // fillWidth 모드에서는 CSS aspect-ratio가 크기를 정하므로 여기선 안 쓴다.
    : natural
      ? computeBoxFromHeight(natural.w, natural.h, effectiveHeight, effectiveMaxW)
      : { w: Math.round(Math.min(effectiveHeight * 0.75, effectiveMaxW)), h: Math.round(effectiveHeight) };
  // §135-보정 — fillWidth 모드는 사진 원본 비율만 알면 되고(텍스트 칸
  // 높이는 더 이상 필요 없음), 비율을 아직 모르는 아주 짧은 순간에는
  // 감춰서 잘못된 비율(placeholder)이 보이지 않게 한다.
  const ready = fillWidth ? natural !== null : natural !== null && targetHeightPx !== undefined;
  const fillAspectRatio = natural ? `${natural.w} / ${natural.h}` : "4 / 5";

  const currentMarkers = (retouchMarkers ?? [])
    .filter((m) => m.mediaIndex === clampedIndex)
    .sort((a, b) => a.order - b.order);

  return (
    <div style={fillWidth ? { width: "100%" } : { width: `${box.w}px`, maxWidth: "100%" }}>
      <div
        className="relative overflow-hidden rounded-sm select-none bg-bg-soft"
        style={
          fillWidth
            ? { aspectRatio: fillAspectRatio, opacity: ready ? 1 : 0, transition: ready ? "opacity 200ms ease-out" : "none" }
            : { aspectRatio: `${box.w} / ${box.h}`, opacity: ready ? 1 : 0, transition: ready ? "opacity 200ms ease-out" : "none" }
        }
      >
        {/* §108과 동일 — key 없이 같은 DOM을 유지한 채 src만 바뀐다. */}
        <MediaView item={current} onNaturalSize={(w, h) => setNatural({ w, h })} fillWidth={fillWidth} />

        {/* §135 — 보정 위치 마커. 퍼센트 좌표라 사진 표시 크기가 반응형으로
            바뀌어도 항상 같은 상대 위치를 가리킨다.
            §135-보정 — "마커가 뭔지 궁금해도 눈에 잘 안 띈다"는 피드백으로
            강조를 키웠다: 점 뒤에 계속 번져나가는 링(animate-ping)을 추가해
            가만히 있어도 "여기 눌러볼 게 있다"는 게 시각적으로 드러나게
            했고, 점 자체도 흰색 반투명 대신 강조색(accent)으로 확실히
            보이게 바꿨다.
            §135-보정2 — "반짝이는 게 오른쪽으로만 퍼진다"는 버그. Tailwind의
            -translate-x-1/2/-translate-y-1/2(정중앙 배치용 transform)와
            animate-ping의 keyframe(transform: scale(2))이 같은 transform
            속성을 두고 충돌해서, 링이 중앙 기준으로 커지는 게 아니라
            "옮겨진 위치 → scale(2)"로 보간되며 한쪽으로 쏠려 보인 것이었다.
            transform 대신 margin으로 중앙 정렬해서(margin은 animate-ping과
            겹치지 않는 별개 속성) 이제 순수하게 transform: scale()만
            애니메이션되어 중앙에서 사방으로 고르게 퍼진다.
            설명 말풍선 글자도 text-xs → text-base로 키우고, 긴 설명은
            줄바꿈되도록(기존엔 한 줄 고정이라 길면 화면을 벗어날 수
            있었다) 손봤다. */}
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
