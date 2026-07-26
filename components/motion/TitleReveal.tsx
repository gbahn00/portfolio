"use client";

import { useLayoutEffect, useRef } from "react";
import { MaskLines } from "./MaskLines";
import {
  gsap,
  BIDIRECTIONAL_TOGGLE,
  ENTER_ONLY_TOGGLE,
  FAST_SCROLL_SAFE,
  TEXT_MOTION,
  prefersReducedMotion,
} from "@/lib/gsap";
import { cn } from "@/lib/utils";

// ============================================================================
// §52 — "각 페이지 제목 텍스트에 모션을 반영해달라"는 요청에 따라 만든
// 컴포넌트. 지금까지 섹션 제목(h2)은 Reveal(공통 페이드+이동)만 썼는데,
// Hero/마지막 페이지의 헤드라인은 MaskLines로 줄 단위 마스크 리빌을 쓰고
// 있어 같은 "제목"인데 사이트 안에서 모션 언어가 서로 달랐다. 이 컴포넌트는
// MaskLines(줄 단위로 overflow-hidden 가림막에 넣는 렌더링)에 Reveal과
// 동일한 ScrollTrigger 패턴(스크롤 진입 시 재생, 필요하면 재진입도 지원)을
// 결합해서, 모든 섹션 제목이 Hero와 같은 "아래에서 올라오며 드러나는" 줄
// 단위 리빌 모션을 쓰도록 통일했다. 줄이 여러 개면 살짝 시차(stagger)를
// 둬 순서대로 드러난다.
// ============================================================================

export function TitleReveal({
  text,
  className,
  lineClassName,
  accentLines = [],
  delay = 0,
  holdAfterEnter = false,
}: {
  text: string;
  className?: string;
  lineClassName?: string;
  accentLines?: number[];
  delay?: number;
  holdAfterEnter?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const lines = root.querySelectorAll<HTMLElement>("[data-mask-line]");
    if (lines.length === 0) return;

    if (prefersReducedMotion()) {
      gsap.set(lines, { yPercent: 0, autoAlpha: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(lines, TEXT_MOTION.enterFrom, {
        ...TEXT_MOTION.enterTo,
        duration: 0.9,
        delay,
        stagger: 0.1,
        overwrite: "auto",
        scrollTrigger: {
          trigger: root,
          start: "top 70%",
          end: "bottom 15%",
          toggleActions: holdAfterEnter ? ENTER_ONLY_TOGGLE : BIDIRECTIONAL_TOGGLE,
          ...FAST_SCROLL_SAFE,
        },
      });
    }, ref);

    return () => ctx.revert();
  }, [delay, holdAfterEnter]);

  return (
    <span ref={ref} className="block">
      <MaskLines text={text} className={cn(className)} lineClassName={lineClassName} accentLines={accentLines} />
    </span>
  );
}
