"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { SECTION_IDS, SECTION_LABELS, SectionId, goToSection } from "@/lib/fullpage";

// 전체 구조 개편 명세서 §4, 인터랙션 수정 요청서(2차) §24-33 — 고정 페이지
// 번호 인디케이터("01/06"). 기본 상태에서는 번호/점만 간결하게 표시하고,
// 목록 바 "전체 영역"에 마우스를 올리거나 포커스가 들어오면(개별 점 단위가
// 아니라) 6개 목차 전체가 한 번에 왼쪽으로 펼쳐진다.
// 현재 섹션을 강조하고 클릭하면 해당 섹션으로 이동한다. 프로젝트 상세
// 페이지에는 6개 섹션 구조가 없으므로 숨긴다. 프로필 내부 탭/업무 역량
// 단계가 바뀌어도 여기서 관찰하는 건 최상위 [data-fp-id] 섹션 경계뿐이라
// 활성 표시는 계속 02(프로필)로 유지된다 — 별도 처리가 필요 없다.
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
    <div className="fixed z-40 right-0 top-1/2 -translate-y-1/2 hidden md:block">
      <div className="page-nav-panel flex flex-col items-end gap-3 py-4 pl-4 pr-4 rounded-l-md">
        <span className="font-en text-xs text-ink-secondary tabular-nums pr-1">{String(activeIndex + 1).padStart(2, "0")}</span>
        <div className="flex flex-col gap-2.5 w-full">
          {SECTION_IDS.map((id, i) => (
            <button
              key={id}
              type="button"
              aria-label={`${SECTION_LABELS[id]} 페이지로 이동`}
              aria-current={i === activeIndex ? "true" : undefined}
              onClick={() => goToSection(id)}
              className="flex items-center justify-end gap-2 w-full"
            >
              <span
                className="page-nav-label text-xs whitespace-nowrap text-korean"
                style={{ color: i === activeIndex ? "var(--accent)" : "var(--color-text-secondary)" }}
              >
                {String(i + 1).padStart(2, "0")}. {SECTION_LABELS[id]}
              </span>
              <span
                className="block rounded-full shrink-0 transition-all duration-300"
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
        <span className="font-en text-xs text-ink-muted tabular-nums pr-1">{String(SECTION_IDS.length).padStart(2, "0")}</span>
      </div>
    </div>
  );
}
