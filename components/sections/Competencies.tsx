"use client";

import { useLayoutEffect, useRef } from "react";
import { Competency } from "@/lib/types";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { MediaFrame } from "@/components/ui/MediaFrame";
import { gsap, prefersReducedMotion, FAST_SCROLL_SAFE } from "@/lib/gsap";

// §16.1 큰 문장 — "결과"에 강조색을 적용한다.
const BIG_SENTENCE = ["목적을 이해하고,", "표현 방식을 선택하고,", "결과까지 연결합니다."];
const ACCENT_WORD = "결과까지";

function BigSentence() {
  const ref = useRef<HTMLHeadingElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const words = el.querySelectorAll<HTMLElement>("[data-word]");
    const accentWord = el.querySelector<HTMLElement>("[data-accent-word]");

    if (prefersReducedMotion()) {
      gsap.set(words, { color: "var(--color-text-primary)" });
      if (accentWord) gsap.set(accentWord, { color: "var(--accent)" });
      return;
    }

    gsap.set(words, { color: "var(--color-text-muted)" });
    gsap.to(words, {
      color: "var(--color-text-primary)",
      duration: 1,
      ease: "none",
      stagger: 0.06,
      overwrite: "auto",
      scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: 0.4, ...FAST_SCROLL_SAFE },
    });
    if (accentWord) {
      gsap.to(accentWord, {
        color: "var(--accent)",
        duration: 1,
        ease: "none",
        overwrite: "auto",
        scrollTrigger: { trigger: el, start: "top 60%", end: "bottom 45%", scrub: 0.4, ...FAST_SCROLL_SAFE },
      });
    }
  }, []);

  return (
    <h2 ref={ref} className="text-korean section-title font-bold max-w-4xl">
      {BIG_SENTENCE.map((line, li) => (
        <span key={li} className="block">
          {line.split(" ").map((word, i) => (
            <span key={i} data-word {...(word === ACCENT_WORD ? { "data-accent-word": true } : {})} className="inline">
              {word}{" "}
            </span>
          ))}
        </span>
      ))}
    </h2>
  );
}

// §16.3 스크롤 모션 — 역량 항목을 동시에 보여주지 않고 하나씩 활성화한다.
function SequentialSkills({ items }: { items: Competency[] }) {
  const pinRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const descStageRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const pin = pinRef.current;
    const list = listRef.current;
    const stage = descStageRef.current;
    if (!pin || !list || !stage) return;

    const titles = Array.from(list.querySelectorAll<HTMLElement>("[data-skill-title]"));
    const descs = Array.from(stage.querySelectorAll<HTMLElement>("[data-skill-desc]"));
    if (titles.length === 0) return;

    if (prefersReducedMotion()) {
      gsap.set(titles, { color: "var(--color-text-primary)" });
      gsap.set(descs, { autoAlpha: 1, yPercent: 0, position: "relative" });
      return;
    }

    gsap.set(titles, { color: "var(--color-text-muted)" });
    gsap.set(titles[0], { color: "var(--accent)" });
    gsap.set(descs, { autoAlpha: 0, yPercent: 40 });
    gsap.set(descs[0], { autoAlpha: 1, yPercent: 0 });

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: pin,
          start: "top top",
          end: `+=${titles.length * 880}`,
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          ...FAST_SCROLL_SAFE,
        },
      });

      titles.forEach((titleEl, i) => {
        if (i === 0) return;
        const t = i - 0.15;
        tl.to(titles[i - 1], { color: "var(--color-text-muted)", duration: 0.2, overwrite: "auto" }, t)
          .to(titleEl, { color: "var(--accent)", duration: 0.2, overwrite: "auto" }, t)
          .to(descs[i - 1], { autoAlpha: 0, yPercent: -40, duration: 0.25, ease: "power2.in", overwrite: "auto" }, t)
          .to(descs[i], { autoAlpha: 1, yPercent: 0, duration: 0.3, ease: "power3.out", overwrite: "auto" }, t + 0.05);
      });

      return () => {
        tl.scrollTrigger?.kill();
        tl.kill();
      };
    }, pin);

    return () => ctx.revert();
  }, [items.length]);

  // 이전에는 이 pin 섹션이 <Container> 없이 뷰포트 전체 폭을 그대로 썼기
  // 때문에, 번호·목차가 화면 맨 가장자리에 붙고 넓은 화면에서는 좌우 grid가
  // 무한정 늘어나 목차와 설명 사이 공백이 과도하게 벌어지는 문제가 있었다.
  // 다른 섹션과 동일하게 Container로 감싸 공통 여백 기준선에 맞춘다.
  return (
    <div ref={pinRef} className="relative min-h-[100svh] w-full flex items-center">
      <Container className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.2fr] gap-10 md:gap-20 items-center">
          <div ref={listRef} className="space-y-3 md:space-y-5">
            {items.map((c, i) => (
              <div key={c.id} data-skill-title className="grid grid-cols-[36px_minmax(0,1fr)] items-baseline gap-4 text-korean">
                <span className="font-en text-sm">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-xl md:text-3xl font-bold">{c.title}</span>
              </div>
            ))}
          </div>

          <div ref={descStageRef} className="relative min-h-[200px] max-w-[880px]">
            {items.map((c, i) => {
              const cases = [...(c.cases || [])].sort((a, b) => a.order - b.order);
              return (
                <div key={c.id} data-skill-desc className="absolute inset-0" style={{ visibility: "hidden" }}>
                  <p className="text-ink-secondary body-large leading-relaxed text-korean mb-6 max-w-[780px]">{c.description}</p>
                  {cases.length > 0 && (
                    <ul className="space-y-2">
                      {cases.map((cs) => (
                        <li key={cs.id} className="text-sm text-ink/80 flex gap-2 text-korean">
                          <span className="accent-text">·</span>
                          {cs.text}
                        </li>
                      ))}
                    </ul>
                  )}
                  {!cases.length && c.media && <MediaFrame media={c.media} className="aspect-[4/3] rounded-sm mt-4" />}
                </div>
              );
            })}
          </div>
        </div>
      </Container>
    </div>
  );
}

export function Competencies({ items }: { items: Competency[] }) {
  const sorted = [...items].sort((a, b) => a.order - b.order);

  return (
    <section id="skills" className="section-pad bg-bg-soft">
      <Container>
        <Reveal>
          <p className="accent-text text-sm font-medium mb-4 tracking-wide">주요 업무 역량</p>
        </Reveal>
        <div className="mb-20 md:mb-28">
          <BigSentence />
        </div>
      </Container>

      {sorted.length > 0 && <SequentialSkills items={sorted} />}
    </section>
  );
}
