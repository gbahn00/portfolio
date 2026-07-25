"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { TimelineEntry } from "@/lib/types";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { MediaFrame } from "@/components/ui/MediaFrame";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { registerSubSteps } from "@/lib/fullpage";

// ============================================================================
// 전체 구조 개편 명세서 §3 — "03.업무 성장과정"
// 기존에는 연도별 패널을 세로 스크롤에 맞춰 가로로 파닝(pin+horizontal
// scrub)하는 방식이었다. 이 방식은 화면 여러 개 분량의 스크롤이 필요해서
// Full Page Scroll(스크롤 1회 = 섹션 1개)과 함께 쓸 수 없어서, 연도 탭을
// 클릭해 전환하는 방식으로 다시 만들었다.
//
// §25 — "탭은 클릭보다 스크롤로 넘어가는 방식으로" 요청에 따라, 프로필과
// 동일한 패턴으로 연도 탭도 registerSubSteps에 등록했다. 스크롤 한 번에
// 연도가 ±1씩 넘어가고, 마지막/처음 연도에서 한 번 더 스크롤하면 다음/이전
// 메인 섹션(대표 프로젝트/프로필)으로 넘어간다. 클릭 이동도 그대로 유지한다.
// ============================================================================

function YearContent({ entry }: { entry: TimelineEntry }) {
  const experiences = [...entry.experiences].sort((a, b) => a.order - b.order);
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    gsap.fromTo(el, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out", overwrite: "auto" });
  }, [entry.id]);

  return (
    <div ref={ref} className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
      <div>
        <h3 className="statement-title font-bold mb-3 text-korean">{entry.title}</h3>
        <p className="body text-ink-secondary mb-4 max-w-md">{entry.description}</p>
        <p className="body-large font-medium border-l-2 accent-border pl-4 text-korean mb-4">{entry.message}</p>
        {experiences.length > 0 && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 font-en caption">
            {experiences.slice(0, 3).map((t) => (
              <span key={t.id}>#{t.text.replace(/\s/g, "")}</span>
            ))}
          </div>
        )}
      </div>
      <div className="relative aspect-[4/3] w-full max-h-[45dvh] overflow-hidden rounded-sm">
        <MediaFrame media={entry.heroImage} className="h-full w-full" />
      </div>
    </div>
  );
}

export function Timeline({ entries }: { entries: TimelineEntry[] }) {
  const sorted = [...entries].sort((a, b) => a.order - b.order);
  const [active, setActive] = useState(0);
  const activeRef = useRef(active);
  const current = sorted[Math.min(active, Math.max(sorted.length - 1, 0))];

  useLayoutEffect(() => {
    activeRef.current = active;
  }, [active]);

  useLayoutEffect(() => {
    const count = sorted.length;
    if (count === 0) return;
    const unregister = registerSubSteps("growth", {
      count,
      getActive: () => activeRef.current,
      // 위(프로필)에서 내려오면 첫 연도, 아래(대표 프로젝트)에서 올라오면
      // 마지막 연도부터 보여준다 — 프로필의 진입 방향 규칙과 동일하다.
      enter: (dir) => setActive(dir === 1 ? 0 : count - 1),
      setActive: (index) => setActive(Math.max(0, Math.min(count - 1, index))),
    });
    return unregister;
  }, [sorted.length]);

  return (
    <section id="growth" className="fp-section bg-bg py-6 md:py-8">
      <Container className="w-full">
        <Reveal>
          <p className="accent-text text-sm font-medium mb-3 tracking-wide">업무 성장과정</p>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="section-title font-bold mb-6 md:mb-8 text-korean">
            입사 이후, 역할은 이렇게 확장되었습니다.
          </h2>
        </Reveal>

        {sorted.length > 0 && (
          <>
            <div className="flex flex-wrap gap-2 mb-6 md:mb-8 border-b border-line pb-4">
              {sorted.map((entry, i) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setActive(i)}
                  className="font-en text-sm md:text-base font-medium px-1 pb-2 border-b-2 transition-colors duration-300"
                  style={{
                    borderColor: active === i ? "var(--accent)" : "transparent",
                    color: active === i ? "var(--color-text-primary)" : "var(--color-text-muted)",
                  }}
                >
                  {entry.year}
                </button>
              ))}
            </div>
            {current && <YearContent entry={current} />}
          </>
        )}

        {sorted.length === 0 && <p className="text-ink-muted text-sm">등록된 성장 과정이 아직 없습니다.</p>}
      </Container>
    </section>
  );
}
