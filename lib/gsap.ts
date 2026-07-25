"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// ============================================================================
// GSAP + ScrollTrigger 공통 설정
// 이 프로젝트의 모든 스크롤 모션은 이 파일에서 등록한 gsap 인스턴스를 사용합니다.
// 브라우저에서 한 번만 플러그인을 등록하도록 모듈 최상단에서 처리합니다.
// ============================================================================

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/** 사용자가 OS에서 "동작 줄이기"를 켜 두었는지 확인합니다. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * 아래 방향/위 방향 모두 자연스럽게 재생되는 기본 toggleActions.
 * onEnter: 정방향 재생 / onLeave: 완료 상태 유지
 * onEnterBack: 역방향 위치에서 재진입 / onLeaveBack: 초기 상태 복구
 */
export const BIDIRECTIONAL_TOGGLE = "play reverse play reverse";

/** 스크롤 연동(scrub) 모션의 표준 반응 속도. 0.3~1.0 권장, 기본 0.6. */
export const STANDARD_SCRUB = 0.6;

/**
 * 용도별 scrub 값 (특별진급 포트폴리오 최종 수정 명세서 §20.4 기준)
 * 일반 Reveal: 0.3~0.5 / Pin Section: 0.5~0.8 / Horizontal Scroll: 0.6~1.0
 */
export const SCRUB = {
  reveal: 0.4,
  pin: 0.6,
  horizontal: 0.8,
} as const;

/** 빠르게 스크롤해도 중간 상태가 남지 않도록 하는 공통 옵션. */
export const FAST_SCROLL_SAFE = {
  fastScrollEnd: true,
  preventOverlaps: true,
};

/** 일반 Reveal용 기본 ScrollTrigger 옵션 (§20.3) */
export function revealTriggerConfig(trigger: gsap.DOMTarget) {
  return {
    trigger,
    start: "top 80%",
    end: "top 50%",
    scrub: SCRUB.reveal,
    ...FAST_SCROLL_SAFE,
  };
}

/** Pin 섹션용 기본 ScrollTrigger 옵션 (§20.2) */
export function pinTriggerConfig(trigger: gsap.DOMTarget, distance = 1800) {
  return {
    trigger,
    start: "top top",
    end: `+=${distance}`,
    pin: true,
    scrub: SCRUB.pin,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    ...FAST_SCROLL_SAFE,
  };
}

/** 텍스트 등장/퇴장 공통 좌표값 (§19.2) */
export const TEXT_MOTION = {
  enterFrom: { yPercent: 110, autoAlpha: 0 },
  enterTo: { yPercent: 0, autoAlpha: 1, ease: "power3.out" },
  exitTo: { yPercent: -100, autoAlpha: 0, ease: "power2.in", overwrite: "auto" as const },
};

/** 이미지 Clip-path Reveal 공통 값 (§19.2) */
export const IMAGE_REVEAL = {
  from: { clipPath: "inset(100% 0% 0% 0%)", scale: 1.08 },
  to: { clipPath: "inset(0% 0% 0% 0%)", scale: 1, ease: "power3.out" },
};

/** 콘텐츠(이미지·폰트·관리자 데이터)가 바뀐 뒤 위치를 다시 계산합니다. */
export function refreshScrollTrigger() {
  if (typeof window === "undefined") return;
  requestAnimationFrame(() => ScrollTrigger.refresh());
}

export { gsap, ScrollTrigger };
