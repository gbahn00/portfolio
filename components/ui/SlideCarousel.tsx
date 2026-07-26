"use client";

import { useEffect, useRef, useState, ReactNode } from "react";

// ============================================================================
// §87-90 — 상세페이지 이미지/갤러리 영역을 "가로 슬라이드"로 바꿔달라는
// 요청을 여러 차례에 걸쳐 다듬었다.
//
// §87-89: 처음엔 슬라이드 한 장이 컨테이너 폭 전체를 채우는(한 번에 사진
// 하나만 꽉 차게 보이는) 방식으로 만들었는데, §91에서 "사진이 너무 크다 /
// 사진 사이 간격이 너무 넓다 / 슬라이드하면 한 장씩밖에 안 보인다"는
// 피드백을 받았다.
//
// §91 — 예전 방식(§69, 높이만 고정하고 폭은 원본 비율대로 옆으로 이어
// 붙이는 자유 스크롤)으로 크기 자체는 되돌리되, 화살표 버튼으로 페이지
// 단위 스크롤이 가능한 "슬라이드" 느낌은 유지했다.
//
// §92 — "세로 슬라이드가 생겼다"는 신고. overflow-x-auto만 넣고
// overflow-y를 따로 지정하지 않으면, CSS 스펙상 한쪽 축이라도 visible이
// 아니게 지정되면 나머지 축의 계산값도 자동으로 visible→auto로 바뀐다
// (브라우저 표준 동작). overflow-y를 명시적으로 hidden으로 고정했다.
//
// §93-94 — "사진 사이 간격이 너무 길다 / 사진이 하나밖에 안 보인다"는
// 신고가 반복됐다. flex 컨테이너 안에서 "폭을 지정하지 않은 항목"이 내용
// 크기만큼 줄어드는(shrink-to-fit) 계산은, 항목 내부에 이미지 하나만
// 있는 게 아니라 박스+캡션처럼 여러 레이어가 겹친 구조(예:
// BeforeAfterSlider)에서 브라우저마다 안정적으로 동작하지 않았다 —
// w-fit을 명시해도 여전히 항목이 트랙 전체 폭으로 늘어나 사진 하나만
// 보이고 나머지는 스크롤해야 보이는 문제가 재현됐다.
//
// §94 — flex 기반 shrink-to-fit 대신, 이미지 갤러리에서 가장 오래
// 검증된 안정적인 패턴인 "white-space: nowrap + inline-block"으로
// 트랙 구조를 바꿨다. inline 요소는 flex 아이템과 달리 항상 자기 내용
// 크기만큼만 차지하는 게 기본 동작이라 이런 폭 계산 문제 자체가 생기지
// 않는다.
// ============================================================================

export function SlideCarousel<T>({
  items,
  renderItem,
  keyOf,
  heightClassName = "h-72 sm:h-80 md:h-96",
  // §95 — "사진 사이 간격을 참고 이미지처럼 짧게" 요청. mr-3/mr-4(12~16px)에서
  // mr-1.5/mr-2(6~8px)로 줄였다.
  gapClassName = "mr-1.5 md:mr-2",
  className,
}: {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  keyOf?: (item: T, index: number) => string | number;
  heightClassName?: string;
  /** 항목 사이 간격. flex의 gap이 아니라 각 항목의 오른쪽 margin으로 준다. */
  gapClassName?: string;
  className?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  function updateArrows() {
    const track = trackRef.current;
    if (!track) return;
    setCanPrev(track.scrollLeft > 4);
    setCanNext(track.scrollLeft + track.clientWidth < track.scrollWidth - 4);
  }

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    updateArrows();

    // 이미지/영상이 뒤늦게 로드되며 각 항목의 실제 폭(scrollWidth)이
    // 늘어나는 경우를 대비해, 각 슬라이드 항목의 크기 변화를 감지해서
    // 화살표 표시 여부를 다시 계산한다.
    const ro = new ResizeObserver(updateArrows);
    Array.from(track.children).forEach((el) => ro.observe(el));
    window.addEventListener("resize", updateArrows);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateArrows);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  function scrollByPage(dir: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: dir * track.clientWidth * 0.9, behavior: "smooth" });
  }

  if (items.length === 0) return null;

  return (
    <div className={className}>
      <div className="relative">
        <div
          ref={trackRef}
          onScroll={updateArrows}
          className={`whitespace-nowrap ${heightClassName} overflow-x-auto overflow-y-hidden snap-x snap-mandatory scroll-smooth -mx-1 px-1`}
        >
          {items.map((item, i) => (
            <div
              key={keyOf ? keyOf(item, i) : i}
              className={`inline-block align-top h-full snap-start ${i < items.length - 1 ? gapClassName : ""}`}
            >
              {renderItem(item, i)}
            </div>
          ))}
        </div>

        {canPrev && (
          <button
            type="button"
            aria-label="이전"
            onClick={() => scrollByPage(-1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-bg/70 text-ink border border-line backdrop-blur-sm transition-opacity duration-[0.25s] hover:border-ink/40"
          >
            ‹
          </button>
        )}
        {canNext && (
          <button
            type="button"
            aria-label="다음"
            onClick={() => scrollByPage(1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-bg/70 text-ink border border-line backdrop-blur-sm transition-opacity duration-[0.25s] hover:border-ink/40"
          >
            ›
          </button>
        )}
      </div>
    </div>
  );
}
