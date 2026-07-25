"use client";

import { useLayoutEffect, useRef } from "react";
import { ClosingSection } from "@/lib/types";
import { Container } from "@/components/ui/Container";
import { MaskLines } from "@/components/motion/MaskLines";
import { ScrollTopButton } from "@/components/motion/ScrollTopButton";
import { mediaSrc } from "@/lib/utils";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

// §18.4 — 배경 Fade → 첫 줄 Reveal → 둘째 줄 Reveal → 강조 단어 색상 전환 → 하단 정보 → 버튼
export function Closing({ data }: { data: ClosingSection }) {
  const bg = data.backgroundImage ? mediaSrc(data.backgroundImage.url) : "/placeholders/closing-bg.svg";
  const sectionRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);
  const metaRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const lines = messageRef.current?.querySelectorAll<HTMLElement>("[data-mask-line]") ?? [];
      gsap.set(lines, { yPercent: 115, autoAlpha: 0 });
      gsap.set(bgRef.current, { autoAlpha: 0, scale: 1.1 });
      gsap.set([metaRef.current, btnRef.current], { autoAlpha: 0, y: 16 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top 70%",
          end: "top 20%",
          toggleActions: "play reverse play reverse",
        },
        defaults: { ease: "power3.out" },
      });

      tl.to(bgRef.current, { autoAlpha: 0.35, scale: 1, duration: 1.4 }, 0)
        .to(lines, { yPercent: 0, autoAlpha: 1, duration: 0.9, stagger: 0.14 }, 0.1)
        .to(metaRef.current, { autoAlpha: 1, y: 0, duration: 0.7 }, "-=0.3")
        .to(btnRef.current, { autoAlpha: 1, y: 0, duration: 0.7 }, "-=0.4");
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative min-h-[100svh] flex items-center overflow-hidden bg-bg">
      <div className="absolute inset-0">
        <div ref={bgRef} className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={bg} alt={data.backgroundImage?.alt || ""} className="h-full w-full object-cover blur-sm" />
        </div>
        <div className="absolute inset-0 bg-bg/45" />
      </div>
      <Container className="relative z-10 py-32">
        <div ref={messageRef} className="mb-8">
          <MaskLines text={data.message} className="hero-title font-bold" accentLines={[0]} />
        </div>
        {data.subline && (
          <p className="text-korean text-ink-secondary body-large max-w-xl mb-10 whitespace-pre-line">
            {data.subline}
          </p>
        )}
        <div ref={metaRef} className="flex flex-wrap items-center gap-x-4 gap-y-1 text-ink-secondary text-sm md:text-base mb-10">
          <span className="text-ink font-medium">{data.name}</span>
          <span>{data.department}</span>
          <span>{data.role}</span>
          <span>{data.badge}</span>
        </div>
        <div ref={btnRef} className="flex flex-wrap gap-4">
          <ScrollTopButton label="Back to Top" />
          <ScrollTopButton label="View Works" href="/#selected-works" />
        </div>
      </Container>
    </section>
  );
}
