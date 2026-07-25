"use client";

import { FuturePlan } from "@/lib/types";
import { Container } from "@/components/ui/Container";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";

// §13.3 Chapter 공통 구성: 상단 PROMOTION PLAN/번호 → 중앙 대형 제목 →
// 하단 WHY(왜 필요한가) / ACTION(무엇을 할 것인가) / IMPACT(기대 효과)
function PlanBlock({ plan, index, total }: { plan: FuturePlan; index: number; total: number }) {
  const details = [...plan.details].sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-[80svh] md:min-h-[90svh] flex flex-col justify-center border-t border-line py-16 md:py-0">
      <Reveal holdAfterEnter>
        <p className="font-en text-xs text-ink-muted tracking-wide mb-6">
          PROMOTION PLAN / {String(index + 1).padStart(2, "0")} · {String(total).padStart(2, "0")}
        </p>
      </Reveal>
      <Reveal delay={0.05} strength="strong" holdAfterEnter>
        <span className="accent-text font-en project-title font-bold block mb-2" style={{ opacity: 0.4 }}>
          {String(index + 1).padStart(2, "0")}
        </span>
      </Reveal>
      <Reveal delay={0.1} strength="strong" holdAfterEnter>
        <h3 className="hero-title font-bold mb-14 text-korean max-w-4xl">{plan.title}</h3>
      </Reveal>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
        <div>
          <Reveal delay={0.05}>
            <p className="accent-text font-en text-xs tracking-wide mb-3">WHY</p>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="body-large text-ink-secondary text-korean">{plan.summary}</p>
          </Reveal>
        </div>

        <div>
          <Reveal delay={0.1}>
            <p className="accent-text font-en text-xs tracking-wide mb-3">ACTION</p>
          </Reveal>
          <RevealGroup className="space-y-2">
            {details.map((d) => (
              <RevealItem key={d.id}>
                <div className="flex gap-3 text-sm md:text-base text-ink/85 text-korean">
                  <span className="accent-text">·</span>
                  {d.text}
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>

        <div>
          {plan.expectedEffect && (
            <>
              <Reveal delay={0.12}>
                <p className="accent-text font-en text-xs tracking-wide mb-3">IMPACT</p>
              </Reveal>
              <Reveal delay={0.15}>
                <p className="text-sm md:text-base text-ink-muted leading-relaxed text-korean">{plan.expectedEffect}</p>
              </Reveal>
            </>
          )}
          <Reveal delay={0.18}>
            <span className="inline-block mt-6 text-xs rounded-full border border-line px-3 py-1 text-ink-muted">
              {plan.progress}
            </span>
          </Reveal>
        </div>
      </div>
    </div>
  );
}

export function FuturePlans({ items }: { items: FuturePlan[] }) {
  const visible = [...items].filter((i) => i.visible !== false).sort((a, b) => a.order - b.order);

  return (
    <section id="plan" className="section-pad bg-bg">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-10 md:gap-16 items-end mb-16 md:mb-20">
          <div>
            <Reveal>
              <p className="accent-text text-sm font-medium mb-4 tracking-wide">특별진급 이후 실행 계획</p>
            </Reveal>
            <Reveal delay={0.05} strength="strong" holdAfterEnter>
              <h2 className="section-title font-bold mb-6 text-korean">다음 역할을 위한 준비</h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="body-large text-ink-secondary text-korean max-w-lg">
                현재 제작 업무에서 협업 체계와 데이터 기반 개선까지 담당 범위를 넓히고자 합니다.
              </p>
            </Reveal>
          </div>
          <Reveal delay={0.1}>
            <ol className="space-y-2">
              {visible.map((p, i) => (
                <li key={p.id} className="flex gap-3 text-sm md:text-base text-ink-secondary text-korean">
                  <span className="accent-text font-en">{String(i + 1).padStart(2, "0")}</span>
                  {p.title}
                </li>
              ))}
            </ol>
          </Reveal>
        </div>

        <div>
          {visible.map((plan, i) => (
            <PlanBlock key={plan.id} plan={plan} index={i} total={visible.length} />
          ))}
        </div>
      </Container>
    </section>
  );
}
