"use client";

import { useEffect, useState } from "react";
import { BeforeAfterPair } from "@/lib/types";
import { optimizedImageSrc } from "@/lib/utils";
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
//
// §108 — 이전/다음을 누르면 "화면이 새로고침되는 느낌"이 든다는 피드백.
// 원인은 CompareView에 key={pair.id}를 줘서 사진을 넘길 때마다 이
// 컴포넌트 전체(사진 두 장, 경계선, BEFORE/AFTER 라벨, 드래그용 input)를
// 통째로 지웠다가 새로 그렸기 때문이다 — DOM이 통째로 사라졌다 다시
// 생기니 그 사이 배경색만 잠깐 보이며 "페이지가 갱신되는" 것처럼
// 느껴진다. key를 없애 같은 DOM을 그대로 유지하고 <img>의 src만
// 바꾸도록 했다 — 그러면 사진만 자연스럽게 바뀐다. 대신 좌우 비교
// 슬라이더 위치(pos)는 사진이 바뀔 때마다 가운데(50)로 리셋해야 하므로
// pair.id가 바뀔 때 별도 effect로 초기화한다.
//
// §115 — "사진은 첨부한 원본 비율 그대로(이전과 동일하게), 대신 옆
// 텍스트(프로젝트 개요~Tools)를 사진의 세로 크기에 맞춰달라"는 요청으로
// §111~114의 "사진을 텍스트/고정 비율에 맞추는" 방향을 되돌렸다. 사진은
// 다시 원본 비율 그대로(after 이미지가 일반 흐름에 놓여 폭 기준으로
// 자연스럽게 세로 크기가 정해짐) 보여주고, 텍스트 칸의 높이를 사진에
// 맞추는 쪽은 components/sections/BeforeAfterWithText.tsx에서 사진 칸의
// 실제 렌더링 높이를 측정해 텍스트 칸에 적용한다.
//
// §119 — 폭 하나만 고정(max-w)하고 높이는 원본 비율대로 자유롭게
// 두었더니, 가로로 넓은 사진은 얇고 짧게, 세로로 긴(인물) 사진은 아주
// 크게 나와 사진마다 "체감 크기"가 들쭉날쭉했다("어떤 건 작고 어떤 건
// 평균 크기"). 사진을 자르거나 늘리지 않으면서(원본 비율 유지) 크기를
// 고르게 맞추려면 폭과 높이를 동시에 상한선으로 잡아야 한다 — 가로 사진은
// 폭 기준으로, 세로 사진은 높이 기준으로 알아서 줄어들어(object-fit:
// contain과 같은 원리) 어떤 비율이든 같은 박스 안에 들어오게 된다.
// ============================================================================

function CompareView({ pair }: { pair: BeforeAfterPair }) {
  const [pos, setPos] = useState(50);

  useEffect(() => {
    setPos(50);
  }, [pair.id]);

  return (
    <div className="relative w-full overflow-hidden rounded-sm select-none bg-bg-soft">
      {/* §119 — width/height 둘 다 auto로 두고 max-width·max-height를
          동시에 걸어, 사진 방향(가로/세로)에 상관없이 원본 비율 그대로
          같은 박스 안에 들어오는 크기로 자동으로 줄어든다(자르거나
          늘리지 않음). */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={optimizedImageSrc(pair.after.url, 1080)}
        alt={pair.after.alt || "보정 후"}
        onLoad={refreshScrollTrigger}
        className="block w-auto h-auto max-w-[min(420px,100%)] max-h-[480px] pointer-events-none"
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
    <>
      {/* §119 — 실제 크기 상한은 이제 CompareView 내부 img의
          max-w/max-h가 정하므로, 바깥 래퍼는 그보다 살짝 넉넉한 값으로만
          잡아 캡션/이전·다음 카운터가 사진 폭을 넘어서지 않게 한다. */}
      <div className="max-w-[420px]">
        {/* §107 — 이전/다음 버튼을 사진 좌우 중앙에 겹쳐 그리기 위한
            래퍼. CompareView 뒤(형제)에 버튼을 둬서 항상 사진 위에
            그려지도록 한다. */}
        <div className="relative">
          {/* §108 — key를 주지 않아 같은 DOM을 유지한 채 사진(src)만
              바뀐다("화면이 새로고침되는 느낌" 방지). */}
          <CompareView pair={current} />

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
    </>
  );
}
