"use client";

import { ReactNode } from "react";
import { BeforeAfterPair } from "@/lib/types";
import { BeforeAfterSlider } from "@/components/sections/BeforeAfterSlider";

// ============================================================================
// §112~115 — 사진 높이를 텍스트에 맞추거나(§111) 반대로 텍스트를 사진
// 높이에 맞추는(§112/115, overflow-y-auto로 텍스트 칸 안에서 스크롤)
// 시도를 차례로 해봤는데, 결국 "작은 쪽은 스크롤을 내려야 다 보인다"는
// 피드백을 받았다 — 어느 쪽이든 하나를 억지로 다른 쪽 높이에 맞추면
// 내용이 잘리거나(스크롤 필요) 사진이 찌그러지는 문제가 생긴다.
//
// §116 — 그래서 "높이를 강제로 맞추는" 접근 자체를 그만두고, 사진은
// 원본 비율 그대로(찌그러짐/크롭 없음) 자연스러운 높이로 두고, 텍스트도
// 스크롤 없이 필요한 만큼 자연스럽게 늘어나게 뒀다. 대신 사진의 폭
// 상한을 넉넉하게 키워서(BeforeAfterSlider의 max-w-xl) 같은 비율이라도
// 실제 렌더링 높이가 커지도록 해 두 칸의 시각적 균형을 개선했다 —
// "정확히 같은 높이"는 아니지만 사진이 깨지지도, 텍스트가 스크롤 박스에
// 갇히지도 않는 절충안이다.
// ============================================================================
export function BeforeAfterWithText({ pairs, children }: { pairs: BeforeAfterPair[]; children: ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">
      <div className="w-full md:w-auto md:flex-shrink-0">
        <BeforeAfterSlider pairs={pairs} />
      </div>
      <div className="flex-1 min-w-0 w-full">{children}</div>
    </div>
  );
}
