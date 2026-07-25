"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { Project } from "@/lib/types";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { MediaFrame } from "@/components/ui/MediaFrame";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { isPlaceholder } from "@/lib/utils";

// ============================================================================
// 전체 구조 개편 명세서 §4 — "04.대표 프로젝트"
// 예전에는 모든 프로젝트를 세로로 길게 나열했다. 이제는 한 화면 안에서
// 대표 프로젝트 1개씩 보여주는 스포트라이트 슬라이더로 축소하고, 자세한
// 내용은 각 프로젝트의 별도 상세 페이지(/projects/[id])로 연결한다.
// ============================================================================

export function SelectedWork({ projects }: { projects: Project[] }) {
  const sorted = [...projects].sort((a, b) => a.order - b.order);
  const featured = sorted.filter((p) => p.isFeatured);
  const list = (featured.length > 0 ? featured : sorted).slice(0, 8);

  const [active, setActive] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const current = list[active];

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el || prefersReducedMotion()) return;
    gsap.fromTo(el, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out", overwrite: "auto" });
  }, [active]);

  function go(delta: number) {
    setActive((i) => (i + delta + list.length) % list.length);
  }

  return (
    <section id="projects" className="fp-section bg-bg-soft py-6 md:py-8">
      <Container className="w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 md:mb-8">
          <div>
            <Reveal>
              <p className="accent-text text-sm font-medium mb-3 tracking-wide">대표 프로젝트</p>
            </Reveal>
            <Reveal delay={0.05} strength="strong" holdAfterEnter>
              <h2 className="section-title font-bold text-korean max-w-2xl">
                촬영부터 영상, 생성형 AI와 업무 체계까지.
              </h2>
            </Reveal>
          </div>
          {list.length > 1 && (
            <div className="flex items-center gap-4 shrink-0">
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="이전 프로젝트"
                className="h-10 w-10 rounded-full border border-line flex items-center justify-center text-ink-secondary hover:text-ink hover:border-white/30 transition-colors"
              >
                ←
              </button>
              <span className="font-en text-sm text-ink-muted tabular-nums">
                {String(active + 1).padStart(2, "0")} / {String(list.length).padStart(2, "0")}
              </span>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="다음 프로젝트"
                className="h-10 w-10 rounded-full border border-line flex items-center justify-center text-ink-secondary hover:text-ink hover:border-white/30 transition-colors"
              >
                →
              </button>
            </div>
          )}
        </div>

        {current && (
          <div ref={stageRef} className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-6 md:gap-10 items-center">
            <Link href={`/projects/${current.id}`} className="group relative aspect-[16/10] w-full max-h-[45dvh] overflow-hidden rounded-sm block">
              <MediaFrame media={current.heroImage} className="h-full w-full transition-transform duration-[0.5s] ease-out group-hover:scale-[1.03]" />
              <div className="absolute inset-0 bg-gradient-to-t from-bg/70 via-transparent to-transparent" />
            </Link>
            <div>
              <p className="accent-text font-en text-xs tracking-wide mb-2">{current.field}</p>
              <h3 className="project-title font-bold mb-3 text-korean">{current.title}</h3>
              <p className="body text-ink-secondary mb-5 max-w-md line-clamp-3">{current.purpose}</p>
              {!isPlaceholder(current.role) && (
                <p className="text-sm text-ink-muted mb-5">
                  <strong className="text-ink font-medium">ROLE</strong> · {current.role}
                </p>
              )}
              <Link
                href={`/projects/${current.id}`}
                className="inline-flex items-center gap-2 text-sm font-medium accent-text hover:gap-3 transition-all duration-300"
              >
                자세히 보기 →
              </Link>
            </div>
          </div>
        )}

        {list.length === 0 && <p className="text-ink-muted text-center py-16">공개된 작업이 아직 없습니다.</p>}
      </Container>
    </section>
  );
}
