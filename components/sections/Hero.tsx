"use client";

import { useLayoutEffect, useRef } from "react";
import { HeroSection, MediaRef } from "@/lib/types";
import { mediaSrc } from "@/lib/utils";
import { Container } from "@/components/ui/Container";
import { MaskLines } from "@/components/motion/MaskLines";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

// 헤드라인에서 강조색을 적용할 줄 (0부터 시작) — "다르게" 줄
const HERO_ACCENT_LINES = [1];

// 10라운드 명세서 §2 — 대표 영상/이미지가 화면 한쪽의 작은 요소가 아니라
// Hero 전체의 배경으로 보이도록 재구성했다. 우선순위: 영상 > 대표 이미지 >
// 첫 스택 이미지 > 자리표시자. 어두운 오버레이 진하기는 아래 상수 하나로
// 조절할 수 있다(추후 관리자 화면에 노출하려면 이 값을 settings로 옮기면 됨).
const OVERLAY_OPACITY = 0.5;

function isVideoKind(kind?: string) {
  return kind === "video-file" || kind === "external-video";
}

export function Hero({
  hero,
  stackImages = [],
}: {
  hero: HeroSection;
  stackImages?: MediaRef[];
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const bgWrapRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const sublineRef = useRef<HTMLParagraphElement>(null);
  const introRef = useRef<HTMLParagraphElement>(null);
  const badgeRef = useRef<HTMLParagraphElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const bottomRowRef = useRef<HTMLDivElement>(null);

  const fallbackImage = stackImages.filter(Boolean)[0];
  const video = hero.backgroundVideo && isVideoKind(hero.backgroundVideo.kind) ? hero.backgroundVideo : undefined;
  const image = !video ? hero.backgroundImage || fallbackImage : undefined;
  const imageSrc = image ? mediaSrc(image.url) : !video ? "/placeholders/hero-bg.svg" : undefined;

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const reduced = prefersReducedMotion();
    const lines = headlineRef.current?.querySelectorAll<HTMLElement>("[data-mask-line]") ?? [];

    const ctx = gsap.context(() => {
      if (reduced) {
        gsap.set(
          [overlayRef.current, sublineRef.current, introRef.current, badgeRef.current, hintRef.current, ...Array.from(lines)],
          { clearProps: "all", autoAlpha: 1 }
        );
        gsap.set(overlayRef.current, { opacity: OVERLAY_OPACITY });
        return;
      }

      // ============================================================
      // 01 검정 오버레이가 목표 진하기까지 옅어지며 배경이 드러남 →
      // 02 배지 → 03 제목 줄 순차 Mask Reveal → 04 업무 소개 →
      // 05 Scroll Indicator
      // §42 — 입사/생성형 AI 도구/주요 업무 분야 통계(CountUp)는 제거했다.
      // ============================================================
      const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
      intro
        .set(lines, { yPercent: 110, autoAlpha: 0 })
        .set([sublineRef.current, introRef.current, badgeRef.current, hintRef.current], { autoAlpha: 0, y: 16 })
        .set(overlayRef.current, { opacity: 1 })
        .to(overlayRef.current, { opacity: OVERLAY_OPACITY, duration: 1.1 })
        .to(badgeRef.current, { autoAlpha: 1, y: 0, duration: 0.6 }, 0.4)
        .to(lines, { yPercent: 0, autoAlpha: 1, duration: 0.9, stagger: 0.14 }, 0.55)
        .to(sublineRef.current, { autoAlpha: 1, y: 0, duration: 0.7 }, "-=0.5")
        .to(introRef.current, { autoAlpha: 1, y: 0, duration: 0.6 }, "-=0.35")
        .to(hintRef.current, { autoAlpha: 1, y: 0, duration: 0.6 }, "-=0.3");

      // 전체 구조 개편 명세서 §1 — Full Page Scroll(스크롤 1회=섹션 1개)
      // 도입으로, Hero가 pin+scrub으로 화면 여러 개 분량(+=1800px)을 추가로
      // 차지하던 예전 Ken Burns 스크롤 모션은 제거했다. 섹션 하나가 정확히
      // 한 화면(100svh)만 차지해야 다음 섹션으로의 전환이 "스크롤 1회"에
      // 맞아떨어진다. 배경 확대/제목 축소 같은 스크롤 연동 효과 대신,
      // 진입 시 등장 애니메이션만으로 임팩트를 준다.
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative h-[100dvh] w-full overflow-hidden bg-bg">
      {/* 전체 화면 배경: 영상 우선, 없으면 이미지 */}
      <div ref={bgWrapRef} className="absolute inset-0">
        {video ? (
          <video
            className="h-full w-full object-cover"
            style={{ filter: "brightness(0.9) contrast(1.05)" }}
            src={mediaSrc(video.url)}
            poster={video.poster}
            autoPlay
            muted
            loop
            playsInline
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageSrc}
            alt={image?.alt || "대표 이미지 자리 표시자 [자료 필요]"}
            className="h-full w-full object-cover"
            style={{ filter: "brightness(0.9) contrast(1.05)" }}
          />
        )}
      </div>

      {/* 가독성 확보용 어두운 오버레이. 진하기는 OVERLAY_OPACITY 상수로 조절. */}
      <div ref={overlayRef} className="absolute inset-0 bg-bg pointer-events-none" style={{ opacity: OVERLAY_OPACITY }} />
      {/* 하단은 조금 더 어둡게 — 텍스트가 몰려 있는 영역의 대비를 보강 */}
      <div className="absolute inset-0 bg-gradient-to-t from-bg/70 via-transparent to-transparent pointer-events-none" />

      <Container className="relative z-10 flex h-full flex-col justify-center py-14 md:py-16">
        <p ref={badgeRef} className="accent-text text-sm md:text-base font-medium mb-4 tracking-wide">
          {hero.badge}
        </p>

        <div ref={headlineRef} className="max-w-3xl" style={{ transformOrigin: "left top" }}>
          <MaskLines text={hero.headline} className="hero-title font-bold" accentLines={HERO_ACCENT_LINES} />
          <p ref={sublineRef} className="text-korean text-ink-secondary body-large max-w-md mt-6 whitespace-pre-line">
            {hero.subline}
          </p>
        </div>

        {/* §42 — 입사/생성형 AI 도구/주요 업무 분야 통계를 없애고, 그
            자리(가운데 트랙)로 스크롤 안내 아이콘을 옮겼다. */}
        <div ref={bottomRowRef} className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-4 items-end mt-10 md:mt-14">
          <p ref={introRef} className="text-sm md:text-base text-ink-secondary text-korean max-w-xs">
            {hero.name} · {hero.role} · {hero.department}
          </p>

          <div ref={hintRef} className="flex items-center gap-2 md:justify-self-center text-xs md:text-sm text-ink-secondary">
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
