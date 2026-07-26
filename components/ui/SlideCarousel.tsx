"use client";

import { useRef, useState, ReactNode } from "react";

// ============================================================================
// §87 — 대표 프로젝트 상세페이지의 이미지/갤러리 영역을 "가로 슬라이드"
// 형식으로 바꿔달라는 요청. 기존에는 높이만 고정하고 폭은 원본 비율대로
// 옆으로 이어 붙이는 자유 스크롤 방식(GalleryGrid)이었는데, 이제는 한
// 슬라이드가 컨테이너 폭 전체를 채우고(1단) 좌우 화살표·점 인디케이터로
// 다음/이전 슬라이드로 넘기는 진짜 "슬라이드" 방식으로 바꾼다.
//
// 프로젝트 1번(의류 촬영·보정, 보정 전/후 비교)만 예외적으로 슬라이드 한
// 장에 콘텐츠 2개를 나란히(2단) 보여달라는 요청이 있어, columns prop으로
// 1단/2단을 선택할 수 있게 만들었다. 이미지 갤러리(GalleryGrid)든 보정
// 전/후 비교(BeforeAfterSlider, 자체 드래그 인터랙션이 있는 컴포넌트)든
// 같은 슬라이드 틀을 재사용할 수 있도록 renderItem 콜백을 받는 제네릭
// 컴포넌트로 만들었다.
// ============================================================================

export function SlideCarousel<T>({
  items,
  columns = 1,
  renderItem,
  keyOf,
  gapClassName = "gap-4 md:gap-5",
  className,
}: {
  items: T[];
  columns?: 1 | 2;
  renderItem: (item: T, index: number) => ReactNode;
  keyOf?: (item: T, index: number) => string | number;
  gapClassName?: string;
  className?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const groups: T[][] = [];
  for (let i = 0; i < items.length; i += columns) groups.push(items.slice(i, i + columns));

  function scrollToIndex(idx: number) {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(groups.length - 1, idx));
    const slide = track.children[clamped] as HTMLElement | undefined;
    slide?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
    setActive(clamped);
  }

  function handleScroll() {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    const idx = Math.round(track.scrollLeft / track.clientWidth);
    setActive(Math.max(0, Math.min(groups.length - 1, idx)));
  }

  if (items.length === 0) return null;

  return (
    <div className={className}>
      <div className="relative">
        <div
          ref={trackRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth -mx-1 px-1"
        >
          {groups.map((group, gi) => (
            <div key={gi} className={`w-full shrink-0 snap-start flex ${gapClassName}`}>
              {group.map((item, i) => {
                const idx = gi * columns + i;
                return (
                  <div key={keyOf ? keyOf(item, idx) : idx} className={columns === 2 ? "flex-1 min-w-0" : "w-full"}>
                    {renderItem(item, idx)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {groups.length > 1 && (
          <>
            <button
              type="button"
              aria-label="이전 슬라이드"
              onClick={() => scrollToIndex(active - 1)}
              disabled={active === 0}
              className="absolute left-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-bg/70 text-ink border border-line backdrop-blur-sm transition-opacity duration-[0.25s] hover:border-ink/40 disabled:opacity-0 disabled:pointer-events-none"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="다음 슬라이드"
              onClick={() => scrollToIndex(active + 1)}
              disabled={active === groups.length - 1}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-bg/70 text-ink border border-line backdrop-blur-sm transition-opacity duration-[0.25s] hover:border-ink/40 disabled:opacity-0 disabled:pointer-events-none"
            >
              ›
            </button>
          </>
        )}
      </div>

      {groups.length > 1 && (
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {groups.map((_, gi) => (
            <button
              key={gi}
              type="button"
              aria-label={`${gi + 1}번째 슬라이드로 이동`}
              onClick={() => scrollToIndex(gi)}
              className={`h-1.5 rounded-full transition-all duration-[0.25s] ${
                gi === active ? "w-5 bg-ink" : "w-1.5 bg-line"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
