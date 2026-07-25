"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";
import { goToSection, SectionId } from "@/lib/fullpage";

// 전체 구조 개편 명세서 §7 — 6개 섹션 고정 구조에 맞춰 nav 항목을 갱신했다.
// id는 app/page.tsx의 data-fp-id 및 각 섹션 <section id="..."> 값과 일치한다.
// href는 항상 "/#id" 절대경로를 사용한다 — 상대 "#id"만 쓰면 프로젝트 상세
// 페이지(/projects/[id])처럼 홈이 아닌 곳에서 클릭했을 때 현재 페이지 안에서
// 존재하지 않는 앵커를 찾다가 아무 동작도 하지 않는 문제가 있었다.
// 홈에서 클릭하면 Full Page Scroll 컨트롤러가 해당 섹션까지 부드럽게
// 이동시키고(goToSection), 홈이 아닌 곳에서는 href의 "/#id" 이동으로
// 자연스럽게 대체된다.
const NAV_ITEMS: { id: SectionId; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "growth", label: "Growth" },
  { id: "projects", label: "Works" },
  { id: "future", label: "Plan" },
];

export function Header({ name }: { name: string }) {
  const logoRef = useRef<HTMLSpanElement>(null);
  const menuRef = useRef<HTMLElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string>("");

  // 진입 모션: 로고 Fade In → 메뉴 Fade In (§9.3)
  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const items = menuRef.current?.querySelectorAll<HTMLElement>("[data-nav-item]") ?? [];
      gsap.set([logoRef.current, ...Array.from(items)], { autoAlpha: 0, y: -8 });
      gsap
        .timeline({ delay: 0.3, defaults: { ease: "power3.out" } })
        .to(logoRef.current, { autoAlpha: 1, y: 0, duration: 0.6 })
        .to(items, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.08 }, "-=0.3");
    }, wrapRef);
    return () => ctx.revert();
  }, []);

  // 아래로 스크롤하면 약하게 숨기고, 위로 스크롤하면 다시 표시한다 (§16)
  //
  // 이전에는 스크롤이 일어날 때마다(초당 수십 번) onUpdate가 호출될 때마다
  // 매번 새 gsap.to() 트윈을 생성했다. overwrite:"auto"로 이전 트윈을
  // 정리하긴 했지만, hide 상태가 바뀌지 않았는데도 계속 트윈을 새로 만드는
  // 건 불필요한 작업이며, 다른 섹션(예: 약력 가로 스크롤)의 pin+scrub와
  // 동시에 실행되면서 전체적인 스크롤 렉의 한 원인이 된다. hide 상태가
  // 실제로 바뀔 때만 트윈을 실행하도록 이전 상태를 기억해 비교한다.
  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;
    const wrap = wrapRef.current;
    if (!wrap) return;
    let lastHide: boolean | null = null;
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        start: 80,
        end: 99999,
        onUpdate: (self) => {
          const hide = self.direction === 1 && self.scroll() > 120;
          if (hide === lastHide) return;
          lastHide = hide;
          gsap.to(wrap, {
            yPercent: hide ? -100 : 0,
            duration: 0.35,
            overwrite: "auto",
            ease: "power2.out",
          });
        },
      });
    });
    return () => ctx.revert();
  }, []);

  const pathname = usePathname();

  // 현재 보이는 섹션에 맞춰 활성 메뉴를 강조 (§9.2 활성 메뉴 강조색)
  useEffect(() => {
    // 프로젝트 상세 페이지 등 홈이 아닌 곳에서는 대응하는 섹션이 없으므로
    // 활성 메뉴 강조 로직 자체를 건너뛴다 (에러 방지 + 불필요한 관찰 방지).
    if (typeof document === "undefined" || !document.getElementById("profile")) return;
    const sections = NAV_ITEMS.map((item) => document.getElementById(item.id)).filter(Boolean) as HTMLElement[];
    if (sections.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  // 이전에는 이 안쪽 바 전체(로고~메뉴 사이 빈 공간 포함)가
  // pointer-events-auto였다. Header는 fixed + z-50이라 항상 최상단에 있고,
  // "page-container" 폭 전체를 덮기 때문에, 프로젝트 상세 페이지처럼 화면
  // 맨 위쪽에 다른 클릭 요소(예: "← 목록으로" 링크)가 있는 페이지에서는
  // 그 빈 공간이 클릭을 가로채 버튼이 눌리지 않는 문제가 있었다. 실제로
  // 클릭이 필요한 건 nav 링크뿐이므로, pointer-events-auto를 nav에만 주고
  // 나머지 영역(로고 포함)은 클릭이 그대로 통과하도록 한다.
  return (
    <div ref={wrapRef} className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
      <div className="page-container flex items-center justify-between py-6 md:py-8 min-h-[72px]">
        <span ref={logoRef} className="text-sm md:text-base font-semibold text-korean pointer-events-none">
          {name || "Portfolio"}
        </span>
        <nav ref={menuRef} className="flex items-center gap-5 md:gap-8 pointer-events-auto">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.id}
              data-nav-item
              href={`/#${item.id}`}
              onClick={(e) => {
                if (pathname === "/") {
                  e.preventDefault();
                  goToSection(item.id);
                }
              }}
              className="text-xs md:text-sm font-medium transition-colors duration-300"
              style={{ color: active === item.id ? "var(--accent)" : "var(--color-text-secondary)" }}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
}
