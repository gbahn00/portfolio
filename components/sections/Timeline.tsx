"use client";

import { ReactNode, useLayoutEffect, useRef } from "react";
import { TimelineEntry } from "@/lib/types";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { MediaFrame } from "@/components/ui/MediaFrame";
import { gsap, ScrollTrigger, BIDIRECTIONAL_TOGGLE, FAST_SCROLL_SAFE, prefersReducedMotion } from "@/lib/gsap";

// §7.6 — 데스크톱: 세로 스크롤에 따라 연도 Panel이 가로로 이동 (Pin + Horizontal Scroll)
//        모바일: 세로형 Panel로 전환

// ------------------------------------------------------------------
// 데스크톱(가로 핀 스크롤) 모드에서만 쓰는 등장 래퍼.
//
// 문제였던 부분: 기존에는 이 안의 텍스트들도 일반 <Reveal>(세로 스크롤 위치
// 기준 "top 80%"~"bottom 15%")을 그대로 썼다. 그런데 연도별 패널은 가로로
// 나란히 배치되어 있어 문서상 세로 위치가 거의 같고, 가로 핀 구간 동안에도
// 화면은 멈춰 있을 뿐 실제 문서 스크롤(scrollY)은 계속 진행된다. 그 결과
// 2025·2026 패널이 가로 스크롤로 실제로 보이기도 전에 세로 트리거의 종료
// 조건("bottom 15%")이 이미 지나가 버려, 화면에 들어오자마자 사라지는 것처럼
// 보이는 문제가 있었다.
//
// 가로로 슬라이드해 들어오는 동작 자체가 이미 하나의 "등장 모션"이므로,
// 데스크톱 가로 모드에서는 내부 텍스트에 별도의 세로 트리거를 걸지 않고
// 처음부터 보이는 상태로 둔다. 모바일(세로 스택)에서는 기존처럼 스크롤에
// 따라 자연스럽게 나타나야 하므로 그대로 유지한다.
// ------------------------------------------------------------------
function PanelReveal({
  children,
  className,
  delay = 0,
  strength = "weak",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  strength?: "weak" | "strong";
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      gsap.set(el, { autoAlpha: 1, y: 0 });
      return;
    }

    const isDesktopHorizontal = window.matchMedia("(min-width: 768px)").matches;

    if (isDesktopHorizontal) {
      gsap.set(el, { autoAlpha: 1, y: 0 });
      return;
    }

    const distance = strength === "strong" ? 40 : 22;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { autoAlpha: 0, y: distance },
        {
          autoAlpha: 1,
          y: 0,
          duration: strength === "strong" ? 1.0 : 0.7,
          delay,
          ease: "power3.out",
          overwrite: "auto",
          scrollTrigger: {
            trigger: el,
            start: strength === "strong" ? "top 70%" : "top 80%",
            end: "bottom 15%",
            toggleActions: BIDIRECTIONAL_TOGGLE,
            ...FAST_SCROLL_SAFE,
          },
        }
      );
    }, ref);

    return () => ctx.revert();
  }, [delay, strength]);

  return (
    <div ref={ref} className={className} style={{ visibility: "hidden", opacity: 0 }}>
      {children}
    </div>
  );
}

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
            <PanelReveal>
              <span className="accent-text section-title font-bold block mb-4 font-en">{entry.year}</span>
            </PanelReveal>
            <PanelReveal delay={0.05}>
              <h3 className="statement-title font-bold mb-4 text-korean">{entry.title}</h3>
            </PanelReveal>
            <PanelReveal delay={0.1}>
              <p className="body text-ink-secondary mb-6 max-w-md">{entry.description}</p>
            </PanelReveal>
            <PanelReveal delay={0.15}>
              <p className="body-large font-medium border-l-2 accent-border pl-4 text-korean mb-6">{entry.message}</p>
            </PanelReveal>
            {tags.length > 0 && (
              <PanelReveal delay={0.2}>
                <div className="flex flex-wrap gap-x-4 gap-y-1 font-en caption">
                  {tags.map((t) => (
                    <span key={t.id}>#{t.text.replace(/\s/g, "")}</span>
                  ))}
                </div>
              </PanelReveal>
            )}
          </div>

          <PanelReveal strength="strong">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm">
              <MediaFrame media={entry.heroImage} className="h-full w-full" />
            </div>
          </PanelReveal>
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
          force3D: true,
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
        {/* 가로로 이동하는 트랙에만 will-change를 지정해 브라우저가 스크롤
            시작 전에 GPU 레이어로 미리 승격해 두도록 한다(§3.1). 다른
            요소에는 적용하지 않는다. */}
        <div ref={trackRef} className="flex flex-col md:flex-row md:w-max" style={{ willChange: "transform" }}>
          {sorted.map((entry, i) => (
            <YearPanel key={entry.id} entry={entry} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
