"use client";

import { useLayoutEffect, useRef } from "react";
import { HeroSection, MediaRef } from "@/lib/types";
import { mediaSrc } from "@/lib/utils";
import { Container } from "@/components/ui/Container";
import { MaskLines } from "@/components/motion/MaskLines";
import { MediaFrame } from "@/components/ui/MediaFrame";
import { gsap, ScrollTrigger, prefersReducedMotion, FAST_SCROLL_SAFE } from "@/lib/gsap";
import { CountUp } from "@/components/motion/CountUp";

// 헤드라인에서 강조색을 적용할 줄 (0부터 시작) — "다르게" 줄
const HERO_ACCENT_LINES = [1];

export function Hero({
  hero,
  stats,
  stackImages = [],
}: {
  hero: HeroSection;
  stats?: { label: string; value: string }[];
  stackImages?: MediaRef[];
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const sublineRef = useRef<HTMLParagraphElement>(null);
  const introRef = useRef<HTMLParagraphElement>(null);
  const badgeRef = useRef<HTMLParagraphElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  const stackImgRefs = useRef<HTMLDivElement[]>([]);
  const bottomRowRef = useRef<HTMLDivElement>(null);

  const images = stackImages.filter(Boolean).slice(0, 3);
  const primary = images[0] ? mediaSrc(images[0].url) : hero.backgroundImage ? mediaSrc(hero.backgroundImage.url) : "/placeholders/hero-bg.svg";

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const reduced = prefersReducedMotion();
    const lines = headlineRef.current?.querySelectorAll<HTMLElement>("[data-mask-line]") ?? [];
    const stackEls = stackImgRefs.current.filter(Boolean);

    const ctx = gsap.context(() => {
      if (reduced) {
        gsap.set(
          [overlayRef.current, sublineRef.current, introRef.current, badgeRef.current, hintRef.current, statsRef.current, ...Array.from(lines), ...stackEls],
          { clearProps: "all", autoAlpha: 1, clipPath: "inset(0% 0% 0% 0%)" }
        );
        return;
      }

      // ============================================================
      // 01 검정 Overlay → 02 Header(레이아웃) → 03 배지(직무 문구) →
      // 04~06 제목 줄 순차 Mask Reveal → 07 대표 이미지 Clip Reveal →
      // 08 업무 소개 → 09 수치 Count Up → 10 Scroll Indicator (§5.5)
      // ============================================================
      const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
      intro
        .set(lines, { yPercent: 110, autoAlpha: 0 })
        .set([sublineRef.current, introRef.current, badgeRef.current, hintRef.current, statsRef.current], { autoAlpha: 0, y: 16 })
        .set(stackEls, { clipPath: "inset(100% 0% 0% 0%)", scale: 1.08 })
        .to(overlayRef.current, { autoAlpha: 0, duration: 0.9 })
        .to(badgeRef.current, { autoAlpha: 1, y: 0, duration: 0.6 }, 0.4)
        .to(lines, { yPercent: 0, autoAlpha: 1, duration: 0.9, stagger: 0.14 }, 0.55)
        .to(sublineRef.current, { autoAlpha: 1, y: 0, duration: 0.7 }, "-=0.5")
        .to(
          stackEls,
          { clipPath: "inset(0% 0% 0% 0%)", scale: 1, duration: 1, stagger: 0.12, ease: "power3.out" },
          "-=0.6"
        )
        .to(introRef.current, { autoAlpha: 1, y: 0, duration: 0.6 }, "-=0.4")
        .to(statsRef.current, { autoAlpha: 1, y: 0, duration: 0.6 }, "-=0.35")
        .to(hintRef.current, { autoAlpha: 1, y: 0, duration: 0.6 }, "-=0.25");

      // ============================================================
      // Hero 스크롤 모션 (§5.6) — 제목이 좌측 상단으로, 이미지가 중앙 확대,
      // 하단 정보는 Fade Out 되며 다음 Identity 장면과 연결된다.
      // ============================================================
      gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "+=1800",
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          ...FAST_SCROLL_SAFE,
        },
      })
        .to(headlineRef.current, { scale: 0.72, xPercent: -6, yPercent: -18, duration: 1, ease: "none", transformOrigin: "left top" }, 0)
        .to(stackRef.current, { scale: 1.35, xPercent: 4, duration: 1, ease: "none" }, 0)
        .to([badgeRef.current, sublineRef.current], { autoAlpha: 0, y: -24, duration: 0.8, ease: "none" }, 0.05)
        .to(bottomRowRef.current, { autoAlpha: 0, y: 24, duration: 0.8, ease: "none" }, 0.1)
        .to(hintRef.current, { autoAlpha: 0, duration: 0.3, ease: "none" }, 0);
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative h-[100svh] w-full overflow-hidden bg-bg">
      <div ref={overlayRef} className="absolute inset-0 z-30 bg-bg pointer-events-none" />

      <Container className="relative z-10 flex h-full flex-col justify-center py-24 md:py-28">
        <p ref={badgeRef} className="accent-text text-sm md:text-base font-medium mb-6 tracking-wide">
          {hero.badge}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-10 md:gap-16 items-center flex-1">
          <div ref={headlineRef} style={{ transformOrigin: "left top" }}>
            <MaskLines text={hero.headline} className="hero-title font-bold" accentLines={HERO_ACCENT_LINES} />
            <p ref={sublineRef} className="text-korean text-ink-secondary body-large max-w-md mt-8 whitespace-pre-line">
              {hero.subline}
            </p>
          </div>

          <div ref={stackRef} className="relative hidden md:block aspect-[3/4] w-full max-w-sm justify-self-end">
            {images.length > 0 ? (
              images.map((img, i) => (
                <div
                  key={i}
                  ref={(el) => {
                    if (el) stackImgRefs.current[i] = el;
                  }}
                  className="absolute overflow-hidden rounded-sm shadow-2xl"
                  style={{
                    inset: `${i * 8}% ${i * -6}% ${-i * 8}% ${i * 6}%`,
                    zIndex: images.length - i,
                  }}
                >
                  <MediaFrame media={img} className="h-full w-full" priority={i === 0} />
                </div>
              ))
            ) : (
              <div
                ref={(el) => {
                  if (el) stackImgRefs.current[0] = el;
                }}
                className="absolute inset-0 overflow-hidden rounded-sm"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={primary} alt={hero.backgroundImage?.alt || "대표 이미지 자리 표시자 [자료 필요]"} className="h-full w-full object-cover" style={{ filter: "brightness(0.9) contrast(1.05)" }} />
              </div>
            )}
          </div>
        </div>

        <div ref={bottomRowRef} className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-4 items-end mt-10 md:mt-16">
          <p ref={introRef} className="text-sm md:text-base text-ink-secondary text-korean max-w-xs">
            {hero.name} · {hero.role} · {hero.department}
          </p>

          {stats && stats.length > 0 && (
            <div ref={statsRef} className="flex flex-wrap gap-x-8 gap-y-3 md:justify-center">
              {stats.map((s) => (
                <div key={s.label}>
                  <p className="font-en text-xl md:text-3xl font-bold accent-text">
                    <CountUp value={s.value} />
                  </p>
                  <p className="text-xs text-ink-muted mt-1 text-korean">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          <div ref={hintRef} className="flex items-center gap-2 md:justify-self-end text-xs md:text-sm text-ink-secondary">
            <span>SCROLL</span>
            <div className="h-8 w-5 rounded-full border border-ink-muted/50 flex items-start justify-center p-1 animate-bounce">
              <div className="h-1 w-1 rounded-full bg-ink-muted" />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
