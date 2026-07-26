"use client";

import { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { Project } from "@/lib/types";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { MediaFrame } from "@/components/ui/MediaFrame";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";

function FeaturedCard({ project, index }: { project: Project; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  function handleEnter() {
    gsap.to(cardRef.current, { scale: 1.02, duration: 0.5, ease: "power3.out" });
    videoRef.current?.play().catch(() => {});
  }
  function handleLeave() {
    gsap.to(cardRef.current, { scale: 1, duration: 0.5, ease: "power3.out" });
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }

  return (
    <Link
      href={`/projects/${project.id}`}
      className="group relative block w-[78vw] md:w-[72vw] lg:w-[62vw] shrink-0 h-[62vh] md:h-[66vh] overflow-hidden rounded-sm"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <div ref={cardRef} className="absolute inset-0">
        <MediaFrame media={project.heroImage} className="h-full w-full" />
        {project.previewVideo && (
          <video
            ref={videoRef}
            src={project.previewVideo.url}
            muted
            loop
            playsInline
            className="absolute inset-0 h-full w-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/10 to-transparent" />
      </div>
      <span data-parallax-num className="absolute top-6 left-6 font-en text-sm text-ink-muted">
        {String(index + 1).padStart(2, "0")}
      </span>
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
        <p className="text-ink-muted text-sm mb-2 text-korean">{project.field}</p>
        <h3 className="text-2xl md:text-4xl font-bold mb-2 text-korean group-hover:accent-text transition-colors">{project.title}</h3>
        <p className="text-sm text-ink/80 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 text-korean">
          {project.role}
        </p>
      </div>
    </Link>
  );
}

export function FeaturedCases({ projects }: { projects: Project[] }) {
  const sorted = [...projects].sort((a, b) => a.order - b.order);
  const pinRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const pin = pinRef.current;
    const track = trackRef.current;
    if (!pin || !track) return;
    if (prefersReducedMotion()) return;

    const mm = gsap.matchMedia();

    mm.add("(min-width: 768px)", () => {
      const distance = () => track.scrollWidth - window.innerWidth;

      const tween = gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: pin,
          start: "top top",
          end: () => `+=${distance()}`,
          scrub: 0.8,
          pin: true,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        },
      });

      // 번호 표시는 반대 방향으로 살짝 이동 (시차 효과)
      const nums = gsap.utils.toArray<HTMLElement>("[data-parallax-num]", track);
      gsap.to(nums, {
        x: () => distance() * 0.06,
        ease: "none",
        scrollTrigger: {
          trigger: pin, start: "top top", end: () => `+=${distance()}`, scrub: 0.8,
        },
      });

      return () => tween.kill();
    });

    return () => mm.revert();
  }, [sorted.length]);

  if (sorted.length === 0) return null;

  return (
    <section className="bg-bg">
      <Container className="pt-24 md:pt-32 pb-10 md:pb-14">
        <p className="accent-text text-sm font-medium mb-4 tracking-wide">대표 프로젝트 상세 사례</p>
        <h2 className="text-3xl md:text-5xl font-bold text-korean">
          결과물이 아니라 과정을 보여주는 프로젝트
        </h2>
      </Container>

      {/* 데스크톱: 가로 스크롤 고정 */}
      <div ref={pinRef} className="hidden md:block relative h-screen overflow-hidden">
        <div className="h-full flex items-center">
          <div ref={trackRef} className="flex items-center gap-6 pl-[6vw] pr-[6vw]" style={{ width: "max-content" }}>
            {sorted.map((p, i) => (
              <FeaturedCard key={p.id} project={p} index={i} />
            ))}
          </div>
        </div>
      </div>

      {/* 모바일: 세로 카드 */}
      <Container className="md:hidden pb-20 space-y-6">
        {sorted.map((p, i) => (
          <Reveal key={p.id} delay={(i % 4) * 0.05}>
            <Link href={`/projects/${p.id}`} className="block">
              <MediaFrame media={p.heroImage} className="aspect-[4/3] rounded-sm mb-4" />
              <p className="text-ink-muted text-sm mb-1 text-korean">
                {String(i + 1).padStart(2, "0")} · {p.field}
              </p>
              <h3 className="text-xl font-bold mb-2 text-korean">{p.title}</h3>
              <p className="text-ink-muted text-sm leading-relaxed text-korean whitespace-pre-line">{p.purpose}</p>
            </Link>
          </Reveal>
        ))}
      </Container>
    </section>
  );
}
