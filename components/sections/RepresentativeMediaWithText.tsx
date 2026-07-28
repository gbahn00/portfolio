"use client";

import { ReactNode } from "react";
import { MediaRef } from "@/lib/types";
import { RepresentativeMediaColumn } from "@/components/sections/RepresentativeMediaColumn";
import { useElementHeight } from "@/lib/hooks/useElementHeight";

// §131 — 보정 전후 사진이 없는 프로젝트는 그 자리를 텍스트만으로 채웠는데,
// "그 자리에 대표 이미지 또는 영상으로 대체할 수 있게 해달라"는 요청으로
// BeforeAfterWithText.tsx와 같은 "왼쪽 사진/영상 + 오른쪽 프로젝트 개요~
// Tools" 2단 레이아웃을 재사용한다(사진 대신 대표 이미지/영상 한 장만
// 고정으로 보여준다는 점만 다르다).
export function RepresentativeMediaWithText({ media, children }: { media: MediaRef; children: ReactNode }) {
  const { ref: textRef, height: textHeightPx } = useElementHeight<HTMLDivElement>();

  return (
    <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">
      <div className="w-full md:w-auto md:flex-shrink-0">
        <RepresentativeMediaColumn media={media} targetHeightPx={textHeightPx} />
      </div>
      <div ref={textRef} className="flex-1 min-w-0 w-full">
        {children}
      </div>
    </div>
  );
}
