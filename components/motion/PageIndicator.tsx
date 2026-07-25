"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { SECTION_IDS, SECTION_LABELS, SectionId, goToSection } from "@/lib/fullpage";

// 인터랙션 수정 요청서(3차) — 우측 페이지 목록 바.
// 기본 상태는 40~48px 폭의 아주 작은 번호/점 목록이고, Hover 또는
// Focus(패널 전체 영역 기준)일 때만 210~260px로 왼쪽으로 펼쳐지며 7개
// 목차(번호|제목|점 3열 정렬)를 모두 보여준다. 패널 높이는 항목 개수만큼
// 자동으로 결정되고, 상/하단에 중복되는 "01/07" 같은 별도 페이지 번호
// 표시는 두지 않는다(각 항목 자체에 이미 번호가 있음).
// 프로필 내부 탭/업무 역량 단계가 바뀌어도 여기서 관찰하는 건 최상위
// [data-fp-id] 섹션 경계뿐이라 활성 표시는 계속 02(프로필)로 유지된다.
export function PageIndicator() {
  const pathname = usePathname();
  const [active, setActive] = useState<SectionId>("hero");
  const [mobileOpen, setMobileOpen] = useState(false);

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

  const items = SECTION_IDS.map((id, i) => (
    <button
      key={id}
      type="button"
      aria-label={`${SECTION_LABELS[id]} 페이지로 이동`}
      aria-current={i === activeIndex ? "page" : undefined}
      onClick={(e) => {
        goToSection(id);
        setMobileOpen(false);
        // 클릭한 버튼에 포커스가 남아있으면 :focus-within 때문에 커서가
        // 패널 밖으로 나가도 펼쳐진 상태가 계속 유지된다. 클릭 직후 포커스를
        // 풀어서, 이제부터는 순수하게 마우스가 패널 위에 있는지(:hover)로만
        // 펼침/숨김이 결정되게 한다. Tab 키로 이동하는 동안의 포커스는 그대로
        // 유지되므로 키보드 접근성에는 영향이 없다.
        e.currentTarget.blur();
      }}
      className="page-nav-item grid w-full items-center gap-1"
      style={{ gridTemplateColumns: "20px 1fr 8px" }}
    >
      <span
        className="page-nav-num font-en tabular-nums transition-colors duration-200"
        style={{ color: i === activeIndex ? "var(--accent)" : "var(--color-text-muted)" }}
      >
        {String(i + 1).padStart(2, "0")}
      </span>
      <span
        className="page-nav-label text-korean text-left truncate transition-colors duration-200"
        style={{
          color: i === activeIndex ? "var(--accent)" : "var(--color-text-muted)",
          fontWeight: i === activeIndex ? 600 : 400,
        }}
      >
        {SECTION_LABELS[id]}
      </span>
      <span
        className="block rounded-full justify-self-end shrink-0 transition-all duration-200"
        style={{
          width: i === activeIndex ? 7 : 5,
          height: i === activeIndex ? 7 : 5,
          backgroundColor: i === activeIndex ? "var(--accent)" : "var(--color-text-muted)",
          opacity: i === activeIndex ? 1 : 0.6,
        }}
      />
    </button>
  ));

  return (
    <>
      {/* 데스크톱: Hover/Focus로 펼쳐지는 작은 목록 바 */}
      <div className="page-nav-panel fixed z-40 right-4 md:right-6 top-1/2 -translate-y-1/2 hidden md:flex flex-col rounded-[14px]">
        {items}
      </div>

      {/* 모바일: 작은 토글 버튼 + 오버레이 메뉴 (Hover가 없으므로 터치로 열고 닫는다) */}
      <div className="md:hidden">
        <button
          type="button"
          aria-label="전체 목차 열기"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
          className="fixed z-40 right-4 bottom-4 h-9 px-3 rounded-full flex items-center gap-1.5"
          style={{ background: "rgba(22,22,22,0.9)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <span className="font-en text-xs tabular-nums" style={{ color: "var(--accent)" }}>
            {String(activeIndex + 1).padStart(2, "0")}
          </span>
          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            / {String(SECTION_IDS.length).padStart(2, "0")}
          </span>
        </button>

        {mobileOpen && (
          <>
            <button
              aria-label="목차 닫기"
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-30"
              style={{ background: "rgba(0,0,0,0.4)" }}
            />
            <div
              className="page-nav-panel--expanded fixed z-40 right-4 bottom-16 flex flex-col gap-1.5 rounded-[14px] p-3"
              style={{ background: "rgba(22,22,22,0.96)", border: "1px solid rgba(255,255,255,0.08)", width: "min(78vw, 260px)" }}
            >
              {items}
            </div>
          </>
        )}
      </div>
    </>
  );
}
