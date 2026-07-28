"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { BeforeAfterPair } from "@/lib/types";
import { BeforeAfterSlider } from "@/components/sections/BeforeAfterSlider";

// ============================================================================
// §112 — "보정 전/후 사진의 세로 비율을, 프로젝트 개요~기여도를 다 작성
// 했을 때의 텍스트 칸 실제 세로 길이와 정확히 일치시켜 달라"는 요청.
// 고정 비율(aspect-[3/4]) 같은 어림값으로는 프로젝트마다 다른 본문
// 길이에 맞지 않으므로, 오른쪽 텍스트 칸을 이 클라이언트 컴포넌트에서
// ref로 붙잡아 ResizeObserver로 실제 렌더링 높이(px)를 측정하고, 그
// 값을 왼쪽 사진(BeforeAfterSlider)의 높이로 그대로 넘긴다. 텍스트가
// 폰트 로딩/줄바꿈 등으로 나중에 다시 계산돼도 ResizeObserver가 계속
// 감시하므로 자동으로 다시 맞춰진다.
//
// §113 — "세로는 맞는데 가로가 이상하게 얇게 나온다"는 버그. 사진 안의
// 두 <img>가 object-cover를 쓰려고 둘 다 position:absolute라, 사진 박스
// 자체에는 "일반 흐름(in-flow)"에 놓인 자식이 하나도 없다. 예전엔
// md:w-auto(내용 크기만큼 줄어드는 shrink-to-fit)로 폭을 잡았는데,
// shrink-to-fit은 "in-flow 자식의 내용 크기"를 기준으로 계산하기 때문에
// absolute 자식만 있으면 기준으로 삼을 내용이 없어 폭이 거의 0으로
// 찌그러졌다. md:w-auto 대신 명확한 고정 폭(BeforeAfterSlider의
// max-w-lg와 같은 32rem)을 직접 지정해 shrink-to-fit 계산 자체를 피한다.
// ============================================================================
export function BeforeAfterWithText({ pairs, children }: { pairs: BeforeAfterPair[]; children: ReactNode }) {
  const textRef = useRef<HTMLDivElement>(null);
  const [heightPx, setHeightPx] = useState<number | undefined>(undefined);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setHeightPx(entry.contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">
      <div className="w-full md:w-[32rem] md:flex-shrink-0">
        <BeforeAfterSlider pairs={pairs} heightPx={heightPx} />
      </div>
      <div ref={textRef} className="flex-1 min-w-0 w-full">
        {children}
      </div>
    </div>
  );
}
