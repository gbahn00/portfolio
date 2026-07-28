"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { BeforeAfterPair } from "@/lib/types";
import { BeforeAfterSlider } from "@/components/sections/BeforeAfterSlider";

// ============================================================================
// §112 — 처음엔 반대 방향(텍스트 칸 실측 높이를 사진에 맞춤)으로
// 만들었는데, §115에서 "사진은 원본 비율 그대로, 대신 텍스트를 사진
// 높이에 맞춰달라"는 재요청으로 방향을 뒤집었다. 왼쪽 사진 칸(폭 기준
// 원본 비율이라 사진마다 세로 크기가 다름)을 ResizeObserver로 측정해,
// 그 높이를 오른쪽 텍스트 칸의 최대 높이로 준다. 텍스트가 그 안에 다
// 안 들어가면(사진보다 본문이 길면) 텍스트 칸 안에서만 세로 스크롤되게
// 해서 내용이 잘리지 않게 한다.
//
// §113에서 확인한 "폭이 찌그러지는" 원인(자식이 전부 position:absolute면
// shrink-to-fit 폭 계산이 0에 가깝게 무너짐)은 사진을 다시 원본 비율
// (일반 흐름 img)로 되돌리면서 자연히 해소돼, 사진 칸은 다시 md:w-auto
// (내용 크기만큼) 폭으로 되돌렸다.
//
// 모바일(md 미만)에서는 사진이 텍스트 위에 세로로 쌓이는 1단 구조라
// "텍스트 칸 높이를 사진에 맞추는" 제약이 의미가 없어서, 데스크톱
// (min-width: 768px) 때만 적용한다.
// ============================================================================
export function BeforeAfterWithText({ pairs, children }: { pairs: BeforeAfterPair[]; children: ReactNode }) {
  const photoRef = useRef<HTMLDivElement>(null);
  const [photoHeightPx, setPhotoHeightPx] = useState<number | undefined>(undefined);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const el = photoRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setPhotoHeightPx(entry.contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const clampText = isDesktop && photoHeightPx;

  return (
    <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">
      <div ref={photoRef} className="w-full md:w-auto md:flex-shrink-0">
        <BeforeAfterSlider pairs={pairs} />
      </div>
      <div
        className={`flex-1 min-w-0 w-full ${clampText ? "md:overflow-y-auto" : ""}`}
        style={clampText ? { maxHeight: `${photoHeightPx}px` } : undefined}
      >
        {children}
      </div>
    </div>
  );
}
