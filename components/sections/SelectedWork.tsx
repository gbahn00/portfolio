"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { MediaRef, Project } from "@/lib/types";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { isPlaceholder, mediaSrc, optimizedImageSrc } from "@/lib/utils";

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

// §74 — "사진을 첨부했다가 지웠더니 미리보기가 안 보인다"는 문제 수정.
// 원인 1) 예전에는 `listPreviewMedia ?? heroImage`처럼 값이 있는지만
// (null/undefined 여부만) 확인했는데, 관리자 화면에서 사진을 지운 뒤
// 저장하면 필드 자체가 사라지는 대신 `{ url: "", ... }`처럼 속이 빈
// 객체로 남는 경우가 있었다. 이런 객체는 값이 "있는 것"으로 취급돼
// 다음 대체값(heroImage)으로 넘어가지 못하고 빈 이미지가 그대로 붙어버렸다.
// 이제는 url이 실제로 채워져 있는지까지 확인한다.
// 원인 2) listPreviewMedia와 heroImage 둘 다 비어 있고 상세 이미지
// (gallery)만 채워둔 프로젝트는 대체할 이미지가 전혀 없었다 — 마지막
// 대체 후보로 gallery의 첫 번째 미디어까지 추가했다.
function pickPreviewMedia(project: Project): MediaRef | undefined {
  const candidates: (MediaRef | undefined)[] = [
    project.listPreviewMedia,
    project.heroImage,
    project.gallery?.[0],
  ];
  return candidates.find((m) => m && m.url);
}

function PreviewMedia({ media }: { media?: MediaRef }) {
  if (!media) return null;
  const style: React.CSSProperties = {
    display: "block",
    width: "auto",
    height: "auto",
    maxWidth: PREVIEW_MAX_W,
    maxHeight: PREVIEW_MAX_H,
  };
  if (media.kind === "video-file") {
    return <video src={mediaSrc(media.url)} poster={media.poster} muted playsInline style={style} />;
  }
  // §102 — 260x180 안에서만 보이는 아주 작은 미리보기라 384px 폭이면
  // 레티나 화면에서도 충분히 선명하다. 원본을 그대로 내려받던 것에
  // 비하면 용량이 크게 줄어든다.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={optimizedImageSrc(media.url, 384)} alt={media.alt || ""} style={style} />;
}

// §47 — 목록을 "1~4번은 Design, 5~8번은 Content" 두 칼럼으로 나눠달라는
// 요청. 순서는 여전히 관리자(프로필/프로젝트 관리 화면)에서 정한 order
// 그대로이고, 앞의 4개는 왼쪽(Design) 칼럼에, 다음 4개는 오른쪽(Content)
// 칼럼에 배치한다. 번호(01~08)는 전체 순번을 그대로 이어서 매긴다.
const COLUMN_SPLIT = 4;

export function SelectedWork({ projects }: { projects: Project[] }) {
  const sorted = [...projects].sort((a, b) => a.order - b.order);
  // §48 — 예전에는 isFeatured로 표시할 4개만 골랐는데, 그러면 앞의 4개
  // (Design)가 전부 isFeatured=false라 목록에서 통째로 빠져 Design 칼럼이
  // 비어버리는 문제가 있었다. Design/Content 2단 구성은 "정해진 8개를
  // 순서대로 4+4로 나누는" 고정 구조이므로, featured 필터 없이 순서상
  // 앞 8개를 그대로 쓴다.
  const list = sorted.slice(0, 8);
  const columns = [
    { label: "Design", items: list.slice(0, COLUMN_SPLIT), offset: 0 },
    { label: "Content", items: list.slice(COLUMN_SPLIT, 8), offset: COLUMN_SPLIT },
  ];

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
          <Reveal holdAfterEnter>
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
            {/* §34 — justify-evenly로 4개 안팎의 항목을 세로 공간 전체에 억지로
                고르게 벌렸더니 행 사이 간격이 부자연스럽게 커 보였다. 각 행
                자체를 넉넉하게 키우고(패딩·글자 크기) justify-center로
                되돌려, 항목 수에 맞는 자연스러운 밀도로 박스 가운데 놓이게
                했다. 폭도 초광폭 화면에서 테두리 줄만 끝없이 길어 보이지
                않도록 max-w-4xl로 적당히 잡았다(이전의 3xl보다는 넓게). */}
            {/* §49 — 두 칼럼을 각각 독립된 flex 세로 목록으로 두면 칼럼별
                콘텐츠 높이가 서로 달라(특히 8번 강조 박스 때문에) 같은
                번째 행끼리 높이가 어긋나 보였다. 하나의 CSS Grid에
                Design/Content를 같은 행 번호(gridRow)로 명시적으로 배치해
                "같은 순번의 행은 두 칼럼에서 항상 같은 높이"가 되도록
                했다(그리드 행은 그 안의 가장 큰 셀 높이에 맞춰진다). 행
                자체의 세로 길이도 패딩을 늘려 조금 더 여유 있게 키웠다. */}
            {/* §50 — max-w-5xl로 좁혀놨던 폭을 없애 좌우가 Container(페이지
                끝)까지 꽉 차도록 늘렸다. */}
            <div
              className="grid grid-cols-1 md:grid-cols-2 gap-x-14 md:gap-x-20 gap-y-3 content-center h-full overflow-hidden w-full"
              style={{ gridTemplateRows: "auto repeat(4, auto)" }}
            >
              {columns.map((col, colIdx) => (
                <p
                  key={col.label}
                  className="font-en text-xs md:text-sm text-ink-muted tracking-[0.2em] mb-2 md:mb-3"
                  style={{ gridColumn: colIdx + 1, gridRow: 1 }}
                >
                  {col.label}
                </p>
              ))}
              {columns.map((col, colIdx) =>
                col.items.map((p, i) => {
                  const globalIndex = col.offset + i;
                  // §47 — 8번(마지막 항목)은 강조 폰트 색상(--accent)을
                  // 뒷배경으로 반영해 시각적으로 도드라지게 했다. 배경이
                  // 생기는 만큼 기본 테두리 줄 대신 카드 형태(둥근
                  // 모서리 + 좌우 패딩)로 바꾸고, 글자색은 배경(주황)
                  // 위에서도 잘 읽히도록 어두운 배경색을 그대로 썼다.
                  const isHighlighted = globalIndex === 7;
                  return (
                    <Link
                      key={p.id}
                      href={`/projects/${p.id}`}
                      onMouseEnter={() => setHoveredId(p.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      onFocus={() => setHoveredId(p.id)}
                      onBlur={() => setHoveredId(null)}
                      style={{
                        gridColumn: colIdx + 1,
                        gridRow: i + 2,
                        background: isHighlighted ? "var(--accent)" : undefined,
                      }}
                      className={
                        isHighlighted
                          ? "group flex items-center gap-5 py-6 md:py-7 px-4 md:px-5 rounded-md self-stretch"
                          : `group flex items-center gap-5 py-6 md:py-7 self-stretch ${i === 0 ? "border-t" : ""} border-b border-line`
                      }
                    >
                      <span
                        className="font-en text-sm tabular-nums shrink-0 transition-colors duration-200"
                        style={{
                          color: isHighlighted
                            ? "var(--color-bg-primary)"
                            : p.id === hoveredId
                            ? "var(--accent)"
                            : "var(--color-text-muted)",
                          opacity: isHighlighted ? 0.7 : 1,
                        }}
                      >
                        {String(globalIndex + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p
                          className="text-xl md:text-2xl font-semibold truncate text-korean transition-colors duration-200"
                          style={{
                            color: isHighlighted
                              ? "var(--color-bg-primary)"
                              : p.id === hoveredId
                              ? "var(--color-text-primary)"
                              : "var(--color-text-secondary)",
                          }}
                        >
                          {p.title}
                        </p>
                        <p
                          className="text-sm truncate mt-1"
                          style={{ color: isHighlighted ? "var(--color-bg-primary)" : "var(--color-text-muted)", opacity: isHighlighted ? 0.75 : 1 }}
                        >
                          {p.field}
                        </p>
                      </div>
                      <span
                        className="shrink-0 text-base transition-all duration-200"
                        style={{
                          color: isHighlighted ? "var(--color-bg-primary)" : "var(--accent)",
                          opacity: isHighlighted ? 1 : p.id === hoveredId ? 1 : 0,
                          transform: p.id === hoveredId || isHighlighted ? "translateX(0)" : "translateX(-4px)",
                        }}
                      >
                        →
                      </span>
                    </Link>
                  );
                })
              )}
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
                      없으면(또는 비어 있으면) 상세 페이지 대표 이미지
                      (heroImage), 그마저 없으면 상세 이미지(gallery) 첫
                      번째 항목으로 대신한다. */}
                  <PreviewMedia media={pickPreviewMedia(current)} />
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
