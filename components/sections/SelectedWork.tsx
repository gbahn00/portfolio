"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Project } from "@/lib/types";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { MediaFrame } from "@/components/ui/MediaFrame";
import { isPlaceholder } from "@/lib/utils";

// ============================================================================
// 전체 구조 개편 명세서 §4 — "04.대표 프로젝트"
//
// §26 — 스포트라이트 슬라이더 대신 목록(리스트업) 방식으로 바꿨다.
// §27 — 항상 떠 있는 오른쪽 미리보기 칼럼 대신, 목록 행 위에 커서를 올릴
// 때만 커서 옆에 작은 미리보기 창이 나타나는 방식으로 다시 바꿨다. 목록은
// 이제 폭 전체를 쓰고, 미리보기는 마우스 위치를 따라다니는 작은(220x140)
// 썸네일로 opacity 전환만 사용해 나타나고/사라진다(호버 아닐 땐 완전히
// 숨김 + pointer-events:none이라 클릭/커서 흐름을 방해하지 않는다).
// 클릭하면 상세 페이지(/projects/[id])로 이동하고, 상세 페이지의
// "← 목록으로" 링크(/#projects, ProjectCover.tsx)로 다시 이 목록에 돌아온다.
// ============================================================================

const PREVIEW_W = 220;
const PREVIEW_H = 140;

export function SelectedWork({ projects }: { projects: Project[] }) {
  const sorted = [...projects].sort((a, b) => a.order - b.order);
  const featured = sorted.filter((p) => p.isFeatured);
  const list = (featured.length > 0 ? featured : sorted).slice(0, 8);

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const current = list.find((p) => p.id === hoveredId) ?? null;

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const wrap = wrapRef.current;
    const preview = previewRef.current;
    if (!wrap || !preview) return;
    const rect = wrap.getBoundingClientRect();
    let x = e.clientX - rect.left + 24;
    let y = e.clientY - rect.top - PREVIEW_H / 2;
    // 컨테이너 경계를 넘어가지 않도록 살짝 보정한다.
    x = Math.min(Math.max(x, 0), Math.max(rect.width - PREVIEW_W, 0));
    y = Math.min(Math.max(y, 0), Math.max(rect.height - PREVIEW_H, 0));
    preview.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }

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
          <div ref={wrapRef} className="relative flex-1 min-h-0" onMouseMove={handleMouseMove}>
            <div className="flex flex-col justify-center h-full overflow-hidden max-w-3xl">
              {list.map((p, i) => (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}`}
                  onMouseEnter={() => setHoveredId(p.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onFocus={() => setHoveredId(p.id)}
                  onBlur={() => setHoveredId(null)}
                  className="group flex items-center gap-4 py-3 md:py-3.5 border-b border-line first:border-t last:border-b-0"
                >
                  <span
                    className="font-en text-xs tabular-nums shrink-0 transition-colors duration-200"
                    style={{ color: p.id === hoveredId ? "var(--accent)" : "var(--color-text-muted)" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-base md:text-lg font-semibold truncate text-korean transition-colors duration-200"
                      style={{ color: p.id === hoveredId ? "var(--color-text-primary)" : "var(--color-text-secondary)" }}
                    >
                      {p.title}
                    </p>
                    <p className="text-xs text-ink-muted truncate mt-0.5">{p.field}</p>
                  </div>
                  <span
                    className="shrink-0 text-sm transition-all duration-200"
                    style={{
                      color: "var(--accent)",
                      opacity: p.id === hoveredId ? 1 : 0,
                      transform: p.id === hoveredId ? "translateX(0)" : "translateX(-4px)",
                    }}
                  >
                    →
                  </span>
                </Link>
              ))}
            </div>

            {/* 커서를 따라다니는 작은 미리보기(호버 중일 때만 보임) */}
            <div
              ref={previewRef}
              className="pointer-events-none absolute left-0 top-0 overflow-hidden rounded-sm shadow-lg transition-opacity duration-200"
              style={{
                width: PREVIEW_W,
                height: PREVIEW_H,
                opacity: current ? 1 : 0,
                background: "var(--color-bg-secondary)",
              }}
            >
              {current && (
                <>
                  <MediaFrame media={current.heroImage} className="h-full w-full" />
                  <div className="absolute inset-0 bg-gradient-to-t from-bg/75 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-2.5">
                    <p className="text-xs font-semibold text-white line-clamp-1 text-korean">{current.title}</p>
                    {!isPlaceholder(current.field) && (
                      <p className="text-[10px] text-white/70 line-clamp-1">{current.field}</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <p className="text-ink-muted text-center py-16">공개된 작업이 아직 없습니다.</p>
        )}
      </Container>
    </section>
  );
}
