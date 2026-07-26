"use client";

import { useLayoutEffect, useRef } from "react";
import { ContributionSection } from "@/lib/types";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { MaskLines } from "@/components/motion/MaskLines";
import { gsap, prefersReducedMotion, ENTER_ONLY_TOGGLE } from "@/lib/gsap";

export function Contributions({ data }: { data: ContributionSection }) {
  const items = [...data.items].filter((i) => i.visible !== false).sort((a, b) => a.order - b.order);
  const wrapRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      // 배경은 고정된 상태에서 천천히 확대된다
      gsap.to(bgRef.current, {
        scale: 1.18,
        ease: "none",
        scrollTrigger: { trigger: wrap, start: "top bottom", end: "bottom top", scrub: 0.8 },
      });

      // 핵심 문구는 줄 단위로 나타난다
      const lines = titleRef.current?.querySelectorAll<HTMLElement>("[data-mask-line]") ?? [];
      gsap.set(lines, { yPercent: 110, autoAlpha: 0 });
      gsap.to(lines, {
        yPercent: 0,
        autoAlpha: 1,
        duration: 0.9,
        stagger: 0.1,
        ease: "power3.out",
        overwrite: "auto",
        scrollTrigger: { trigger: titleRef.current, start: "top 82%", end: "top 40%", toggleActions: ENTER_ONLY_TOGGLE },
      });

      // 관리 항목은 좌우에서 들어온다
      if (gridRef.current) {
        const cards = Array.from(gridRef.current.children) as HTMLElement[];
        cards.forEach((el, i) => {
          gsap.fromTo(
            el,
            { autoAlpha: 0, x: i % 2 === 0 ? -32 : 32 },
            {
              autoAlpha: 1, x: 0, duration: 0.7, ease: "power3.out", overwrite: "auto",
              scrollTrigger: { trigger: el, start: "top 90%", end: "top 50%", toggleActions: ENTER_ONLY_TOGGLE },
            }
          );
        });
      }
    }, wrap);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={wrapRef} className="relative bg-bg overflow-hidden">
      <div ref={bgRef} className="absolute inset-0 scale-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/placeholders/notion.svg" alt="노션 인공지능 크레딧 관리 화면 [자료 필요]" className="h-full w-full object-cover opacity-60" style={{ filter: "brightness(0.9)" }} />
        <div className="absolute inset-0 bg-bg/45" />
      </div>

      <Container className="relative z-10 section-pad">
        <p className="accent-text text-sm font-medium mb-4 tracking-wide">팀과 조직에 대한 기여</p>
        <div ref={titleRef} className="mb-16 max-w-3xl">
          <MaskLines text={data.title} className="text-3xl md:text-5xl font-bold" />
        </div>

        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
          {items.map((item) => (
            <div key={item.id} style={{ visibility: "hidden", opacity: 0 }} className="border-l-2 accent-border pl-5">
              <h3 className="text-lg md:text-xl font-semibold mb-2 text-korean">{item.title}</h3>
              <p className="text-ink-muted leading-relaxed text-korean whitespace-pre-line">{item.description}</p>
            </div>
          ))}
        </div>

        <Reveal delay={0.1} className="mt-16">
          <p className="text-xl md:text-2xl font-semibold text-korean">
            팀이 함께 확인하는 <span className="accent-text">내부 관리체계</span>
          </p>
        </Reveal>
      </Container>
    </section>
  );
}
