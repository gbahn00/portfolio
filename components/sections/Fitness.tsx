"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { FitnessSection } from "@/lib/types";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

export function Fitness({ data }: { data: FitnessSection }) {
  const points = [...data.points].sort((a, b) => a.order - b.order);
  const stageRef = useRef<HTMLDivElement>(null);

  const slides = useMemo(
    () => [
      ...points.map((p) => ({ label: p.title, sentence: p.body, big: false })),
      { label: "정리", sentence: data.title, big: true },
    ],
    [points, data.title]
  );

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage || prefersReducedMotion() || slides.length <= 1) return;

    const mm = gsap.matchMedia();
    mm.add("(min-width: 768px)", () => {
      const labels = gsap.utils.toArray<HTMLElement>("[data-fit-label]", stage);
      const sentences = gsap.utils.toArray<HTMLElement>("[data-fit-sentence]", stage);

      gsap.set(labels, { opacity: 0 });
      gsap.set(labels[0], { opacity: 1 });
      gsap.set(sentences, { opacity: 0, y: 40 });
      gsap.set(sentences[0], { opacity: 1, y: 0 });

      const steps = slides.length - 1;
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: stage,
          start: "top top",
          end: `+=${steps * 100}%`,
          scrub: 0.7,
          pin: true,
          anticipatePin: 1,
        },
        defaults: { ease: "none" },
      });

      for (let i = 0; i < steps; i++) {
        tl.to(labels[i], { opacity: 0, duration: 1 }, i)
          .to(labels[i + 1], { opacity: 1, duration: 1 }, i)
          .to(sentences[i], { opacity: 0, y: -40, duration: 1 }, i)
          .to(sentences[i + 1], { opacity: 1, y: 0, duration: 1 }, i);
      }

      return () => tl.kill();
    });

    return () => mm.revert();
  }, [slides]);

  return (
    <section className="bg-bg-soft">
      {/* 데스크톱: 화면 고정 문장 전환 */}
      <div ref={stageRef} className="hidden md:flex relative h-screen overflow-hidden items-center">
        <Container>
          <p className="accent-text text-sm font-medium mb-8 tracking-wide">특별진급 적합성</p>
          <div className="relative h-10 mb-6">
            {slides.map((s, i) => (
              <span key={i} data-fit-label className="absolute left-0 accent-text text-sm font-medium">
                {s.label}
              </span>
            ))}
          </div>
          <div className="relative h-64 flex items-center">
            {slides.map((s, i) => (
              <p
                key={i}
                data-fit-sentence
                className={`absolute left-0 text-korean font-bold leading-snug max-w-4xl ${
                  s.big ? "text-4xl md:text-6xl" : "text-3xl md:text-5xl"
                }`}
              >
                {s.sentence}
              </p>
            ))}
          </div>
        </Container>
      </div>

      {/* 모바일: 순차 등장 */}
      <Container className="md:hidden section-pad">
        <p className="accent-text text-sm font-medium mb-8 tracking-wide">특별진급 적합성</p>
        <div className="space-y-10">
          {slides.map((s, i) => (
            <Reveal key={i} delay={(i % 5) * 0.03}>
              <p className="accent-text text-xs font-medium mb-2">{s.label}</p>
              <p className={`text-korean font-bold leading-snug ${s.big ? "text-3xl" : "text-2xl"}`}>{s.sentence}</p>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
