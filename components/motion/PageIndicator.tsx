"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { SECTION_IDS, SectionId, goToSection } from "@/lib/fullpage";

// 전체 구조 개편 명세서 §4 — 고정 페이지 번호 인디케이터 ("01/06").
// 현재 섹션을 강조하고 클릭하면 해당 섹션으로 이동한다.
// 프로젝트 상세 페이지에는 6개 섹션 구조가 없으므로 숨긴다.
export function PageIndicator() {
  const pathname = usePathname();
  const [active, setActive] = useState<SectionId>("hero");

  useEffect(() => {
    if (pathname !== "/") return;
    const sections = SECTION_IDS.map((id) => document.querySelector<HTMLElement>(`[data-fp-id="${id}"]`)).filter(
      (el): el is HTMLElement => Boolean(el)
    );
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute("data-fp-id") as SectionId | null;
            if (id) setActive(id);
          }
        });
      },
      { rootMargin: "-48% 0px -48% 0px" }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [pathname]);

  if (pathname !== "/") return null;

  const activeIndex = SECTION_IDS.indexOf(active);

  return (
    <div className="fixed z-40 right-4 md:right-6 top-1/2 -translate-y-1/2 hidden md:flex flex-col items-center gap-3">
      <span className="font-en text-xs text-ink-secondary tabular-nums">{String(activeIndex + 1).padStart(2, "0")}</span>
      <div className="flex flex-col gap-2.5">
        {SECTION_IDS.map((id, i) => (
          <button
            key={id}
            type="button"
            aria-label={`섹션 ${i + 1}로 이동`}
            onClick={() => goToSection(id)}
            className="group relative flex items-center justify-center h-4 w-4"
          >
            <span
              className="block rounded-full transition-all duration-300"
              style={{
                width: i === activeIndex ? 6 : 4,
                height: i === activeIndex ? 6 : 4,
                backgroundColor: i === activeIndex ? "var(--accent)" : "var(--color-text-muted)",
                opacity: i === activeIndex ? 1 : 0.5,
              }}
            />
          </button>
        ))}
      </div>
      <span className="font-en text-xs text-ink-muted tabular-nums">{String(SECTION_IDS.length).padStart(2, "0")}</span>
    </div>
  );
}
