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
// 단위 스크롤이 가능한 "슬라이드" 느낌은 유지했다. 즉:
//   - 각 사진/영상은 높이만 고정(heightClassName)하고 폭은 원본 비율대로
//     자동으로 정해진다 → 화면 크기에 따라 여러 장이 동시에 보인다.
//   - 간격(gapClassName)을 좁혀 사진 사이 여백을 줄였다.
//   - 화살표를 누르면 "한 화면 분량"만큼 옆으로 스크롤한다(스냅 포함).
//   - 항목마다 폭이 달라 "몇 번째 슬라이드"가 명확하지 않으므로 점
//     인디케이터는 없애고, 더 스크롤할 내용이 있을 때만 화살표를 보여준다.
//
// §92 — "세로 슬라이드가 생겼다"는 신고. overflow-x-auto만 넣고
// overflow-y를 따로 지정하지 않으면, CSS 스펙상 한쪽 축이라도 visible이
// 아니게 지정되면 나머지 축의 계산값도 자동으로 visible→auto로 바뀐다
// (브라우저 표준 동작). 그래서 캡션 등 내용이 세로로 살짝 넘칠 때마다
// 의도치 않은 세로 스크롤(=세로 슬라이드)이 함께 생겼다. overflow-y를
// 명시적으로 hidden으로 고정해 가로 슬라이드만 남기고, 내용이 넘치는
// 경우는(§92, BeforeAfterSlider 캡션) 각 호출부에서 높이 예산을 미리
// 맞춰 잘리지 않게 했다.
// ============================================================================

export function SlideCarousel<T>({
  items,
  renderItem,
  keyOf,
  heightClassName = "h-72 sm:h-80 md:h-96",
  gapClassName = "gap-3 md:gap-4",
  className,
}: {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  keyOf?: (item: T, index: number) => string | number;
  heightClassName?: string;
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
          className={`flex items-start ${heightClassName} ${gapClassName} overflow-x-auto overflow-y-hidden snap-x snap-mandatory scroll-smooth -mx-1 px-1`}
        >
          {items.map((item, i) => (
            <div key={keyOf ? keyOf(item, i) : i} className="h-full shrink-0 snap-start">
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
