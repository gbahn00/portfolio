"use client";

import { useLayoutEffect, useRef } from "react";
import { Profile } from "@/lib/types";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { MediaFrame } from "@/components/ui/MediaFrame";
import { MaskLines } from "@/components/motion/MaskLines";
import { gsap, BIDIRECTIONAL_TOGGLE, prefersReducedMotion } from "@/lib/gsap";

export function ProfileSection({ data }: { data: Profile }) {
  const facts = [...data.keyFacts].sort((a, b) => a.order - b.order);
  const photoWrapRef = useRef<HTMLDivElement>(null);
  const gateRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const wrap = photoWrapRef.current;
    if (!wrap) return;

    if (prefersReducedMotion()) {
      gsap.set(gateRef.current, { xPercent: 100 });
      return;
    }

    const ctx = gsap.context(() => {
      // 사각형 가림막이 옆으로 열리며 사진이 나타난다
      gsap.set(gateRef.current, { xPercent: 0 });
      gsap.timeline({
        scrollTrigger: {
          trigger: wrap,
          start: "top 78%",
          end: "top 30%",
          toggleActions: BIDIRECTIONAL_TOGGLE,
        },
      }).to(gateRef.current, { xPercent: 100, duration: 1.1, ease: "power4.inOut" });

      // 사진 패럴랙스 — 스크롤에 따라 살짝 위로 이동 (scrub, 자동 역재생)
      gsap.to(imgRef.current, {
        yPercent: -8,
        ease: "none",
        scrollTrigger: { trigger: wrap, start: "top bottom", end: "bottom top", scrub: 0.6 },
      });

      // 이름 라인 마스크 등장
      const lines = nameRef.current?.querySelectorAll<HTMLElement>("[data-mask-line]") ?? [];
      gsap.set(lines, { yPercent: 110 });
      gsap.to(lines, {
        yPercent: 0,
        duration: 0.8,
        stagger: 0.08,
        ease: "power3.out",
        scrollTrigger: { trigger: nameRef.current, start: "top 85%", end: "top 40%", toggleActions: BIDIRECTIONAL_TOGGLE },
      });

      // 촬영 현장 사진 — 좌우에서 번갈아 등장
      if (galleryRef.current) {
        const photos = Array.from(galleryRef.current.children) as HTMLElement[];
        photos.forEach((el, i) => {
          gsap.fromTo(
            el,
            { opacity: 0, x: i % 2 === 0 ? -40 : 40 },
            {
              opacity: 1, x: 0, duration: 0.8, ease: "power3.out",
              scrollTrigger: { trigger: el, start: "top 88%", end: "top 40%", toggleActions: BIDIRECTIONAL_TOGGLE },
            }
          );
        });
      }
    }, wrap);

    return () => ctx.revert();
  }, []);

  return (
    <section className="section-pad bg-bg-soft">
      <Container className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
        <div ref={photoWrapRef} className="relative aspect-[4/5] w-full overflow-hidden rounded-sm">
          <div ref={imgRef} className="absolute inset-0 scale-110">
            <MediaFrame media={data.profilePhoto} className="h-full w-full" priority />
          </div>
          <div ref={gateRef} className="absolute inset-0 bg-bg-soft z-10" />
        </div>

        <div>
          <p className="accent-text text-sm font-medium mb-4 tracking-wide">프로필</p>
          <div ref={nameRef} className="mb-4">
            <MaskLines
              text={`${data.name}`}
              className="text-2xl md:text-3xl font-bold"
            />
          </div>
          <p className="text-ink-muted text-lg md:text-xl mb-6">{data.affiliation} · {data.rank}</p>
          <Reveal delay={0.05}>
            <p className="text-korean text-xl md:text-2xl leading-relaxed mb-10 whitespace-pre-line">{data.introLong}</p>
          </Reveal>

          <div className="space-y-4">
            {facts.map((f, i) => (
              <Reveal key={f.label} delay={i * 0.03}>
                <div className="flex items-baseline justify-between border-b border-white/10 pb-3">
                  <span className="text-ink-muted text-sm md:text-base">{f.label}</span>
                  <span className="text-ink text-sm md:text-base font-medium text-right">{f.value}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Container>

      {data.onSitePhotos?.length > 0 && (
        <Container className="mt-16 md:mt-20">
          <div ref={galleryRef} className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {data.onSitePhotos.map((photo, i) => (
              <div key={i} style={{ opacity: 0 }}>
                <MediaFrame media={photo} className="aspect-[4/3] rounded-sm" />
              </div>
            ))}
          </div>
        </Container>
      )}
    </section>
  );
}
