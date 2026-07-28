"use client";

import { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { Project } from "@/lib/types";
import { Container } from "@/components/ui/Container";
import { MediaFrame } from "@/components/ui/MediaFrame";
import { GradientOverlay } from "@/components/ui/GradientOverlay";
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

      // §71 — 예전에는 스크롤 진행률에 맞춰 제목/메타 정보를 Fade Out
      // 시켰는데, 아래로 스크롤했다가 다시 위로 올라오는 과정에서 제목이
      // 사라진 채로 보이는 경우가 있었다(헤더를 상시 노출로 바꾸고 섹션
      // 라벨을 holdAfterEnter로 유지시킨 것과 같은 이유로, 제목도 한 번
      // 나타난 뒤에는 스크롤 방향과 관계없이 계속 보이는 편이 자연스럽다).
      // 이제 이미지 확대 패럴랙스만 스크롤에 연동하고, 제목/메타는 처음
      // 등장(Fade In)한 뒤 계속 그대로 유지한다.
      gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom top",
          scrub: 0.6,
          ...FAST_SCROLL_SAFE,
        },
      }).to(imgWrapRef.current, { scale: 1.18, duration: 1, ease: "none" }, 0);
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative h-[100svh] w-full overflow-hidden bg-bg">
      {/* §156 — 모든 프로젝트 대표화면이 공유하는 공통 검정 그라데이션
          (components/ui/GradientOverlay.tsx). 예전엔 이 화면 전용으로
          bg 색상(테마에 따라 달라질 수 있는 --color-bg-primary) 기반
          그라데이션을 썼는데, "이미지·영상 원본 색과 무관하게 항상 같은
          검정 그라데이션"으로 통일했다. */}
      <div ref={imgWrapRef} className="absolute inset-0">
        <MediaFrame media={project.heroImage} className="absolute inset-0 h-full w-full" priority />
        <GradientOverlay />
      </div>

      {/* §32 — 제목이 화면 한가운데 떠 있어 부자연스럽다는 피드백에 따라,
          상단 내비게이션은 그대로 위에 두고 제목+메타 정보는 화면 아래쪽에
          함께 모아 배치했다(잡지형 커버처럼 제목이 하단에 앵커링되는 방식).
          가운데는 flex-1 spacer로 비워서 사진/영상이 그대로 드러나게 한다. */}
      <Container className="relative z-10 flex h-full flex-col py-10 md:py-14">
        <div className="flex items-start justify-between">
          <Link href="/#projects" className="text-sm text-ink-secondary hover:text-ink transition-colors">
            ← 목록으로
          </Link>
          <span className="font-en text-sm text-ink-secondary">
            {project.number} / {project.field}
          </span>
        </div>

        <div className="flex-1" />

        <div ref={titleRef}>
          <h1 className="detail-cover-title font-bold text-korean max-w-4xl whitespace-pre-line">{project.title}</h1>
        </div>

        <div ref={metaRef} className="flex flex-wrap gap-x-10 gap-y-2 text-sm text-ink-secondary mt-5 md:mt-6">
          {!isPlaceholder(project.role) && (
            <span>
              <strong className="text-ink font-medium">ROLE</strong> · {project.role}
            </span>
          )}
          {!isPlaceholder(project.year) && (
            <span>
              <strong className="text-ink font-medium">YEAR</strong> · {project.year}
            </span>
          )}
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
