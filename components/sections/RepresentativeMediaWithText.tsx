"use client";

import { ReactNode } from "react";
import { MediaRef } from "@/lib/types";
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
const GAP_PX = 48; // md:gap-12
const MIN_TEXT_W = 320; // 텍스트 칸에 항상 남겨두는 최소 폭

export function RepresentativeMediaWithText({ media, children }: { media: MediaRef; children: ReactNode }) {
  const { ref: textRef, height: textHeightPx } = useElementHeight<HTMLDivElement>();
  const { ref: rowRef, width: rowWidth } = useElementWidth<HTMLDivElement>();
  const maxWidthPx = rowWidth ? Math.max(240, rowWidth - GAP_PX - MIN_TEXT_W) : undefined;

  return (
    <div ref={rowRef} className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">
      <div className="w-full md:w-auto md:flex-shrink-0">
        <RepresentativeMediaColumn media={media} targetHeightPx={textHeightPx} maxWidthPx={maxWidthPx} />
      </div>
      <div ref={textRef} className="flex-1 min-w-0 w-full">
        {children}
      </div>
    </div>
  );
}
