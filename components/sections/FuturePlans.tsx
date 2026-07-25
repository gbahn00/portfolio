"use client";

import { FuturePlan } from "@/lib/types";
import { Container } from "@/components/ui/Container";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";

// ============================================================================
// 전체 구조 개편 명세서 §5 — "05.향후 추진 계획"
// 예전에는 계획 항목마다 화면 하나씩(min-h-[90svh]) 차지하는 긴 스토리
// 형태였다. 이제는 한 화면 안에 NOW / NEXT / FUTURE 3장의 카드로 축소했다.
// 항목이 3개보다 많으면 순서(order) 기준 상위 3개만 카드로 보여준다.
// ============================================================================

const STAGE_LABELS = ["NOW", "NEXT", "FUTURE"];

export function FuturePlans({ items }: { items: FuturePlan[] }) {
  const visible = [...items].filter((i) => i.visible !== false).sort((a, b) => a.order - b.order).slice(0, 3);

  return (
    <section id="future" className="fp-section bg-bg py-6 md:py-8">
      <Container className="w-full">
        <Reveal>
          <p className="accent-text text-sm font-medium mb-3 tracking-wide">특별진급 이후 실행 계획</p>
        </Reveal>
        <Reveal delay={0.05} strength="strong" holdAfterEnter>
          <h2 className="section-title font-bold mb-4 text-korean">다음 역할을 위한 준비</h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="body-large text-ink-secondary mb-8 md:mb-10 max-w-lg text-korean">
            현재 제작 업무에서 협업 체계와 데이터 기반 개선까지 담당 범위를 넓히고자 합니다.
          </p>
        </Reveal>

        {visible.length > 0 ? (
          <RevealGroup className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6" stagger={0.12}>
            {visible.map((plan, i) => (
              <RevealItem key={plan.id}>
                <div className="h-full rounded-sm border border-line p-5 md:p-6 flex flex-col">
                  <p className="font-en text-xs tracking-wide accent-text mb-2">{STAGE_LABELS[i] || `STAGE ${i + 1}`}</p>
                  <h3 className="text-xl md:text-2xl font-bold mb-3 text-korean">{plan.title}</h3>
                  <p className="body text-ink-secondary text-korean mb-4 flex-1">{plan.summary}</p>
                  {plan.details.length > 0 && (
                    <ul className="space-y-1 mb-4">
                      {[...plan.details].sort((a, b) => a.order - b.order).slice(0, 3).map((d) => (
                        <li key={d.id} className="flex gap-2 text-xs md:text-sm text-ink/80 text-korean">
                          <span className="accent-text">·</span>
                          {d.text}
                        </li>
                      ))}
                    </ul>
                  )}
                  <span className="inline-block self-start text-xs rounded-full border border-line px-3 py-1 text-ink-muted">
                    {plan.progress}
                  </span>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        ) : (
          <p className="text-ink-muted text-sm">등록된 추진 계획이 아직 없습니다.</p>
        )}
      </Container>
    </section>
  );
}
