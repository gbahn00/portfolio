"use client";

import { useLayoutEffect, useRef } from "react";
import { Profile, PhilosophySection } from "@/lib/types";
import { Container } from "@/components/ui/Container";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { MediaFrame } from "@/components/ui/MediaFrame";
import { gsap, prefersReducedMotion, FAST_SCROLL_SAFE } from "@/lib/gsap";
import { optimizedImageSrc, optimizedImageSrcSet } from "@/lib/utils";

// ============================================================
// About Section (§11) — 섹션 전체를 Pin 처리한 뒤, 문장을 한 개씩
// 순서대로 등장/완전 퇴장 시키는 스토리 섹션.
// 한 시점에는 하나의 문장만 선명하게 표시하고, 이전 문장은 autoAlpha:0 +
// visibility:hidden 으로 완전히 숨겨 잔상을 남기지 않는다 (§11.4).
// ============================================================

export function AboutIdentity({ profile, philosophy }: { profile: Profile; philosophy: PhilosophySection }) {
  const paragraphs = [...philosophy.paragraphs].sort((a, b) => a.order - b.order);
  const keywords = [...philosophy.keywords].sort((a, b) => a.order - b.order);

  const pinSectionRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const photoWrapRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const pinSection = pinSectionRef.current;
    const stage = stageRef.current;
    if (!pinSection || !stage) return;

    const sentences = Array.from(stage.querySelectorAll<HTMLElement>("[data-about-sentence]"));
    if (sentences.length === 0) return;

    if (prefersReducedMotion()) {
      gsap.set(sentences, { autoAlpha: 1, yPercent: 0 });
      gsap.set(imgRef.current, { scale: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.set(sentences, { autoAlpha: 0, yPercent: 110 });
      gsap.set(sentences[0], { autoAlpha: 1, yPercent: 0 });
      gsap.set(imgRef.current, { scale: 1.12 });

      const segment = 1; // 문장마다 동일한 스크롤 구간을 사용
      const total = sentences.length + 1; // 마지막 구간은 이미지 확대

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: pinSection,
          start: "top top",
          end: `+=${total * 820}`,
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          ...FAST_SCROLL_SAFE,
        },
      });

      sentences.forEach((el, i) => {
        const start = i * segment;
        if (i > 0) {
          // 이전 문장이 화면 위로 완전히 퇴장한 뒤에만 다음 문장이 등장한다.
          tl.to(
            sentences[i - 1],
            { yPercent: -100, autoAlpha: 0, duration: 0.2, ease: "power2.in", overwrite: "auto" },
            start - 0.2
          );
          tl.to(el, { yPercent: 0, autoAlpha: 1, duration: 0.22, ease: "power3.out", overwrite: "auto" }, start);
        }
        if (counterRef.current) {
          tl.call(
            () => {
              if (counterRef.current) counterRef.current.textContent = String(i + 1).padStart(2, "0");
            },
            undefined,
            start
          );
        }
      });

      // 마지막 문장 유지 → 프로필 이미지 확대 → 다음 섹션 전환
      tl.to(imgRef.current, { scale: 1, duration: 1, ease: "none" }, sentences.length - 0.5);

      return () => {
        tl.scrollTrigger?.kill();
        tl.kill();
      };
    }, pinSection);

    return () => ctx.revert();
  }, [paragraphs.length]);

  return (
    <>
      <div id="about" ref={pinSectionRef} className="fullscreen-section relative w-full bg-bg-soft">
        <Container className="relative flex h-full flex-col justify-center">
          <div className="absolute left-0 top-10 md:top-14 flex items-baseline gap-3 text-sm text-ink-secondary">
            <span>ABOUT</span>
            <span className="accent-text font-en">
              <span ref={counterRef}>01</span> / {String(paragraphs.length).padStart(2, "0")}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-10 md:gap-16 items-center">
            <div ref={stageRef} className="relative">
              {paragraphs.map((p) => (
                <p
                  key={p.id}
                  data-about-sentence
                  className="statement-title absolute inset-0 flex items-center text-korean font-medium overflow-visible whitespace-pre-line"
                  style={{ visibility: "hidden" }}
                >
                  {p.text}
                </p>
              ))}
              {/* 레이아웃 높이 확보용 투명 문장 (가장 긴 문장 기준) */}
              <p aria-hidden className="statement-title invisible text-korean font-medium whitespace-pre-line">
                {paragraphs.reduce((a, b) => (a.text.length > b.text.length ? a : b), paragraphs[0])?.text}
              </p>
            </div>

            {/* §73 — 1:1 정사각형 박스 + object-cover로 채웠더니 세로/가로
                사진이 잘려서 보인다는 피드백을 받았다. 강제로 자르는 대신
                첨부한 사진의 원본 비율 그대로 자연스러운 크기로 보여주고,
                폭(max-w-sm)만 제한한다 — 레터박스(빈 여백)도, 잘림도 없다. */}
            <div ref={photoWrapRef} className="relative w-full max-w-sm overflow-hidden rounded-sm justify-self-center md:justify-self-end">
              {profile.profilePhoto?.url && (
                // eslint-disable-next-line @next/next/no-img-element
                // §148 — 이 사진은 원본 파일(mediaSrc, 최적화 없음)을 그대로
                // 내려받고 있었다. max-w-sm(384px) 안에서만 보이는 사진이라
                // optimizedImageSrc로 바꿔 화질 저하 없이 용량만 줄인다.
                <img
                  ref={imgRef}
                  src={optimizedImageSrc(profile.profilePhoto.url, 768)}
                  srcSet={optimizedImageSrcSet(profile.profilePhoto.url, [384, 640, 768, 1080])}
                  sizes="(min-width: 768px) 384px, 90vw"
                  alt={profile.profilePhoto.alt || ""}
                  className="block w-full h-auto"
                  style={{ filter: "brightness(0.9) contrast(1.05)" }}
                  loading="lazy"
                  decoding="async"
                />
              )}
            </div>
          </div>
        </Container>
      </div>

      <section className="section-pad bg-bg-soft">
        <Container>
          <Reveal>
            <p className="text-korean text-xl md:text-2xl leading-relaxed mb-10 whitespace-pre-line max-w-3xl">
              {profile.introLong}
            </p>
          </Reveal>
          <RevealGroup className="flex flex-wrap gap-2 mb-12">
            {keywords.map((k) => (
              <RevealItem key={k.id}>
                <span className="inline-block rounded-full border border-line px-4 py-2 text-sm text-ink-secondary">
                  {k.text}
                </span>
              </RevealItem>
            ))}
          </RevealGroup>

          {profile.onSitePhotos?.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {profile.onSitePhotos.map((photo, i) => (
                <Reveal key={i} delay={(i % 3) * 0.05}>
                  <MediaFrame media={photo} className="aspect-[4/3] rounded-sm" />
                </Reveal>
              ))}
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
