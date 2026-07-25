// ============================================================================
// Full Page Scroll 공유 유틸 (전체 구조 개편 명세서 §1 — "가장 중요")
//
// 방식: 각 최상단 섹션을 실제 문서 흐름(position 그대로)에 두고, 휠/터치
// 입력을 가로채 "다음/이전 섹션의 실제 위치"까지 GSAP로 부드럽게 window
// 스크롤을 이동시킨다. 진짜 scrollY가 움직이므로 각 섹션 안에 이미 만들어둔
// GSAP ScrollTrigger 기반 pin/scrub/Reveal 애니메이션이 그대로 재생된다
// (position:fixed + transform으로 화면을 통째로 넘기는 방식은 scrollY 자체가
// 멈춰 있어서 기존 ScrollTrigger 애니메이션이 전부 재생되지 않는 문제가 있어
// 선택하지 않았다).
//
// Header의 nav 클릭, 페이지 인디케이터 클릭 등 다른 컴포넌트에서도 동일한
// 섹션 이동 로직을 쓸 수 있도록 커스텀 이벤트로 노출한다.
// ============================================================================

export const SECTION_IDS = ["hero", "profile", "growth", "projects", "future", "closing"] as const;
export type SectionId = (typeof SECTION_IDS)[number];

export const SECTION_LABELS: Record<SectionId, string> = {
  hero: "대표 페이지",
  profile: "프로필",
  growth: "업무 성장과정",
  projects: "대표 프로젝트",
  future: "향후 추진 계획",
  closing: "마지막 페이지",
};

const GOTO_EVENT = "fullpage:goto";

export function goToSection(id: SectionId) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(GOTO_EVENT, { detail: id }));
}

export function onGoToSection(handler: (id: SectionId) => void) {
  if (typeof window === "undefined") return () => {};
  const listener = (e: Event) => handler((e as CustomEvent<SectionId>).detail);
  window.addEventListener(GOTO_EVENT, listener);
  return () => window.removeEventListener(GOTO_EVENT, listener);
}

// ============================================================================
// 인터랙션 수정 요청서 §6-11 — 프로필(02) 섹션 내부의 탭(소개/핵심 수치/
// 업무 역량)은 메인 페이지 전환(700ms)과는 별개로, 세로 스크롤 한 번에
// 탭 하나씩 전환되어야 한다. 탭 상태는 ProfileSection이 직접 소유하고
// (React state), FullPageScroll은 이 registry를 통해 "지금 몇 번째 탭인지
// 읽고 / 다음 탭으로 바꿔 달라고 요청"만 한다 — 상태를 이중으로 들고
// 있지 않아야 두 값이 어긋나는 버그를 피할 수 있다.
// ============================================================================
export interface SubStepController {
  count: number;
  getActive: () => number;
  /** dir: 1이면 다음 탭 진입(보통 위→아래 스크롤), -1이면 마지막 탭 진입(아래→위 스크롤) */
  enter: (dir: 1 | -1) => void;
  setActive: (index: number) => void;
}

const subStepRegistry = new Map<SectionId, SubStepController>();

export function registerSubSteps(id: SectionId, controller: SubStepController) {
  subStepRegistry.set(id, controller);
  return () => {
    if (subStepRegistry.get(id) === controller) subStepRegistry.delete(id);
  };
}

export function getSubSteps(id: SectionId): SubStepController | undefined {
  return subStepRegistry.get(id);
}
