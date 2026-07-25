"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { Project } from "@/lib/types";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { MediaFrame } from "@/components/ui/MediaFrame";
import { gsap } from "@/lib/gsap";
import { isPlaceholder } from "@/lib/utils";

// §9.3-9.4 — 번호 / 제목 / 카테고리 / 짧은 설명을 세로로 쌓은 구조.
// 프로젝트 행 min-height 150px, 제목 최소 30px.
function ProjectRow({
  project,
  index,
  onHover,
  featured = true,
}: {
  project: Project;
  index: number;
  onHover: (i: number | null) => void;
  featured?: boolean;
}) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="group block"
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => onHover(null)}
    >
      <Reveal delay={(index % 8) * 0.03}>
        <div
          className={`flex items-start gap-4 md:gap-8 border-b border-line transition-colors duration-300 group-hover:bg-white/[0.03] px-2 md:px-4 -mx-2 md:-mx-4 ${
            featured ? "py-8 md:py-10 min-h-[150px]" : "py-6 min-h-[110px]"
          }`}
        >
          <span className="font-en text-sm text-ink-muted w-8 shrink-0 pt-2 transition-colors duration-300 group-hover:accent-text">
            {String(index + 1).padStart(2, "0")}
          </span>

          <div className="flex-1 min-w-0">
            <h3
              className={`font-bold text-korean text-ink transition-colors duration-300 group-hover:accent-text ${
                featured ? "text-3xl md:text-6xl mb-3" : "text-xl md:text-3xl mb-2"
              }`}
            >
              {project.title}
            </h3>
            <p className="accent-text font-en text-xs tracking-wide mb-2">{project.field}</p>
            {featured && (
              <p className="body max-w-xl line-clamp-2">{project.purpose}</p>
            )}
          </div>

          {/* 모바일: 인라인 썸네일 */}
          <div className="md:hidden w-14 h-14 shrink-0 overflow-hidden rounded-sm">
            <MediaFrame media={project.heroImage} className="h-full w-full" />
          </div>

          <span className="hidden md:inline-block accent-text opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-xl shrink-0">
            →
          </span>
        </div>
      </Reveal>
    </Link>
  );
}

export function SelectedWork({ projects }: { projects: Project[] }) {
  const sorted = [...projects].sort((a, b) => a.order - b.order);
  const featured = sorted.filter((p) => p.isFeatured).slice(0, 4);
  const other = sorted.filter((p) => !featured.includes(p));
  const combined = [...featured, ...other];

  const [hovered, setHovered] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const quickY = useRef<((value: number) => void) | null>(null);

  useLayoutEffect(() => {
    if (!previewRef.current) return;
    quickY.current = gsap.quickTo(previewRef.current, "y", { duration: 0.5, ease: "power3.out" });
  }, []);

  useLayoutEffect(() => {
    if (!previewRef.current) return;
    if (hovered === null) {
      gsap.to(previewRef.current, { autoAlpha: 0, scale: 0.96, duration: 0.35, ease: "power2.in", overwrite: "auto" });
      videoRef.current?.pause();
    } else {
      gsap.to(previewRef.current, { autoAlpha: 1, scale: 1, duration: 0.4, ease: "power3.out", overwrite: "auto" });
      videoRef.current?.play().catch(() => {});
    }
  }, [hovered]);

  function handleMouseMove(e: React.MouseEvent) {
    if (!containerRef.current || hovered === null) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relY = e.clientY - rect.top;
    quickY.current?.(gsap.utils.clamp(0, rect.height - 300, relY - 150));
  }

  const activeProject = hovered !== null ? combined[hovered] : null;

  return (
    <>
      {/* §8 Selected Works Intro */}
      <section className="section-pad pb-0 bg-bg-soft">
        <Container>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-line pb-16">
            <div>
              <Reveal>
                <p className="accent-text text-sm font-medium mb-4 tracking-wide">SELECTED WORKS</p>
              </Reveal>
              <Reveal delay={0.05}>
                <h2 className="section-title font-bold text-korean max-w-2xl">
                  촬영부터 영상, 생성형 AI와<br />업무 체계까지.
                </h2>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="body-large text-ink-secondary mt-6 max-w-xl text-korean">
                  역할이 확장된 과정을 대표 프로젝트로 보여드립니다.
                </p>
              </Reveal>
            </div>
            <Reveal delay={0.1}>
              <div className="text-right shrink-0">
                <p className="font-en section-title font-bold accent-text leading-none">
                  {String(featured.length).padStart(2, "0")}
                </p>
                <p className="font-en text-xs text-ink-muted mt-2 tracking-wide">FEATURED PROJECTS</p>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      <section id="selected-works" className="section-pad pt-16 bg-bg-soft">
        <Container>
          <div ref={containerRef} className="relative" onMouseMove={handleMouseMove}>
            {featured.length > 0 && (
              <div className="border-t border-line">
                {featured.map((p, i) => (
                  <ProjectRow key={p.id} project={p} index={i} onHover={setHovered} featured />
                ))}
              </div>
            )}

            {other.length > 0 && (
              <div className="mt-16">
                <Reveal>
                  <p className="font-en text-xs text-ink-muted tracking-wide mb-4">OTHER WORKS</p>
                </Reveal>
                <div className="border-t border-line">
                  {other.map((p, i) => (
                    <ProjectRow key={p.id} project={p} index={featured.length + i} onHover={setHovered} featured={false} />
                  ))}
                </div>
              </div>
            )}

            {/* 데스크톱: 마우스를 따라다니는 미리보기 이미지 */}
            <div
              ref={previewRef}
              className="hidden md:block pointer-events-none absolute right-4 top-0 w-72 lg:w-[26vw] lg:max-w-[420px] rounded-sm overflow-hidden z-10"
              style={{ visibility: "hidden", opacity: 0 }}
            >
              <div className="relative h-52">
                <MediaFrame media={activeProject?.heroImage} className="absolute inset-0 h-full w-full" />
                {activeProject?.previewVideo && (
                  <video
                    ref={videoRef}
                    src={activeProject.previewVideo.url}
                    muted
                    loop
                    playsInline
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}
              </div>
              {activeProject && (
                <div className="bg-bg-surface px-4 py-3">
                  <p className="text-xs text-ink-secondary text-korean">{activeProject.field}</p>
                  {!isPlaceholder(activeProject.role) && (
                    <p className="text-xs text-ink-muted text-korean mt-0.5">{activeProject.role}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {sorted.length === 0 && (
            <p className="text-ink-muted text-center py-16">공개된 작업이 아직 없습니다.</p>
          )}
        </Container>
      </section>
    </>
  );
}
