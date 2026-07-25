"use client";

import { ReactNode, useLayoutEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { onGoToSection, SectionId } from "@/lib/fullpage";

// ============================================================================
// 전체 구조 개편 명세서 §1(가장 중요) — 진짜 Full Page Scroll.
// 휠/트랙패드/터치 한 번의 제스처가 정확히 "다음 섹션 하나"로만 이동하고,
// 애니메이션이 끝나기 전까지는 추가 입력을 무시한다(디바운스/스냅 잠금).
//
// 구현 방식 참고: 화면을 통째로 transform으로 넘기는 방식(fullPage.js류)은
// 실제 window scrollY가 전혀 움직이지 않아, 각 섹션 안에 이미 만들어 둔
// ScrollTrigger 기반 등장/전환 애니메이션이 재생되지 않는 문제가 있다.
// 대신 섹션은 문서 흐름 그대로 두고, 다음/이전 섹션의 실제 위치까지
// window.scrollTo를 GSAP로 부드럽게 애니메이션한다 — 진짜 스크롤이 일어나므로
// 기존 애니메이션과 충돌하지 않는다.
//
// 데스크톱 + 모션 허용 환경에서만 켠다. 모바일은 컨텐츠 높이가 화면마다
// 달라 강제 스냅이 오히려 사용성을 해치므로 기존처럼 자유 스크롤 그대로 둔다.
// ============================================================================

const TRANSITION_DURATION = 0.85;
const COOLDOWN_MS = 120;
const WHEEL_THRESHOLD = 4;
const TOUCH_THRESHOLD = 40;

export function FullPageScroll({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const lockRef = useRef(false);
  const touchStartY = useRef<number | null>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (prefersReducedMotion()) return;

    const mm = gsap.matchMedia();

    mm.add("(min-width: 768px)", () => {
      function getSections() {
        return Array.from(root!.querySelectorAll<HTMLElement>("[data-fp-section]"));
      }

      function currentIndex() {
        const sections = getSections();
        const y = window.scrollY;
        let idx = 0;
        sections.forEach((el, i) => {
          if (el.offsetTop <= y + 2) idx = i;
        });
        return idx;
      }

      function animateTo(index: number) {
        const sections = getSections();
        const clamped = Math.max(0, Math.min(sections.length - 1, index));
        const target = sections[clamped];
        if (!target) return;
        lockRef.current = true;
        const proxy = { y: window.scrollY };
        gsap.to(proxy, {
          y: target.offsetTop,
          duration: TRANSITION_DURATION,
          ease: "power3.inOut",
          onUpdate: () => window.scrollTo(0, proxy.y),
          onComplete: () => {
            window.setTimeout(() => {
              lockRef.current = false;
            }, COOLDOWN_MS);
          },
        });
      }

      function goDelta(dir: 1 | -1) {
        if (lockRef.current) return;
        animateTo(currentIndex() + dir);
      }

      function onWheel(e: WheelEvent) {
        if (Math.abs(e.deltaY) < WHEEL_THRESHOLD) return;
        e.preventDefault();
        goDelta(e.deltaY > 0 ? 1 : -1);
      }

      function onKeyDown(e: KeyboardEvent) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        if (e.key === "PageDown" || e.key === "ArrowDown") {
          e.preventDefault();
          goDelta(1);
        } else if (e.key === "PageUp" || e.key === "ArrowUp") {
          e.preventDefault();
          goDelta(-1);
        }
      }

      function onTouchStart(e: TouchEvent) {
        touchStartY.current = e.touches[0]?.clientY ?? null;
      }
      function onTouchMove(e: TouchEvent) {
        if (touchStartY.current === null || lockRef.current) {
          e.preventDefault();
          return;
        }
        const dy = touchStartY.current - (e.touches[0]?.clientY ?? touchStartY.current);
        if (Math.abs(dy) > TOUCH_THRESHOLD) {
          e.preventDefault();
          goDelta(dy > 0 ? 1 : -1);
          touchStartY.current = null;
        }
      }
      function onTouchEnd() {
        touchStartY.current = null;
      }

      const offGoTo = onGoToSection((id: SectionId) => {
        const sections = getSections();
        const idx = sections.findIndex((el) => el.dataset.fpId === id);
        if (idx >= 0) animateTo(idx);
      });

      // 해시로 진입했을 때(예: /#projects) 해당 섹션으로 즉시 이동.
      if (window.location.hash) {
        const id = window.location.hash.slice(1);
        requestAnimationFrame(() => {
          const sections = getSections();
          const target = sections.find((el) => el.dataset.fpId === id);
          if (target) window.scrollTo(0, target.offsetTop);
        });
      }

      window.addEventListener("wheel", onWheel, { passive: false });
      window.addEventListener("keydown", onKeyDown);
      window.addEventListener("touchstart", onTouchStart, { passive: true });
      window.addEventListener("touchmove", onTouchMove, { passive: false });
      window.addEventListener("touchend", onTouchEnd);

      return () => {
        window.removeEventListener("wheel", onWheel);
        window.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("touchstart", onTouchStart);
        window.removeEventListener("touchmove", onTouchMove);
        window.removeEventListener("touchend", onTouchEnd);
        offGoTo();
      };
    });

    return () => mm.revert();
  }, []);

  return <div ref={rootRef}>{children}</div>;
}
