"use client";

import { ReactNode } from "react";
import { BeforeAfterPair } from "@/lib/types";
import { BeforeAfterSlider } from "@/components/sections/BeforeAfterSlider";
import { useElementHeight } from "@/lib/hooks/useElementHeight";

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
//
// §128 — "새로고침하면 사진 크기가 이상한 크기로 바뀌었다가 원래대로
// 돌아온다"는 버그 제보. 원인은 초기 렌더에서 textHeightPx가 아직
// undefined라서 사진 쪽이 임시 기본값(DEFAULT_HEIGHT)으로 한 번 그려진
// 뒤, 이 useEffect의 ResizeObserver가 (브라우저가 화면을 그린 다음에야)
// 진짜 텍스트 높이를 재서 값을 바꾸면서 사진이 다시 리사이즈되는
// "눈에 보이는 점프"였다. useEffect는 브라우저가 이미 화면을 한 번
// 그린 뒤에 실행되기 때문에 이 점프가 사용자 눈에 보인다.
//
// useLayoutEffect + getBoundingClientRect로 마운트 시점에 텍스트 높이를
// "동기적으로" 먼저 재서 첫 렌더 결과에 곧바로 반영되도록 바꿨다 —
// useLayoutEffect 안에서의 setState는 브라우저가 화면을 그리기 전에
// 다시 렌더링을 끝내므로, 화면에는 처음부터 맞는 크기만 보인다.
// ResizeObserver는 그 이후 창 크기 변경 등 추가 변화를 잡기 위해 그대로
// 둔다.
//
// §129 — "디테일컷 | 모델컷 | 프로젝트 개요~Tools" 3단 구조 요청. pairs를
// category("detail"/"model")로 나눠서, 두 그룹이 모두 하나 이상 있으면
// 사진 칸을 두 개(BeforeAfterSlider 두 개, 각자 독립된 index 상태를
// 갖고 있어 이전/다음 넘기기가 서로 영향을 주지 않는다)로 나눠 보여주고,
// 그렇지 않으면(구분을 지정하지 않은 기존 프로젝트들) 예전처럼 구분 없는
// 단일 슬라이더 하나로 보여준다 — 다른 프로젝트들의 화면은 그대로다.
// 사진 칸이 두 개가 되면 각각의 폭 상한(MAX_W)을 줄여서(SPLIT_MAX_W)
// 텍스트 칸을 밀어내지 않게 한다.
//
// §131 — 텍스트 높이를 재는 로직을 lib/hooks/useElementHeight.ts 공용
// 훅으로 뺐다(보정 전후 사진이 없을 때 대표 이미지/영상으로 대체하는
// RepresentativeMediaWithText.tsx에서도 똑같은 로직이 필요해졌다).
// ============================================================================

const SPLIT_MAX_W = 380; // 사진 칸이 두 개(디테일컷/모델컷)일 때 각 칸의 폭 상한

export function BeforeAfterWithText({ pairs, children }: { pairs: BeforeAfterPair[]; children: ReactNode }) {
  const { ref: textRef, height: textHeightPx } = useElementHeight<HTMLDivElement>();

  const detailPairs = pairs.filter((p) => p.category === "detail");
  const modelPairs = pairs.filter((p) => p.category === "model");
  const isSplit = detailPairs.length > 0 && modelPairs.length > 0;

  return (
    <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">
      {isSplit ? (
        <>
          <div className="w-full md:w-auto md:flex-shrink-0">
            <h3 className="text-sm font-medium text-ink-muted mb-2 text-korean">디테일컷</h3>
            <BeforeAfterSlider pairs={detailPairs} targetHeightPx={textHeightPx} maxWidthPx={SPLIT_MAX_W} />
          </div>
          <div className="w-full md:w-auto md:flex-shrink-0">
            <h3 className="text-sm font-medium text-ink-muted mb-2 text-korean">모델컷</h3>
            <BeforeAfterSlider pairs={modelPairs} targetHeightPx={textHeightPx} maxWidthPx={SPLIT_MAX_W} />
          </div>
        </>
      ) : (
        <div className="w-full md:w-auto md:flex-shrink-0">
          <BeforeAfterSlider pairs={pairs} targetHeightPx={textHeightPx} />
        </div>
      )}
      <div ref={textRef} className="flex-1 min-w-0 w-full">
        {children}
      </div>
    </div>
  );
}
