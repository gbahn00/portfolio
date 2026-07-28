"use client";

import { useEffect, useRef, useState, ReactNode } from "react";
import { cn } from "@/lib/utils";

// ============================================================================
// §105 — "상세 이미지" 목록이 1~끝 번호까지 순서대로 계속 왼쪽으로 흘러가며
// 반복되는(1,2,3,4,1,2,3,4,...) 자동 슬라이드로 바꿔달라는 요청. 기존
// SlideCarousel(화살표로 직접 넘기는 방식)과 달리 사용자 조작 없이 항상
// 움직인다.
//
// 구현 방식: 실제 항목 목록을 통째로 두 번 이어붙여(items+items) 트랙을
// 만들고, CSS transform을 0 → -50%까지 선형으로 무한 반복시킨다. 두
// 사본이 완전히 동일하므로 -50% 지점(=두 번째 사본의 시작 지점)에
// 도달하는 순간 첫 번째 사본이 시작하던 모습과 픽셀 단위로 똑같아,
// 애니메이션이 처음으로 되감기는 순간에도 이음매(끊김)가 보이지 않는다.
//
// 각 항목의 실제 폭은 이미지 원본 비율에 따라 로드 후에 정해지므로,
// 고정된 재생 시간 대신 트랙 전체 폭(scrollWidth)을 측정해 "초당 px
// 이동 속도(speed)"가 항상 일정하게 유지되도록 재생 시간을 계산한다.
// ============================================================================

interface AutoScrollRowProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  keyFn: (item: T, index: number) => string | number;
  className?: string;
  heightClassName?: string;
  /** 항목 사이 간격 (트랙을 두 번 이어붙이므로, 마지막 항목에도 동일하게 적용돼야 이음매가 자연스럽다) */
  gapClassName?: string;
  /** 초당 이동 픽셀 수 — 값이 클수록 빠르게 흐른다 */
  speed?: number;
}

export function AutoScrollRow<T>({
  items,
  renderItem,
  keyFn,
  className,
  heightClassName = "h-72 sm:h-80 md:h-96",
  gapClassName = "mr-3 md:mr-4",
  speed = 55,
}: AutoScrollRowProps<T>) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState(30);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    function measure() {
      const half = (el as HTMLDivElement).scrollWidth / 2;
      if (half > 0) setDuration(half / speed);
    }
    measure();
    // 이미지/영상이 로드되며 실제 폭이 뒤늦게 확정되는 경우를 대비해
    // ResizeObserver로 폭 변화를 계속 감시한다.
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [items.length, speed]);

  if (items.length === 0) return null;

  const doubled = [...items, ...items];

  return (
    <div className={cn("overflow-hidden", className)}>
      <div
        ref={trackRef}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        className={cn("flex w-max", heightClassName)}
        style={{
          animation: `auto-scroll-x ${duration}s linear infinite`,
          animationPlayState: paused ? "paused" : "running",
        }}
      >
        {doubled.map((item, i) => (
          <div key={`${keyFn(item, i % items.length)}-${i}`} className={cn("h-full flex-shrink-0", gapClassName)}>
            {renderItem(item, i % items.length)}
          </div>
        ))}
      </div>
    </div>
  );
}
