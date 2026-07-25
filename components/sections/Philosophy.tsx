"use client";

import { useLayoutEffect, useRef } from "react";
import { PhilosophySection } from "@/lib/types";
import { Container } from "@/components/ui/Container";
import { RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { gsap, BIDIRECTIONAL_TOGGLE, prefersReducedMotion } from "@/lib/gsap";

// 강조할 핵심 단어 — 문장 안에서 발견되면 강조 색상으로 전환됩니다.
const EMPHASIS_WORDS = ["사용 목적", "제작 목적", "대상", "활용 매체", "표현방식", "목적", "매체"];

function splitEmphasis(text: string) {
  const pattern = new RegExp(`(${EMPHASIS_WORDS.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "g");
  return text.split(pattern).filter(Boolean);
}

function ParagraphLine({ text, index }: { text: string; index: number }) {
  const ref = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      gsap.set(el.querySelectorAll("span"), { color: "#F5F5F5" });
      return;
    }

    const ctx = gsap.context(() => {
      const emphasisSpans = el.querySelectorAll<HTMLElement>("[data-emphasis]");
      const baseSpans = el.querySelectorAll<HTMLElement>("[data-base]");

      gsap.set(baseSpans, { color: "#6b6b6b" });
      gsap.set(emphasisSpans, { color: "#6b6b6b" });

      gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: "top 82%",
          end: "top 38%",
          scrub: 0.4,
        },
      })
        .to(baseSpans, { color: "#F5F5F5", duration: 1, ease: "none", stagger: 0.03 }, 0)
        .to(emphasisSpans, { color: "var(--accent)", duration: 1, ease: "none" }, 0.25);
    }, ref);

    return () => ctx.revert();
  }, []);

  const parts = splitEmphasis(text);

  return (
    <p ref={ref} className="text-korean text-lg md:text-2xl leading-relaxed">
      {parts.map((part, i) =>
        EMPHASIS_WORDS.includes(part) ? (
          <span key={i} data-emphasis className="font-semibold">
            {part}
          </span>
        ) : (
          <span key={i} data-base>
            {part}
          </span>
        )
      )}
    </p>
  );
}

export function Philosophy({ data }: { data: PhilosophySection }) {
  const paragraphs = [...data.paragraphs].sort((a, b) => a.order - b.order);
  const keywords = [...data.keywords].sort((a, b) => a.order - b.order);

  return (
    <section className="section-pad bg-bg">
      <Container>
        <h2 className="text-3xl md:text-5xl font-bold mb-12 md:mb-16 text-korean">{data.title}</h2>

        <div className="max-w-3xl space-y-8 mb-14">
          {paragraphs.map((p, i) => (
            <ParagraphLine key={p.id} text={p.text} index={i} />
          ))}
        </div>

        <RevealGroup className="flex flex-wrap gap-3">
          {keywords.map((k) => (
            <RevealItem key={k.id}>
              <span className="inline-block rounded-full border border-white/15 px-5 py-2.5 text-sm md:text-base text-ink-muted">
                {k.text}
              </span>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </section>
  );
}
