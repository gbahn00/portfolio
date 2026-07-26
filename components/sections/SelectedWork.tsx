"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { MediaRef, Project } from "@/lib/types";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { isPlaceholder, mediaSrc } from "@/lib/utils";

// ============================================================================
// 전체 구조 개편 명세서 §4 — "04.대표 프로젝트"
//
// §26 — 스포트라이트 슬라이더 대신 목록(리스트업) 방식으로 바꿨다.
// §27 — 항상 떠 있는 오른쪽 미리보기 칼럼 대신, 목록 행 위에 커서를 올릴
// 때만 커서 옆에 작은 미리보기 창이 나타나는 방식으로 바꿨다.
// §28 — 그 미리보기를 고정 220x140 박스에 object-cover로 잘라 넣는 대신,
// 첨부된 사진/영상의 원본 비율 그대로 보이도록 바꿨다. MediaFrame(Next
// Image + fill + object-cover)을 쓰지 않고, 일반 <img>/<video> 태그에
// width/height를 지정하지 않은 채 max-width/max-height만 주었다 — 이러면
// 브라우저가 원본 가로세로 비율을 유지한 채로 그 한도 안에 맞춰 자동으로
// 크기를 정해준다(가로로 긴 사진은 옆으로 넓게, 세로로 긴 사진은 위아래로
// 길게 보인다). 위치 계산(clamp)은 실제 크기를 몰라도 되도록 "이 한도
// 안에서 가장 클 때"를 기준으로 넉넉하게 잡아둔다.
// ============================================================================

const PREVIEW_MAX_W = 260;
const PREVIEW_MAX_H = 180;

function PreviewMedia({ media }: { media?: MediaRef }) {
  if (!media) return null;
  const src = mediaSrc(media.url);
  const style: React.CSSProperties = {
    display: "block",
    width: "auto",
    height: "auto",
    maxWidth: PREVIEW_MAX_W,
    maxHeight: PREVIEW_MAX_H,
  };
  if (media.kind === "video-file") {
    return <video src={src} poster={media.poster} muted playsInline style={style} />;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={media.alt || ""} style={style} />;
}

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
    let y = e.clientY - rect.top - PREVIEW_MAX_H / 2;
    // 실제 이미지 크기는 원본 비율에 따라 다르지만, 계산은 "한도 안에서
    // 가장 클 때" 기준으로 여유 있게 잡아 컨테이너 밖으로 튀지 않게 한다.
    x = Math.min(Math.max(x, 0), Math.max(rect.width - PREVIEW_MAX_W, 0));
    y = Math.min(Math.max(y, 0), Math.max(rect.height - PREVIEW_MAX_H, 0));
    preview.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }

  return (
    <section id="projects" className="fp-section bg-bg-soft py-6 md:py-8" style={{ justifyContent: "stretch" }}>
      <Container className="w-full h-full flex flex-col">
        {/* §30 — 제목과 목록 사이 여백이 과했다는 피드백으로 mb를 줄였다. */}
        <div className="shrink-0 mb-3 md:mb-4">
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
            {/* §30 — 오른쪽에 항상 떠 있는 미리보기 칼럼이 없어진 뒤로는 목록을
                max-w-3xl로 좁혀둘 이유가 없었다. 페이지 폭 전체를 쓰도록 바꿨다. */}
            {/* justify-evenly로 행 사이 여백을 고르게 벌려, 항목 수가 적어도
                목록이 박스 절반이 아니라 세로 공간 전체를 채우도록 했다. */}
            <div className="flex flex-col justify-evenly h-full overflow-hidden w-full">
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

            {/* 커서를 따라다니는 작은 미리보기(호버 중일 때만 보임, 원본 비율 유지) */}
            <div
              ref={previewRef}
              className="pointer-events-none absolute left-0 top-0 transition-opacity duration-200"
              style={{ opacity: current ? 1 : 0 }}
            >
              {current && (
                <div className="relative inline-block overflow-hidden rounded-sm shadow-lg" style={{ background: "var(--color-bg-secondary)" }}>
                  {/* 목록 미리보기 전용 미디어가 따로 지정돼 있으면 그걸 쓰고,
                      없으면 상세 페이지 대표 이미지(heroImage)로 대신한다. */}
                  <PreviewMedia media={current.listPreviewMedia ?? current.heroImage} />
                  {/* §31 — 사진/영상 색상에 따라 제목 글자가 묻히는 문제를
                      막기 위해, 전체 이미지에 옅은 그라디언트만 까는 대신
                      맨 아래 텍스트가 놓이는 자리에만 불투명에 가까운 작은
                      배경 박스를 준다. 이미지 색과 무관하게 항상 읽힌다. */}
                  <div
                    className="absolute bottom-0 left-0 right-0 px-2.5 py-2"
                    style={{ background: "linear-gradient(to top, rgba(10,10,10,0.92) 40%, rgba(10,10,10,0.55) 75%, rgba(10,10,10,0) 100%)" }}
                  >
                    <p className="text-xs font-semibold text-white line-clamp-1 text-korean">{current.title}</p>
                    {!isPlaceholder(current.field) && (
                      <p className="text-[10px] text-white/70 line-clamp-1">{current.field}</p>
                    )}
                  </div>
                </div>
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
