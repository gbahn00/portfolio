"use client";

import { ReactNode } from "react";
import { MediaRef, RetouchMarker } from "@/lib/types";
import { RepresentativeMediaColumn } from "@/components/sections/RepresentativeMediaColumn";
import { useElementHeight, useElementWidth } from "@/lib/hooks/useElementHeight";

// §131 — 보정 전후 사진이 없는 프로젝트는 그 자리를 텍스트만으로 채웠는데,
// "그 자리에 대표 이미지 또는 영상으로 대체할 수 있게 해달라"는 요청으로
// BeforeAfterWithText.tsx와 같은 "왼쪽 사진/영상 + 오른쪽 프로젝트 개요~
// Tools" 2단 레이아웃을 재사용한다(사진 대신 대표 이미지/영상 한 장만
// 고정으로 보여준다는 점만 다르다).
//
// §132 — "대체 이미지가 옆 텍스트보다 세로로 작다, 자르거나 찌그러뜨리지
// 말고 그 세로 길이에 맞춰달라"는 요청. 가로로 아주 넓은 사진은 세로를
// 텍스트 높이에 맞추려면 폭이 커야 하는데, RepresentativeMediaColumn의
// 기본 폭 상한(640px)에 먼저 걸려 높이가 목표에 못 미쳤다. 이 줄(사진+
// 텍스트) 전체의 실제 폭을 useElementWidth로 재서, 거기서 텍스트 최소
// 폭(MIN_TEXT_W)만 남기고 나머지를 전부 사진 폭 상한으로 넘겨준다 —
// 그러면 텍스트 칸을 완전히 밀어내지 않는 선에서, 사진은 항상 원본
// 비율 그대로 세로를 최대한 채운다.
//
// §135 — media가 단일 MediaRef에서 배열로 바뀌어 여러 장을 이전/다음
// 버튼으로 넘겨볼 수 있게 됐다(RepresentativeMediaColumn 참고). 또한
// "인물 프로필" 프로젝트처럼 사진이 좌측 절반, 텍스트가 우측 절반을
// 정확히 채워야 하는 요청에 맞춰 layout="half" 옵션을 추가했다 — grid-
// cols-2로 폭을 정확히 50/50으로 나눈다.
//
// §138 — "좌측 이미지 상단·하단이 우측 콘텐츠 상단·하단과 정확히
// 맞아야 한다"는 요청으로, half 레이아웃도 auto와 마찬가지로
// targetHeightPx(텍스트 칸 실측 높이)를 사진에 그대로 전달한다
// (§135-보정에서 "세로 사진 잘림 방지"로 비율 유지 방식을 썼던 걸 다시
// 되돌린 것 — 이번엔 크롭 자체는 허용하되 MediaRef.focusX/focusY로
// 잘리는 위치를 조절하는 방향으로 절충했다. RepresentativeMediaColumn
// 참고). items-start로 둬도 두 칸의 실제 높이가 같아지므로(사진은
// targetHeightPx로 고정, 텍스트는 그 높이를 만든 원본이므로 당연히
// 같음) 상/하단이 자연히 맞는다. layout을 지정하지 않으면(기본값
// "auto") 기존 프로젝트들과 동일하게 동작해 회귀가 없다.
const GAP_PX = 48; // md:gap-12
const MIN_TEXT_W = 320; // 텍스트 칸에 항상 남겨두는 최소 폭

export function RepresentativeMediaWithText({
  media,
  children,
  layout = "auto",
  retouchMarkers,
}: {
  media: MediaRef[];
  children: ReactNode;
  layout?: "auto" | "half";
  retouchMarkers?: RetouchMarker[];
}) {
  const { ref: textRef, height: textHeightPx } = useElementHeight<HTMLDivElement>();
  const { ref: rowRef, width: rowWidth } = useElementWidth<HTMLDivElement>();
  const maxWidthPx = rowWidth ? Math.max(240, rowWidth - GAP_PX - MIN_TEXT_W) : undefined;

  if (layout === "half") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start">
        <div className="w-full">
          <RepresentativeMediaColumn media={media} targetHeightPx={textHeightPx} fillWidth retouchMarkers={retouchMarkers} />
        </div>
        <div ref={textRef} className="min-w-0 w-full">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div ref={rowRef} className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">
      <div className="w-full md:w-auto md:flex-shrink-0">
        <RepresentativeMediaColumn media={media} targetHeightPx={textHeightPx} maxWidthPx={maxWidthPx} retouchMarkers={retouchMarkers} />
      </div>
      <div ref={textRef} className="flex-1 min-w-0 w-full">
        {children}
      </div>
    </div>
  );
}
