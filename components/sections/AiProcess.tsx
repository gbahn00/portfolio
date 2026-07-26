"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { AiSection } from "@/lib/types";
import { Container } from "@/components/ui/Container";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

const STAGE_LABELS = ["입력", "생성", "최종 결과"];

export function AiProcess({ data }: { data: AiSection }) {
  const steps = [...data.processSteps].sort((a, b) => a.order - b.order);
  const tools = [...(data.tools || [])].filter((t) => t.visible !== false).sort((a, b) => a.order - b.order);

  const stageRef = useRef<HTMLDivElement>(null);

  // 10단계를 입력 / 생성 / 최종 결과 3단계로 묶습니다.
  const stages = useMemo(() => {
    const third = Math.ceil(steps.length / 3);
    return [steps.slice(0, third), steps.slice(third, third * 2), steps.slice(third * 2)];
  }, [steps]);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage || prefersReducedMotion()) return;

    const mm = gsap.matchMedia();
    mm.add("(min-width: 768px)", () => {
      const numberEls = gsap.utils.toArray<HTMLElement>("[data-stage-number]", stage);
      const bodyEls = gsap.utils.toArray<HTMLElement>("[data-stage-body]", stage);
      const stepCount = stages.length;
      if (stepCount <= 1) return;

      gsap.set(numberEls, { opacity: 0.25, scale: 0.9 });
      gsap.set(numberEls[0], { opacity: 1, scale: 1 });
      gsap.set(bodyEls, { opacity: 0, y: 24 });
      gsap.set(bodyEls[0], { opacity: 1, y: 0 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: stage,
          start: "top top",
          end: `+=${(stepCount - 1) * 100}%`,
          scrub: 0.6,
          pin: true,
          anticipatePin: 1,
        },
        defaults: { ease: "none" },
      });

      for (let i = 0; i < stepCount - 1; i++) {
        tl.to(numberEls[i], { opacity: 0.25, scale: 0.9, duration: 1 }, i)
          .to(numberEls[i + 1], { opacity: 1, scale: 1, duration: 1 }, i)
          .to(bodyEls[i], { opacity: 0, y: -24, duration: 1 }, i)
          .to(bodyEls[i + 1], { opacity: 1, y: 0, duration: 1 }, i);
      }

      return () => tl.kill();
    });

    return () => mm.revert();
  }, [stages]);

  return (
    <section className="bg-bg">
      <Container className="pt-24 md:pt-32 pb-12 md:pb-16">
        <p className="accent-text text-sm font-medium mb-4 tracking-wide">생성형 인공지능 활용 과정</p>
        <h2 className="text-3xl md:text-5xl font-bold text-korean">{data.title}</h2>
      </Container>

      {/* 데스크톱: 입력 → 생성 → 최종 결과 3단계 고정 전환 */}
      <div ref={stageRef} className="hidden md:block relative h-screen overflow-hidden">
        <Container className="h-full flex items-center">
          <div className="grid grid-cols-[1fr_2fr] gap-16 w-full items-center">
            <div className="relative h-32">
              {STAGE_LABELS.map((label, i) => (
                <div key={label} data-stage-number className="absolute inset-0 flex flex-col justify-center">
                  <span className="font-en text-sm text-ink-muted mb-2">STAGE {String(i + 1).padStart(2, "0")}</span>
                  <span className="text-4xl md:text-5xl font-bold accent-text">{label}</span>
                </div>
              ))}
            </div>
            <div className="relative h-64">
              {stages.map((group, i) => (
                <div key={i} data-stage-body className="absolute inset-0 flex flex-col justify-center gap-3">
                  {group.map((s, idx) => (
                    <p key={s.id} className="text-lg md:text-2xl text-ink/90 text-korean">
                      <span className="text-ink-muted font-en mr-3">{String(idx + 1).padStart(2, "0")}</span>
                      {s.title}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </Container>
      </div>

      {/* 모바일: 단계별 순차 등장 */}
      <Container className="md:hidden pb-16">
        {stages.map((group, i) => (
          <Reveal key={i} delay={i * 0.05} className="mb-10">
            <span className="accent-text text-2xl font-bold block mb-3">{STAGE_LABELS[i]}</span>
            <div className="space-y-2">
              {group.map((s, idx) => (
                <p key={s.id} className="text-base text-ink/90 text-korean">
                  <span className="text-ink-muted font-en mr-2">{String(idx + 1).padStart(2, "0")}</span>
                  {s.title}
                </p>
              ))}
            </div>
          </Reveal>
        ))}
      </Container>

      <Container className="pb-24 md:pb-32">
        <Reveal>
          <p className="text-sm text-ink-muted mb-6 tracking-wide">사용 도구</p>
        </Reveal>
        <RevealGroup className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {tools.map((t) => (
            <RevealItem key={t.id}>
              <div className="border border-white/10 rounded-sm p-5 text-center hover:border-white/25 transition-colors h-full">
                <p className="font-en font-semibold text-lg mb-1">{t.name}</p>
                <p className="text-xs text-ink-muted leading-relaxed text-korean whitespace-pre-line">{t.purpose}</p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </section>
  );
}
