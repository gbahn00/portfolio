"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
// 크게 나와 사진마다 "체감 크기"가 들쭉날쭉했다. 그래서 폭·높이를 동시에
// 상한으로 걸어봤는데(예: 최대 420×480), 상한 박스 자체가 세로로 긴
// 모양이다 보니 가로로 넓은 사진은 폭 상한에 먼저 걸려 세로 여유 공간을
// 다 못 쓰고 작게 나오는 문제가 그대로 남았다.
//
// §121 — "면적(체감 크기)을 맞춘다"는 관점으로 접근을 바꿨었는데("항상
// 같은 목표 면적을 채우는 폭·높이 계산"), §127에서 "오른쪽 프로젝트
// 개요~Tools를 다 작성했을 때의 세로 크기에 사진 세로를 맞춰달라(가로는
// 그에 맞게 비율대로 조정돼도 된다)"는 요청을 다시 받아 기준을
// 바꿨다 — 목표 면적이 아니라 "텍스트 칸의 실제 렌더링 높이"를 그대로
// 사진 높이로 쓰고, 폭은 사진 원본 비율 그대로 계산한다(찌그러짐/크롭
// 없음). 다만 사진이 아주 가로로 넓은 비율이면 폭이 텍스트 칸 옆
// 공간을 벗어날 수 있어, 안전하게 폭 상한(MAX_W)을 두고 넘으면 그
// 상한에 맞춰 높이도 비율대로 함께 줄어들게 한다.
//
// §123 — "처음 볼 땐 비율이 맞는데 새로고침하면 비율이 바뀐다"는 버그.
// 이 페이지는 서버에서 미리 렌더링돼(img 태그가 이미 src까지 박힌 채로)
// 브라우저에 도착한다. 사진을 한 번도 안 봤을 때는 브라우저가 실제로
// 다운로드하는 동안 시간이 걸려서, 그 사이 React가 하이드레이션을 마치고
// onLoad 리스너를 붙인 "다음"에 로드가 끝나 정상적으로 onNaturalSize가
// 불린다. 그런데 새로고침해서 사진이 브라우저 캐시에 이미 있으면, 이미지
// 로드가 매우 빨리(때로는 하이드레이션보다도 먼저) 끝나버려 onLoad 이벤트
// 자체를 놓친다. 마운트 시점에 img.complete를 직접 확인해서, 이미 로드가
// 끝나 있으면 onLoad를 기다리지 않고 그 자리에서 바로 계산하도록
// 보강했다(이 보강은 계속 유효하다).
//
// §128 — "새로고침하면 사진 크기가 이상한 크기로 바뀌었다가 원래대로
// 돌아온다"는 버그 제보. 1차로 §123 보강을 useEffect에서 useLayoutEffect로
// 바꿔봤지만(브라우저가 paint하기 전에 동기적으로 값을 확정) 실제
// 화면 녹화로 확인해보니 여전히 잘못된 크기가 잠깐 보였다 — 이유는
// useLayoutEffect가 "React가 하이드레이션을 끝낸 뒤"에만 도움이 되기
// 때문이다. 이 페이지는 서버에서 미리 렌더링되는데, 서버는 텍스트 칸의
// 실제 렌더링 높이도 사진의 원본 비율도 알 수 없으므로 서버가 만든
// 최초 HTML 자체에 이미 DEFAULT_HEIGHT 기준의 "짐작 박스" 크기가 박혀
// 있다. 브라우저는 이 HTML을 받는 즉시(자바스크립트가 실행되기도
// 전에) 그 짐작 박스 크기로 먼저 그려버리고, 그 다음에야 자바스크립트가
// 실행되어 진짜 크기로 고쳐진다 — 이 "짐작 박스로 먼저 그려지는 순간"
// 자체가 사용자 눈에 보이는 것이었다.
//
// 그래서 접근을 바꿨다: 진짜 크기(텍스트 높이 + 사진 원본 비율)를 둘 다
// 알기 전까지는 사진 내용 자체를 투명(opacity: 0)하게 감춰서, "잘못된
// 크기의 사진"이 아예 보이지 않게 한다. 두 값이 모두 확정되면(ready)
// 그제서야 최종 크기로 반짝 나타난다 — 화면에 보이는 사진은 항상 최종
// 크기 하나뿐이고, 크기가 바뀌는 과정 자체는 보이지 않는다.
// ============================================================================

const DEFAULT_HEIGHT = 480; // 텍스트 칸 높이를 아직 측정하기 전(최초 렌더) 기준값
const MAX_W = 640; // 사진이 가로로 아주 넓을 때 옆 텍스트 칸을 침범하지 않도록 하는 안전 상한(단일 슬라이더 기본값)

function computeBoxFromHeight(naturalWidth: number, naturalHeight: number, targetHeight: number, maxWidth: number) {
  const ratio = naturalWidth / naturalHeight;
  let h = targetHeight;
  let w = h * ratio;
  if (w > maxWidth) {
    w = maxWidth;
    h = w / ratio;
  }
  return { w: Math.round(w), h: Math.round(h) };
}

function CompareView({ pair, onNaturalSize }: { pair: BeforeAfterPair; onNaturalSize: (w: number, h: number) => void }) {
  const [pos, setPos] = useState(50);
  const afterImgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setPos(50);
  }, [pair.id]);

  // §123/§128 — 마운트/사진 교체 시점에 이미지가 이미 로드 완료(캐시 등)
  // 상태면 onLoad 이벤트가 아예 안 오므로, complete 여부를 직접 확인해
  // 보정한다. useLayoutEffect라 paint 전에 동기적으로 실행되므로, 캐시된
  // 이미지에서 "잘못된 크기가 잠깐 보였다가 되돌아오는" 점프가 없다.
  useLayoutEffect(() => {
    const img = afterImgRef.current;
    if (img && img.complete && img.naturalWidth && img.naturalHeight) {
      onNaturalSize(img.naturalWidth, img.naturalHeight);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pair.id]);

  function handleAfterLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    refreshScrollTrigger();
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) onNaturalSize(img.naturalWidth, img.naturalHeight);
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={afterImgRef}
        src={optimizedImageSrc(pair.after.url, 1080)}
        alt={pair.after.alt || "보정 후"}
        onLoad={handleAfterLoad}
        className="absolute inset-0 h-full w-full object-cover pointer-events-none"
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
    </>
  );
}

export function BeforeAfterSlider({
  pairs,
  targetHeightPx,
  maxWidthPx,
}: {
  pairs: BeforeAfterPair[];
  targetHeightPx?: number;
  // §129 — "디테일컷 | 모델컷 | 텍스트" 3단 구조에서는 사진 칸이 두 개가
  // 되므로, 단일 슬라이더 기본 상한(MAX_W=640)을 그대로 쓰면 두 칸 폭을
  // 합친 게 텍스트 칸을 밀어낼 수 있다. 이럴 때 부모(BeforeAfterWithText)가
  // 더 좁은 상한을 넘겨줄 수 있게 했다. 안 넘기면 기존 MAX_W를 그대로 쓴다.
  maxWidthPx?: number;
}) {
  const sorted = [...pairs].sort((a, b) => a.order - b.order);
  const [index, setIndex] = useState(0);
  // §127 — 사진의 실제 원본 가로세로 비율(로드되면 채워진다).
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);

  if (sorted.length === 0) return null;
  const current = sorted[Math.min(index, sorted.length - 1)];

  function go(dir: 1 | -1) {
    setIndex((i) => (i + dir + sorted.length) % sorted.length);
  }

  function handleNaturalSize(nw: number, nh: number) {
    setNatural({ w: nw, h: nh });
  }

  // §127 — 목표 높이는 항상 부모(BeforeAfterWithText)가 실측해서 넘겨주는
  // targetHeightPx를 그대로 쓴다. 사진 원본 비율(natural)을 아직 모르는
  // 아주 짧은 순간(최초 렌더)에는 DEFAULT_HEIGHT 기준의 임시 박스를 쓰다가,
  // 로드/캐시 확인이 끝나는 즉시 실제 비율로 갱신된다.
  const effectiveHeight = targetHeightPx ?? DEFAULT_HEIGHT;
  const effectiveMaxW = maxWidthPx ?? MAX_W;
  const box = natural
    ? computeBoxFromHeight(natural.w, natural.h, effectiveHeight, effectiveMaxW)
    : { w: Math.round(Math.min(effectiveHeight * 0.75, effectiveMaxW)), h: Math.round(effectiveHeight) };

  // §128 — 텍스트 높이(targetHeightPx)와 사진 원본 비율(natural)이 둘 다
  // 확정되기 전까지는 아직 "짐작 박스" 크기라는 뜻이므로, 이 순간에는
  // 사진 내용을 감춘다(레이아웃 공간만 차지, 눈에는 안 보임). 두 값이
  // 다 준비되면(ready) 바로 그 최종 크기로만 나타난다.
  const ready = natural !== null && targetHeightPx !== undefined;

  // §122 — "사진이 아주 작아졌다"는 버그. width를 `min(${box.w}px, 100%)`
  // 문자열로 줬는데, 이 박스의 조상이 flex 아이템(width: auto, 즉
  // shrink-to-fit)이라 브라우저가 "이 아이템이 원래 얼마나 넓어야
  // 하는지" 먼저 계산해야 한다. 그 계산 도중(아직 실제 폭이 정해지지
  // 않은 상태)에는 percentage 값(위 100%)의 기준이 되는 "부모 폭"이
  // 아직 없어서(undefined) 100%가 0으로 취급되고, min(360px, 0) = 0이
  // 돼버려 박스 전체가 거의 0 크기로 찌그러졌다. width와 max-width를
  // min() 함수로 합치지 않고 별도 속성으로 나누면(width: 고정 px,
  // max-width: 100%) 이 계산 단계에서도 width가 항상 명확한 값(px)으로
  // 남아 shrink-to-fit 조상이 올바른 크기를 계산할 수 있다.
  return (
    <>
      <div style={{ width: `${box.w}px`, maxWidth: "100%" }}>
        {/* §107 — 이전/다음 버튼을 사진 좌우 중앙에 겹쳐 그리기 위한
            래퍼. CompareView 뒤(형제)에 버튼을 둬서 항상 사진 위에
            그려지도록 한다. */}
        <div
          className="relative overflow-hidden rounded-sm select-none bg-bg-soft"
          style={{
            aspectRatio: `${box.w} / ${box.h}`,
            opacity: ready ? 1 : 0,
            transition: ready ? "opacity 200ms ease-out" : "none",
          }}
        >
          {/* §108 — key를 주지 않아 같은 DOM을 유지한 채 사진(src)만
              바뀐다("화면이 새로고침되는 느낌" 방지). */}
          <CompareView pair={current} onNaturalSize={handleNaturalSize} />

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
