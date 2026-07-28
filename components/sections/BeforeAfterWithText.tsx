"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { BeforeAfterPair } from "@/lib/types";
import { BeforeAfterSlider } from "@/components/sections/BeforeAfterSlider";

// ============================================================================
// §112~115 — 사진 높이를 텍스트에 맞추거나(§111) 반대로 텍스트를 사진
// 높이에 맞추는(§112/115, overflow-y-auto로 텍스트 칸 안에서 스크롤)
// 시도를 차례로 해봤는데, "작은 쪽은 스크롤을 내려야 다 보인다"는
// 피드백으로 §116에서 "억지로 맞추지 않고 각자 자연스러운 크기로 둔다"
// 방향으로 정리했었다.
//
// §127 — "프로젝트 개요~Tools를 다 작성했을 때의 세로 크기에 사진 세로를
// 맞춰달라, 가로는 원본 비율대로 따라가도 된다"는 요청을 다시 받아
// 방향을 바꿨다. 이번엔 §112 때와 달리 텍스트 쪽에 스크롤 박스를 두지
// 않는다 — 오른쪽 텍스트 칸의 실제 렌더링 높이를 ResizeObserver로 재서
// 그 값을 사진 쪽(BeforeAfterSlider)에 targetHeightPx로 넘기면, 사진은
// 그 높이에 맞춰 자기 원본 비율대로 폭을 계산한다(크롭·찌그러짐 없음).
// 텍스트는 원래대로 자연스럽게 필요한 만큼 늘어난다 — 스크롤이 생기는
// 쪽은 이제 없다.
// ============================================================================
export function BeforeAfterWithText({ pairs, children }: { pairs: BeforeAfterPair[]; children: ReactNode }) {
  const textRef = useRef<HTMLDivElement>(null);
  const [textHeightPx, setTextHeightPx] = useState<number | undefined>(undefined);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setTextHeightPx(entry.contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">
      <div className="w-full md:w-auto md:flex-shrink-0">
        <BeforeAfterSlider pairs={pairs} targetHeightPx={textHeightPx} />
      </div>
      <div ref={textRef} className="flex-1 min-w-0 w-full">
        {children}
      </div>
    </div>
  );
}
