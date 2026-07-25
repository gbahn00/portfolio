"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";

// NAV_ITEMS의 id는 각 섹션의 실제 id 속성과 일치해야 한다.
// href는 항상 "/#id" 절대경로를 사용한다 — 상대 "#id"만 쓰면 프로젝트 상세
// 페이지(/projects/[id])처럼 홈이 아닌 곳에서 클릭했을 때 현재 페이지 안에서
// 존재하지 않는 앵커를 찾다가 아무 동작도 하지 않는 문제가 있었다.
const NAV_ITEMS = [
  { id: "about", label: "About" },
  { id: "journey", label: "Journey" },
  { id: "selected-works", label: "Works" },
  { id: "skills", label: "Skills" },
  { id: "plan", label: "Plan" },
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
  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;
    const wrap = wrapRef.current;
    if (!wrap) return;
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        start: 80,
        end: 99999,
        onUpdate: (self) => {
          const hide = self.direction === 1 && self.scroll() > 120;
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

  // 현재 보이는 섹션에 맞춰 활성 메뉴를 강조 (§9.2 활성 메뉴 강조색)
  useEffect(() => {
    // 프로젝트 상세 페이지 등 홈이 아닌 곳에서는 대응하는 섹션이 없으므로
    // 활성 메뉴 강조 로직 자체를 건너뛴다 (에러 방지 + 불필요한 관찰 방지).
    if (typeof document === "undefined" || !document.getElementById("about")) return;
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

  return (
    <div ref={wrapRef} className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
      <div className="page-container flex items-center justify-between py-6 md:py-8 min-h-[72px] pointer-events-auto">
        <span ref={logoRef} className="text-sm md:text-base font-semibold text-korean">
          {name || "Portfolio"}
        </span>
        <nav ref={menuRef} className="flex items-center gap-5 md:gap-8">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.id}
              data-nav-item
              href={`/#${item.id}`}
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
