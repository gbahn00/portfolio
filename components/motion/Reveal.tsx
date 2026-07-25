"use client";

import { ReactNode, useLayoutEffect, useRef } from "react";
import { gsap, ScrollTrigger, BIDIRECTIONAL_TOGGLE, FAST_SCROLL_SAFE, prefersReducedMotion } from "@/lib/gsap";

interface RevealProps {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  /** "weak"(기본, 본문/보조 정보) | "strong"(제목류, 더 크게 이동) */
  strength?: "weak" | "strong";
}

/**
 * 화면에 들어올 때 아래에서 위로 나타나고, 위로 다시 스크롤하면 역방향으로
 * 사라졌다가 재진입 시 다시 재생되는 공통 등장 모션.
 * `autoAlpha`(opacity+visibility)를 사용해 비활성 상태에서 글자가 흐리게
 * 남거나 클릭 영역을 차지하는 잔상 문제를 방지합니다.
 */
export function Reveal({ children, delay = 0, y, className, strength = "weak" }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const distance = y ?? (strength === "strong" ? 40 : 22);

    if (prefersReducedMotion()) {
      gsap.set(el, { autoAlpha: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { autoAlpha: 0, y: distance },
        {
          autoAlpha: 1,
          y: 0,
          duration: strength === "strong" ? 1.0 : 0.7,
          delay,
          ease: "power3.out",
          overwrite: "auto",
          scrollTrigger: {
            trigger: el,
            // §17.1 — 일반 요소는 화면 80% 지점, 대형 제목류는 70% 지점에서 시작해
            // 애니메이션이 내용보다 먼저 실행되는 문제를 방지한다.
            start: strength === "strong" ? "top 70%" : "top 80%",
            end: "bottom 15%",
            toggleActions: BIDIRECTIONAL_TOGGLE,
            ...FAST_SCROLL_SAFE,
          },
        }
      );
    }, ref);

    return () => ctx.revert();
  }, [delay, y, strength]);

  return (
    <div ref={ref} className={className} style={{ visibility: "hidden", opacity: 0 }}>
      {children}
    </div>
  );
}

/** 여러 항목을 순차적으로(스태거) 등장시키는 그룹. 자식은 RevealItem을 사용합니다. */
export function RevealGroup({ children, className, stagger = 0.08 }: { children: ReactNode; className?: string; stagger?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const items = Array.from(el.querySelectorAll<HTMLElement>("[data-reveal-item]"));
    if (items.length === 0) return;

    if (prefersReducedMotion()) {
      gsap.set(items, { autoAlpha: 1, y: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        items,
        { autoAlpha: 0, y: 18 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.55,
          ease: "power3.out",
          stagger,
          overwrite: "auto",
          scrollTrigger: {
            trigger: el,
            start: "top 80%",
            end: "bottom 15%",
            toggleActions: BIDIRECTIONAL_TOGGLE,
            ...FAST_SCROLL_SAFE,
          },
        }
      );
    }, ref);

    return () => ctx.revert();
  }, [stagger]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

export function RevealItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div data-reveal-item className={className} style={{ visibility: "hidden", opacity: 0 }}>
      {children}
    </div>
  );
}
