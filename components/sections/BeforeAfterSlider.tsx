"use client";

import { useState } from "react";
import { BeforeAfterPair } from "@/lib/types";
import { optimizedImageSrc } from "@/lib/utils";
import { Reveal } from "@/components/motion/Reveal";
import { refreshScrollTrigger } from "@/lib/gsap";

// ============================================================================
// §58 — 프로젝트 상세 페이지에 "보정 전/후 비교"를 선택적으로(관리자가 사진을
// 등록한 프로젝트에서만) 넣어달라는 요청. 정적으로 두 장을 나란히 보여주는
// 대신, 가운데 경계선을 좌우로 드래그하면 보정 전/후가 실시간으로 겹쳐
// 드러나는 슬라이더로 만들어 "모션을 통해 확인"할 수 있게 했다. 실제 드래그
// 로직은 화면 전체를 덮는 투명한 range input(가로 드래그 = 슬라이더 이동)에
// 맡겨서 마우스/터치 모두 별도 이벤트 처리 없이 자연스럽게 동작한다.
//
// §103 — 여러 장을 옆으로 스크롤하며 작게 훑어보는 갤러리(SlideCarousel)
// 방식에서, "대표 사진 한 장을 크게 보여주고 이전/다음 버튼으로 한 장씩
// 넘기는" 방식으로 완전히 바꿨다. 디테일컷/모델컷 구분(§90)도 없애고
// 전체를 하나의 순번 리스트로 합쳤다 — 상세 페이지 레이아웃 자체가
// 왼쪽엔 이 사진, 오른쪽엔 프로젝트 개요/제작 의도/기여도/Tools가 오는
// 2단 구성으로 바뀌면서, 왼쪽 칸을 여러 장 훑어보는 용도보다 "대표 사진
// 한 장 + 필요하면 다음 장"으로 쓰는 게 더 맞다는 판단.
//
// §104 — 사진이 칸 폭을 그대로 채워서 너무 크게 보인다는 피드백으로
// max-w를 둬서 크기를 한 단계 줄였다. 또한 "보정 전·후" 제목은 이
// 컴포넌트 안이 아니라 호출하는 page.tsx에서 2단 grid 바깥(위)에 따로
// 그리도록 뺐다 — 제목이 사진 칸 안에 있으면 오른쪽 텍스트 칸(프로젝트
// 개요 등)의 시작 위치가 "제목 아래"가 아니라 "사진 자체의 윗변"에
// 맞아야 한다는 요청과 어긋나기 때문에, 두 칸 모두 같은 지점(사진 윗변)
// 에서 시작하도록 제목을 grid 바깥으로 분리했다.
//
// §107 — 이전/다음 버튼을 사진 아래 텍스트 링크("‹ 이전"/"다음 ›")에서
// 사진 자체의 좌측 중앙/우측 중앙에 겹치는 원형 아이콘(‹ / ›)으로
// 옮겼다. 버튼을 CompareView보다 DOM상 뒤(형제 요소)에 둬서, 같은
// 스태킹 컨텍스트 안에서 항상 위에 그려지도록 했다 — 그래야 사진 전체를
// 덮는 투명 드래그용 range input보다 버튼 클릭이 우선 인식된다.
// ============================================================================

function CompareView({ pair }: { pair: BeforeAfterPair }) {
  const [pos, setPos] = useState(50);

  return (
    <div className="relative w-full overflow-hidden rounded-sm select-none bg-bg-soft">
      {/* §103 — 왼쪽 칸을 꽉 채우는 대표 사진이라 폭 기준(w-full h-auto)으로
          사진 원본 비율 그대로 크게 보여준다. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={optimizedImageSrc(pair.after.url, 1080)}
        alt={pair.after.alt || "보정 후"}
        onLoad={refreshScrollTrigger}
        className="block w-full h-auto pointer-events-none"
        draggable={false}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={optimizedImageSrc(pair.before.url, 1080)}
        alt={pair.before.alt || "보정 전"}
        className="absolute inset-0 h-full w-full object-cover pointer-events-none"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        draggable={false}
      />

      {/* 경계선 + 손잡이 */}
      <div
        className="absolute inset-y-0 w-0.5 bg-white/90 pointer-events-none"
        style={{ left: `${pos}%`, transform: "translateX(-50%)" }}
      />
      <div
        className="absolute top-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white text-black text-xs shadow-lg pointer-events-none"
        style={{ left: `${pos}%`, transform: "translate(-50%, -50%)" }}
      >
        ↔
      </div>

      <span className="absolute left-3 top-3 text-[11px] font-semibold tracking-wide text-white bg-black/55 rounded px-2 py-1 pointer-events-none">
        BEFORE
      </span>
      <span className="absolute right-3 top-3 text-[11px] font-semibold tracking-wide text-white bg-black/55 rounded px-2 py-1 pointer-events-none">
        AFTER
      </span>

      {/* 실제 드래그를 담당하는 투명 슬라이더 (마우스/터치 공용) */}
      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label="보정 전/후 비교 슬라이더"
        className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
      />
    </div>
  );
}

export function BeforeAfterSlider({ pairs }: { pairs: BeforeAfterPair[] }) {
  const sorted = [...pairs].sort((a, b) => a.order - b.order);
  const [index, setIndex] = useState(0);

  if (sorted.length === 0) return null;
  const current = sorted[Math.min(index, sorted.length - 1)];

  function go(dir: 1 | -1) {
    setIndex((i) => (i + dir + sorted.length) % sorted.length);
  }

  return (
    <Reveal>
      {/* §104 — 칸 폭을 그대로 채우면 너무 커 보여서 max-w로 한 단계
          줄였다. */}
      <div className="max-w-md">
        {/* §107 — 이전/다음 버튼을 사진 좌우 중앙에 겹쳐 그리기 위한
            래퍼. CompareView 뒤(형제)에 버튼을 둬서 항상 사진 위에
            그려지도록 한다. */}
        <div className="relative">
          {/* key로 pair.id를 줘서 사진이 바뀔 때마다 요소를 새로 그린다 —
              이전 사진이 화면에 남아있다가 다음 사진으로 바뀌는
              문제(§101)와 같은 이유. */}
          <CompareView key={current.id} pair={current} />

          {sorted.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="이전 사진"
                className="absolute left-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white text-lg leading-none hover:bg-black/75 transition-colors duration-300"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="다음 사진"
                className="absolute right-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white text-lg leading-none hover:bg-black/75 transition-colors duration-300"
              >
                ›
              </button>
            </>
          )}
        </div>

        <div className="h-4 mt-2">
          {current.caption && !current.caption.startsWith("[") && (
            <p className="text-xs text-ink-muted text-korean line-clamp-1">{current.caption}</p>
          )}
        </div>

        {sorted.length > 1 && (
          <div className="mt-1 text-center">
            <span className="font-en text-xs text-ink-muted tabular-nums">
              {index + 1} / {sorted.length}
            </span>
          </div>
        )}
      </div>
    </Reveal>
  );
}
