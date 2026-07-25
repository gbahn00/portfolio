"use client";

import { ReactNode, useLayoutEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { onGoToSection, SectionId, getSubSteps } from "@/lib/fullpage";

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

// 인터랙션 수정 요청서 §3-4 — 페이지 전환 시간은 700ms로 되돌린다(직전
// 라운드에서 600ms로 줄였던 것을 요청서에 맞춰 복귀). "노트북에서 느리게
// 체감되는 문제"는 전환 시간 자체가 아니라 입력~애니메이션 시작 사이의
// 지연이 원인이므로, 시작 지연(setTimeout, 델타 누적 등)을 두지 않는
// 것으로 대응한다 — 아래 로직에는 애초에 그런 지연이 없다.
const TRANSITION_DURATION = 0.7;
const TRANSITION_EASE = "power2.out";
const COOLDOWN_MS = 90;
// §17 — 탭 전환(약 350ms)은 메인 페이지 전환(700ms)과 별도로 잠금 관리한다.
const TAB_TRANSITION_MS = 380;
const WHEEL_THRESHOLD = 4;
const TOUCH_THRESHOLD = 40;
// 프로필/업무 성장과정 섹션 내부에 스크롤로 넘어가는 하위 탭이 있다(§6-11, §25).
const SUB_STEP_SECTIONS: SectionId[] = ["profile", "growth"];

export function FullPageScroll({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const lockRef = useRef(false);
  const tabLockRef = useRef(false);
  const touchStartY = useRef<number | null>(null);
  // 스크롤 최종 수정 요청서 §5-6 — "6 → 4로 건너뛰는" 페이지 건너뛰기 버그의
  // 실제 원인은 매 프레임 window.scrollTo(0, y)를 "레거시 2-인자 형태"로
  // 호출한 것이었다. globals.css의 html { scroll-behavior: smooth }가 이
  // 형태의 호출에도 적용되어, GSAP가 이미 매 프레임 계산해 둔 값 위에
  // 브라우저가 또 한 번 자체적으로 부드럽게 보간하면서 실제 scrollY가
  // GSAP의 목표값보다 뒤처지게 된다. "현재 섹션"을 scrollY로부터 역산하지
  // 않고, activeIndexRef라는 단일 기준값으로 직접 관리해 이 문제를 원천
  // 차단한다. 한 번의 입력은 반드시 activeIndexRef ± 1 만큼만 바뀐다.
  const activeIndexRef = useRef(0);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (prefersReducedMotion()) return;

    const mm = gsap.matchMedia();

    mm.add("(min-width: 768px)", () => {
      function getSections() {
        return Array.from(root!.querySelectorAll<HTMLElement>("[data-fp-section]"));
      }

      function syncHash(id: string, replace: boolean) {
        const url = `${window.location.pathname}#${id}`;
        if (replace) window.history.replaceState({ fpIndex: activeIndexRef.current }, "", url);
        else window.history.pushState({ fpIndex: activeIndexRef.current }, "", url);
      }

      function animateTo(index: number, opts: { fromHistory?: boolean; enterSub?: 1 | -1 } = {}) {
        const sections = getSections();
        const clamped = Math.max(0, Math.min(sections.length - 1, index));
        const target = sections[clamped];
        if (!target) return;
        activeIndexRef.current = clamped;
        lockRef.current = true;
        const targetId = target.dataset.fpId as SectionId | undefined;

        // §10 — 프로필로 진입하는 방향에 따라 시작 탭을 정한다: 위(대표
        // 페이지)에서 내려오면 첫 탭(소개), 아래(업무 성장과정)에서
        // 올라오면 마지막 탭(업무 역량)을 표시한다.
        if (targetId && SUB_STEP_SECTIONS.includes(targetId) && opts.enterSub) {
          getSubSteps(targetId)?.enter(opts.enterSub);
        }

        const proxy = { y: window.scrollY };
        gsap.to(proxy, {
          y: target.offsetTop,
          duration: TRANSITION_DURATION,
          ease: TRANSITION_EASE,
          onUpdate: () => window.scrollTo({ top: proxy.y, left: 0, behavior: "instant" as ScrollBehavior }),
          onComplete: () => {
            window.setTimeout(() => {
              lockRef.current = false;
            }, COOLDOWN_MS);
          },
        });
        // 뒤로가기/앞으로가기로 인한 이동은 history를 다시 건드리지 않는다
        // (안 그러면 popstate ↔ pushState가 서로를 계속 트리거하는 무한 루프가 생김).
        if (!opts.fromHistory && targetId) {
          syncHash(targetId, false);
        }
      }

      // 한 번의 입력은 반드시 activeIndexRef ±1(메인 페이지) 또는 탭 ±1
      // 만큼만 이동한다. 그 이외의 어떤 계산도 하지 않는다(§6, §8-9).
      function goDelta(dir: 1 | -1) {
        if (lockRef.current) return;

        const sections = getSections();
        const currentSection = sections[activeIndexRef.current];
        const currentId = currentSection?.dataset.fpId as SectionId | undefined;

        // 현재 메인 섹션에 하위 탭이 있으면(프로필), 탭을 먼저 다 돌고
        // 나서야 다음/이전 메인 섹션으로 넘어간다(§9).
        if (currentId && SUB_STEP_SECTIONS.includes(currentId)) {
          const sub = getSubSteps(currentId);
          if (sub) {
            if (tabLockRef.current) return;
            const nextSub = sub.getActive() + dir;
            if (nextSub >= 0 && nextSub <= sub.count - 1) {
              tabLockRef.current = true;
              sub.setActive(nextSub);
              window.setTimeout(() => {
                tabLockRef.current = false;
              }, TAB_TRANSITION_MS);
              return;
            }
            // 탭의 끝(처음/마지막)에 도달했으면 다음/이전 메인 섹션으로.
          }
        }

        const next = activeIndexRef.current + dir;
        if (next < 0 || next > sections.length - 1) return;
        animateTo(next, { enterSub: dir });
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

      // 브라우저 뒤로가기/앞으로가기 시에도 현재 섹션 Index와 동기화한다(§12).
      function onPopState() {
        const id = window.location.hash.slice(1);
        const sections = getSections();
        const idx = sections.findIndex((el) => el.dataset.fpId === id);
        if (idx >= 0) animateTo(idx, { fromHistory: true });
      }

      const offGoTo = onGoToSection((id: SectionId) => {
        const sections = getSections();
        const idx = sections.findIndex((el) => el.dataset.fpId === id);
        if (idx >= 0) animateTo(idx);
      });

      // 초기 진입 위치 계산: 해시가 있으면 해당 섹션, 없으면 현재 scrollY
      // 기준으로 가장 가까운 섹션을 activeIndexRef의 시작값으로 잡는다.
      // 이후로는 이 값만 기준으로 ±1 이동하고, scrollY를 다시 역산하지 않는다.
      requestAnimationFrame(() => {
        const sections = getSections();
        const hashId = window.location.hash.slice(1);
        let initialIndex = sections.findIndex((el) => el.dataset.fpId === hashId);
        if (initialIndex < 0) {
          const y = window.scrollY;
          initialIndex = 0;
          sections.forEach((el, i) => {
            if (el.offsetTop <= y + 2) initialIndex = i;
          });
        }
        activeIndexRef.current = Math.max(0, initialIndex);
        const target = sections[activeIndexRef.current];
        if (target) {
          window.scrollTo({ top: target.offsetTop, left: 0, behavior: "instant" as ScrollBehavior });
          if (target.dataset.fpId) syncHash(target.dataset.fpId, true);
        }
      });

      window.addEventListener("wheel", onWheel, { passive: false });
      window.addEventListener("keydown", onKeyDown);
      window.addEventListener("touchstart", onTouchStart, { passive: true });
      window.addEventListener("touchmove", onTouchMove, { passive: false });
      window.addEventListener("touchend", onTouchEnd);
      window.addEventListener("popstate", onPopState);

      return () => {
        window.removeEventListener("wheel", onWheel);
        window.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("touchstart", onTouchStart);
        window.removeEventListener("touchmove", onTouchMove);
        window.removeEventListener("touchend", onTouchEnd);
        window.removeEventListener("popstate", onPopState);
        offGoTo();
      };
    });

    return () => mm.revert();
  }, []);

  return <div ref={rootRef}>{children}</div>;
}
