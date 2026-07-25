"use client";

import { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { Project } from "@/lib/types";
import { Container } from "@/components/ui/Container";
import { MediaFrame } from "@/components/ui/MediaFrame";
import { gsap, prefersReducedMotion, FAST_SCROLL_SAFE } from "@/lib/gsap";
import { isPlaceholder } from "@/lib/utils";

// §10.2 Project Cover — 스크롤 시 대표 이미지가 화면 전체로 확대되고
// 제목은 Fade Out 되며 다음 Problem 문단으로 자연스럽게 이어진다.
export function ProjectCover({ project }: { project: Project }) {
  const sectionRef = useRef<HTMLElement>(null);
  const imgWrapRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const metaRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.set(imgWrapRef.current, { clipPath: "inset(100% 0% 0% 0%)", scale: 1.08 });
      gsap.to(imgWrapRef.current, {
        clipPath: "inset(0% 0% 0% 0%)",
        scale: 1,
        duration: 1.1,
        ease: "power3.out",
      });
      gsap.set([titleRef.current, metaRef.current], { autoAlpha: 0, y: 20 });
      gsap.to([titleRef.current, metaRef.current], {
        autoAlpha: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.08,
        delay: 0.3,
      });

      gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom top",
          scrub: 0.6,
          ...FAST_SCROLL_SAFE,
        },
      })
        .to(imgWrapRef.current, { scale: 1.18, duration: 1, ease: "none" }, 0)
        .to([titleRef.current, metaRef.current], { autoAlpha: 0, y: -40, duration: 1, ease: "none" }, 0);
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative h-[100svh] w-full overflow-hidden bg-bg">
      <div ref={imgWrapRef} className="absolute inset-0">
        <MediaFrame media={project.heroImage} className="absolute inset-0 h-full w-full" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-bg/70 via-bg/15 to-transparent" />
      </div>

      <Container className="relative z-10 flex h-full flex-col justify-between py-10 md:py-14">
        <div className="flex items-start justify-between">
          <Link href="/#selected-works" className="text-sm text-ink-secondary hover:text-ink transition-colors">
            ← 목록으로
          </Link>
          <span className="font-en text-sm text-ink-secondary">
            {project.number} / {project.field}
          </span>
        </div>

        <div ref={titleRef}>
          <h1 className="hero-title font-bold text-korean max-w-4xl">{project.title}</h1>
        </div>

        <div ref={metaRef} className="flex flex-wrap gap-x-10 gap-y-2 text-sm text-ink-secondary">
          {!isPlaceholder(project.role) && (
            <span>
              <strong className="text-ink font-medium">ROLE</strong> · {project.role}
            </span>
          )}
          <span>
            <strong className="text-ink font-medium">YEAR</strong> · {project.year}
          </span>
          {!project.brandHidden && project.brand && !isPlaceholder(project.brand) && (
            <span>
              <strong className="text-ink font-medium">TYPE</strong> · {project.brand}
            </span>
          )}
        </div>
      </Container>
    </section>
  );
}
