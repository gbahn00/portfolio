"use client";

import { useLayoutEffect, useRef } from "react";
import { TimelineEntry } from "@/lib/types";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { MediaFrame } from "@/components/ui/MediaFrame";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

// §7.6 — 데스크톱: 세로 스크롤에 따라 연도 Panel이 가로로 이동 (Pin + Horizontal Scroll)
//        모바일: 세로형 Panel로 전환

function YearPanel({ entry, index }: { entry: TimelineEntry; index: number }) {
  const experiences = [...entry.experiences].sort((a, b) => a.order - b.order);
  const tags = experiences.slice(0, 3);

  return (
    <div
      data-year-panel
      className="relative h-[100svh] md:h-auto md:min-h-[90svh] w-screen shrink-0 flex flex-col justify-center border-t border-line md:border-t-0 py-16 md:py-0"
    >
      <Container className="w-full">
        <div
          className={`grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center ${
            index % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""
          }`}
        >
          <div>
            <Reveal>
              <span className="accent-text section-title font-bold block mb-4 font-en">{entry.year}</span>
            </Reveal>
            <Reveal delay={0.05}>
              <h3 className="statement-title font-bold mb-4 text-korean">{entry.title}</h3>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="body text-ink-secondary mb-6 max-w-md">{entry.description}</p>
            </Reveal>
            <Reveal delay={0.15}>
              <p className="body-large font-medium border-l-2 accent-border pl-4 text-korean mb-6">{entry.message}</p>
            </Reveal>
            {tags.length > 0 && (
              <Reveal delay={0.2}>
                <div className="flex flex-wrap gap-x-4 gap-y-1 font-en caption">
                  {tags.map((t) => (
                    <span key={t.id}>#{t.text.replace(/\s/g, "")}</span>
                  ))}
                </div>
              </Reveal>
            )}
          </div>

          <Reveal strength="strong">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm">
              <MediaFrame media={entry.heroImage} className="h-full w-full" />
            </div>
          </Reveal>
        </div>
      </Container>
    </div>
  );
}

export function Timeline({ entries }: { entries: TimelineEntry[] }) {
  const sorted = [...entries].sort((a, b) => a.order - b.order);
  const pinRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const pin = pinRef.current;
    const track = trackRef.current;
    if (!pin || !track) return;
    if (prefersReducedMotion()) return;
    if (sorted.length < 2) return;

    const mm = gsap.matchMedia();

    mm.add("(min-width: 768px)", () => {
      const distance = () => track.scrollWidth - window.innerWidth;

      const ctx = gsap.context(() => {
        gsap.to(track, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: pin,
            start: "top top",
            end: () => `+=${Math.max(distance(), 1200)}`,
            scrub: 0.7,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            fastScrollEnd: true,
          },
        });
      }, pin);

      return () => ctx.revert();
    });

    return () => mm.revert();
  }, [sorted.length]);

  return (
    <section id="journey" className="section-pad bg-bg overflow-hidden">
      <Container>
        <Reveal>
          <p className="accent-text text-sm font-medium mb-4 tracking-wide">업무 성장과정</p>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="section-title font-bold mb-16 md:mb-20 text-korean">
            입사 이후,<br />역할은 이렇게<br />확장되었습니다.
          </h2>
        </Reveal>
      </Container>

      <div ref={pinRef} className="relative">
        <div ref={trackRef} className="flex flex-col md:flex-row md:w-max">
          {sorted.map((entry, i) => (
            <YearPanel key={entry.id} entry={entry} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
