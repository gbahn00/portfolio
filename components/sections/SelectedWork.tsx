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
//
// §26 — 스포트라이트 슬라이더(한 번에 프로젝트 1개 + 이전/다음 버튼) 대신
// 목록(리스트업) 방식으로 바꾼다. 목차 행 위에 커서를 올리면(호버) 오른쪽
// 미리보기가 그 프로젝트로 바뀌고, 행을 클릭하면 상세 페이지(/projects/[id])로
// 이동한다. 상세 페이지의 "← 목록으로" 링크는 이미 /#projects로 연결되어
// 있어 그대로 이 섹션으로 돌아온다(components/sections/ProjectCover.tsx).
//
// 프로필 보조창(§24)과 같은 패턴으로, 제목/부제는 shrink-0으로 두고 목록+
// 미리보기 영역은 flex-1로 남는 세로 공간을 전부 차지해 100dvh 안에서
// 내부 스크롤 없이 꽉 차게 배치한다.
// ============================================================================

export function SelectedWork({ projects }: { projects: Project[] }) {
  const sorted = [...projects].sort((a, b) => a.order - b.order);
  const featured = sorted.filter((p) => p.isFeatured);
  const list = (featured.length > 0 ? featured : sorted).slice(0, 8);

  const [hovered, setHovered] = useState(0);
  const previewRef = useRef<HTMLDivElement>(null);
  const current = list[Math.min(hovered, Math.max(list.length - 1, 0))];

  useLayoutEffect(() => {
    const el = previewRef.current;
    if (!el || prefersReducedMotion()) return;
    gsap.fromTo(el, { autoAlpha: 0.4 }, { autoAlpha: 1, duration: 0.25, ease: "power1.out", overwrite: "auto" });
  }, [current?.id]);

  return (
    <section id="projects" className="fp-section bg-bg-soft py-6 md:py-8" style={{ justifyContent: "stretch" }}>
      <Container className="w-full h-full flex flex-col">
        <div className="shrink-0 mb-6 md:mb-8">
          <Reveal>
            <p className="accent-text text-sm font-medium mb-3 tracking-wide">대표 프로젝트</p>
          </Reveal>
          <Reveal delay={0.05} strength="strong" holdAfterEnter>
            <h2 className="section-title font-bold text-korean max-w-2xl">
              촬영부터 영상, 생성형 AI와 업무 체계까지.
            </h2>
          </Reveal>
        </div>

        {list.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1.15fr] gap-6 md:gap-10 flex-1 min-h-0">
            {/* 목록 */}
            <div className="flex flex-col justify-center min-h-0 overflow-hidden">
              {list.map((p, i) => (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}`}
                  onMouseEnter={() => setHovered(i)}
                  onFocus={() => setHovered(i)}
                  className="group flex items-center gap-4 py-3 md:py-3.5 border-b border-line first:border-t last:border-b-0"
                >
                  <span
                    className="font-en text-xs tabular-nums shrink-0 transition-colors duration-200"
                    style={{ color: i === hovered ? "var(--accent)" : "var(--color-text-muted)" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-base md:text-lg font-semibold truncate text-korean transition-colors duration-200"
                      style={{ color: i === hovered ? "var(--color-text-primary)" : "var(--color-text-secondary)" }}
                    >
                      {p.title}
                    </p>
                    <p className="text-xs text-ink-muted truncate mt-0.5">{p.field}</p>
                  </div>
                  <span
                    className="shrink-0 text-sm transition-all duration-200"
                    style={{
                      color: "var(--accent)",
                      opacity: i === hovered ? 1 : 0,
                      transform: i === hovered ? "translateX(0)" : "translateX(-4px)",
                    }}
                  >
                    →
                  </span>
                </Link>
              ))}
            </div>

            {/* 호버 미리보기 */}
            {current && (
              <Link
                href={`/projects/${current.id}`}
                className="group relative w-full h-full min-h-0 overflow-hidden rounded-sm block"
              >
                <div ref={previewRef} className="absolute inset-0">
                  <MediaFrame
                    media={current.heroImage}
                    className="h-full w-full transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-bg/80 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                    <p className="accent-text font-en text-xs tracking-wide mb-1">{current.field}</p>
                    <h3 className="text-lg md:text-xl font-bold text-korean text-white mb-1 line-clamp-1">
                      {current.title}
                    </h3>
                    {!isPlaceholder(current.purpose) && (
                      <p className="text-xs md:text-sm text-white/70 line-clamp-2 max-w-md">{current.purpose}</p>
                    )}
                  </div>
                </div>
              </Link>
            )}
          </div>
        ) : (
          <p className="text-ink-muted text-center py-16">공개된 작업이 아직 없습니다.</p>
        )}
      </Container>
    </section>
  );
}
