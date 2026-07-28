"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { TimelineEntry } from "@/lib/types";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { MediaFrame } from "@/components/ui/MediaFrame";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { registerSubSteps } from "@/lib/fullpage";
import { mediaSrc, optimizedImageSrc } from "@/lib/utils";

// ============================================================================
// 전체 구조 개편 명세서 §3 — "03.업무 성장과정"
// 기존에는 연도별 패널을 세로 스크롤에 맞춰 가로로 파닝(pin+horizontal
// scrub)하는 방식이었다. 이 방식은 화면 여러 개 분량의 스크롤이 필요해서
// Full Page Scroll(스크롤 1회 = 섹션 1개)과 함께 쓸 수 없어서, 연도 탭을
// 클릭해 전환하는 방식으로 다시 만들었다.
//
// §25 — "탭은 클릭보다 스크롤로 넘어가는 방식으로" 요청에 따라, 프로필과
// 동일한 패턴으로 연도 탭도 registerSubSteps에 등록했다. 스크롤 한 번에
// 연도가 ±1씩 넘어가고, 마지막/처음 연도에서 한 번 더 스크롤하면 다음/이전
// 메인 섹션(대표 프로젝트/프로필)으로 넘어간다. 클릭 이동도 그대로 유지한다.
// ============================================================================

function YearContent({ entry }: { entry: TimelineEntry }) {
  const experiences = [...entry.experiences].sort((a, b) => a.order - b.order);
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    gsap.fromTo(el, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out", overwrite: "auto" });
  }, [entry.id]);

  return (
    <div ref={ref} className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
      {/* §81 — 타이포그래피 위계 재정비. 제목에 statement-title(최대
          82px, 원래 전체 화면용 히어로 문구 스타일)을 그대로 쓰다 보니
          바로 아래 설명·메시지·해시태그와 크기 차이가 너무 커서 뚝
          끊겨 보였다. 이 패널은 화면 전체가 아니라 2단 그리드의 절반
          폭이라 그 맥락에 맞는 크기로 다시 잡았다: 제목(가장 큼) → 설명·
          메시지(비슷하게 중간) → 해시태그(가장 작음) 순으로 자연스럽게
          줄어들도록 했다. */}
      <div>
        {/* §83 — 연도 탭 제목은 예전엔 한 줄짜리 input이라 줄바꿈을 아예
            입력할 수 없었다(관리자 편집기에서 textarea로 전환함). 여기서도
            whitespace-pre-line으로 입력한 줄바꿈을 그대로 반영한다. */}
        <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-korean leading-tight whitespace-pre-line">{entry.title}</h3>
        <p className="text-base md:text-lg text-ink-secondary leading-relaxed mb-4 max-w-md whitespace-pre-line">{entry.description}</p>
        <p className="text-lg md:text-xl font-medium border-l-2 accent-border pl-4 text-korean mb-4 whitespace-pre-line">{entry.message}</p>
        {experiences.length > 0 && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 font-en text-xs md:text-sm text-ink-muted">
            {experiences.slice(0, 3).map((t) => (
              <span key={t.id}>#{t.text.replace(/\s/g, "")}</span>
            ))}
          </div>
        )}
      </div>
      {/* §79 — 관리자 화면에는 "대표 영상(선택)" 업로드 항목이 예전부터
          있었는데, 공개 화면에는 heroImage만 그리고 있어서 영상을 올려도
          전혀 반영되지 않았다. 영상이 있으면 영상을(음소거 자동재생 루프),
          없으면 기존처럼 대표 이미지를 보여준다. */}
      <div className="relative aspect-[4/3] w-full max-h-[45dvh] overflow-hidden rounded-sm">
        {entry.heroVideo?.url ? (
          <video
            key={entry.id}
            src={mediaSrc(entry.heroVideo.url)}
            poster={entry.heroVideo.poster || (entry.heroImage?.url ? optimizedImageSrc(entry.heroImage.url, 960) : undefined)}
            className="h-full w-full object-cover"
            style={{ filter: "brightness(0.9) contrast(1.05)" }}
            autoPlay
            muted
            loop
            playsInline
          />
        ) : (
          <MediaFrame media={entry.heroImage} className="h-full w-full" />
        )}
      </div>
    </div>
  );
}

const DEFAULT_GROWTH_TITLE = "입사 이후, 역할은 이렇게 확장되었습니다.";

export function Timeline({ entries, title }: { entries: TimelineEntry[]; title?: string }) {
  const sorted = [...entries].sort((a, b) => a.order - b.order);
  const [active, setActive] = useState(0);
  const activeRef = useRef(active);
  const current = sorted[Math.min(active, Math.max(sorted.length - 1, 0))];

  useLayoutEffect(() => {
    activeRef.current = active;
  }, [active]);

  // §101 — "연도 탭을 넘기면 이전 연도 사진이 잠깐 보였다가 다음 연도
  // 사진으로 바뀐다"는 신고. 실제로는 버퍼링이 아니라, 탭을 눌렀을 때
  // 그제서야 새 사진을 요청하기 시작해서 다운로드되는 짧은 시간 동안
  // 이전 사진이 화면에 남아 있던 것이었다. 섹션이 마운트되는 시점에
  // 모든 연도의 대표 이미지(영상은 포스터 프레임)를 미리 백그라운드로
  // 내려받아 브라우저 캐시에 데워둔다 — 탭을 누를 때는 이미 캐시에
  // 있으므로 새로 받아올 필요가 없어 바로 바뀐다.
  useLayoutEffect(() => {
    sorted.forEach((entry) => {
      const url = entry.heroVideo?.poster || entry.heroImage?.url;
      if (!url || url.endsWith(".svg")) return;
      const img = new window.Image();
      img.src = optimizedImageSrc(url, 960);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorted.length]);

  useLayoutEffect(() => {
    const count = sorted.length;
    if (count === 0) return;
    const unregister = registerSubSteps("growth", {
      count,
      getActive: () => activeRef.current,
      // 위(프로필)에서 내려오면 첫 연도, 아래(대표 프로젝트)에서 올라오면
      // 마지막 연도부터 보여준다 — 프로필의 진입 방향 규칙과 동일하다.
      enter: (dir) => setActive(dir === 1 ? 0 : count - 1),
      setActive: (index) => setActive(Math.max(0, Math.min(count - 1, index))),
    });
    return unregister;
  }, [sorted.length]);

  return (
    <section id="growth" className="fp-section bg-bg py-6 md:py-8">
      <Container className="w-full">
        <Reveal holdAfterEnter>
          <p className="accent-text text-sm font-medium mb-3 tracking-wide">업무 성장과정</p>
        </Reveal>
        {/* §82 — 예전엔 이 제목이 코드에 그대로 박혀 있어 관리자 화면에서
            고칠 수 있는 곳이 없었다. growth_section의 title 값을 쓰고,
            값이 비어 있으면 기존 문구를 그대로 기본값으로 쓴다.
            whitespace-pre-line으로 관리자가 입력한 줄바꿈도 그대로 반영된다. */}
        <Reveal delay={0.05}>
          <h2 className="section-title font-bold mb-6 md:mb-8 text-korean whitespace-pre-line">
            {title?.trim() ? title : DEFAULT_GROWTH_TITLE}
          </h2>
        </Reveal>

        {sorted.length > 0 && (
          <>
            <div className="flex flex-wrap gap-2 mb-6 md:mb-8 border-b border-line pb-4">
              {sorted.map((entry, i) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setActive(i)}
                  className="font-en text-sm md:text-base font-medium px-1 pb-2 border-b-2 transition-colors duration-300"
                  style={{
                    borderColor: active === i ? "var(--accent)" : "transparent",
                    color: active === i ? "var(--color-text-primary)" : "var(--color-text-muted)",
                  }}
                >
                  {entry.year}
                </button>
              ))}
            </div>
            {/* §101 — key를 연도별 entry.id에 연결해, 탭을 넘길 때마다
                이 패널(텍스트 + 이미지/영상)을 완전히 새로 마운트한다.
                key가 없으면 이전 연도의 이미지 DOM을 그대로 재사용해서
                src만 바뀌는데, 이 경우 새 이미지가 로드되는 짧은 시간
                동안 이전 이미지가 화면에 남아있는 채로 보일 수 있다. */}
            {current && <YearContent key={current.id} entry={current} />}
          </>
        )}

        {sorted.length === 0 && <p className="text-ink-muted text-sm">등록된 성장 과정이 아직 없습니다.</p>}
      </Container>
    </section>
  );
}
