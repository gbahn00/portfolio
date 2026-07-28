"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { MediaRef } from "@/lib/types";
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

export function RepresentativeMediaColumn({
  media,
  targetHeightPx,
  maxWidthPx,
}: {
  media: MediaRef;
  targetHeightPx?: number;
  maxWidthPx?: number;
}) {
  const isVideo = media.kind === "video-file";
  const imgRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);

  // 마운트 시점에 이미 로드/디코딩이 끝나 있는 경우(캐시된 이미지, 메타데이터가
  // 이미 파악된 영상)를 대비해 §123/§128과 동일하게 동기적으로(useLayoutEffect)
  // 먼저 확인한다.
  useLayoutEffect(() => {
    if (isVideo) {
      const v = videoRef.current;
      if (v && v.videoWidth && v.videoHeight) {
        setNatural({ w: v.videoWidth, h: v.videoHeight });
      }
    } else {
      const img = imgRef.current;
      if (img && img.complete && img.naturalWidth && img.naturalHeight) {
        setNatural({ w: img.naturalWidth, h: img.naturalHeight });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [media.url]);

  function handleImgLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    refreshScrollTrigger();
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) setNatural({ w: img.naturalWidth, h: img.naturalHeight });
  }
  function handleVideoMeta(e: React.SyntheticEvent<HTMLVideoElement>) {
    refreshScrollTrigger();
    const v = e.currentTarget;
    if (v.videoWidth && v.videoHeight) setNatural({ w: v.videoWidth, h: v.videoHeight });
  }

  const effectiveHeight = targetHeightPx ?? DEFAULT_HEIGHT;
  const effectiveMaxW = maxWidthPx ?? MAX_W;
  const box = natural
    ? computeBoxFromHeight(natural.w, natural.h, effectiveHeight, effectiveMaxW)
    : { w: Math.round(Math.min(effectiveHeight * 0.75, effectiveMaxW)), h: Math.round(effectiveHeight) };
  // §128과 동일 — 진짜 크기(텍스트 높이 + 원본 비율)가 둘 다 확정되기
  // 전까지는 감춰서, 잘못된 크기의 이미지/영상이 잠깐 보이는 일이 없게 한다.
  const ready = natural !== null && targetHeightPx !== undefined;

  return (
    <div style={{ width: `${box.w}px`, maxWidth: "100%" }}>
      <div
        className="relative overflow-hidden rounded-sm select-none bg-bg-soft"
        style={{
          aspectRatio: `${box.w} / ${box.h}`,
          opacity: ready ? 1 : 0,
          transition: ready ? "opacity 200ms ease-out" : "none",
        }}
      >
        {isVideo ? (
          <video
            ref={videoRef}
            src={mediaSrc(media.url)}
            poster={media.poster}
            controls
            controlsList="nodownload noremoteplayback"
            disablePictureInPicture
            onContextMenu={(e) => e.preventDefault()}
            playsInline
            onLoadedMetadata={handleVideoMeta}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={imgRef}
            src={optimizedImageSrc(media.url, 1080)}
            alt={media.alt || ""}
            onLoad={handleImgLoad}
            className="absolute inset-0 h-full w-full object-cover pointer-events-none"
            draggable={false}
          />
        )}
      </div>
    </div>
  );
}
