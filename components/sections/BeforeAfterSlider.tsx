"use client";

import { useState } from "react";
import { BeforeAfterPair } from "@/lib/types";
import { mediaSrc } from "@/lib/utils";
import { Reveal } from "@/components/motion/Reveal";
import { SlideCarousel } from "@/components/ui/SlideCarousel";
import { refreshScrollTrigger } from "@/lib/gsap";

// ============================================================================
// §58 — 프로젝트 상세 페이지에 "보정 전/후 비교"를 선택적으로(관리자가 사진을
// 등록한 프로젝트에서만) 넣어달라는 요청. 정적으로 두 장을 나란히 보여주는
// 대신, 가운데 경계선을 좌우로 드래그하면 보정 전/후가 실시간으로 겹쳐
// 드러나는 슬라이더로 만들어 "모션을 통해 확인"할 수 있게 했다. 실제 드래그
// 로직은 화면 전체를 덮는 투명한 range input(가로 드래그 = 슬라이더 이동)에
// 맡겨서 마우스/터치 모두 별도 이벤트 처리 없이 자연스럽게 동작한다.
// ============================================================================

function SliderItem({ pair }: { pair: BeforeAfterPair }) {
  const [pos, setPos] = useState(50);

  return (
    <div className="h-full flex flex-col">
      {/* §91 — §85에서는 "보정 후" 사진의 원본 비율대로 폭 전체(w-full)를
          채우는 박스를 썼는데, 그러면 슬라이드 한 장에 사진이 하나만
          크게 보였다. 이제는 갤러리(GalleryGrid)와 같은 방식으로 높이만
          고정하고 폭은 원본 비율대로 자동으로 정해지게(w-fit) 바꿔, 화면에
          여러 장이 동시에 보이면서도 세로로 긴 사진이 잘리지 않는다(비율
          유지).
          §92 — 높이를 h-72 등 고정값 대신 flex-1로 바꿨다. 아래 캡션
          텍스트가 차지하는 만큼을 제외한 "남은 공간"을 사진 박스가
          정확히 채우게 해서, 부모(SlideCarousel 트랙)가 정한 전체 높이를
          넘기지 않는다 — 넘치면 트랙에 원치 않는 세로 스크롤(세로
          슬라이드)이 생기기 때문이다. */}
      <div className="relative flex-1 min-h-0 w-fit overflow-hidden rounded-sm select-none bg-bg-soft">
        {/* §89 — 이 "보정 후" 이미지가 박스 폭을 결정한다(after는 h-full
            w-auto로 원본 비율을 유지, before는 absolute라 크기에 관여하지
            않음). 로드가 끝나 실제 크기가 확정되는 시점에 ScrollTrigger를
            다시 계산해야 등장 모션이 그 전 크기 기준으로 일찍 사라지지
            않는다. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mediaSrc(pair.after.url)}
          alt={pair.after.alt || "보정 후"}
          onLoad={refreshScrollTrigger}
          className="block h-full w-auto pointer-events-none"
          draggable={false}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mediaSrc(pair.before.url)}
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
      {/* §92 — 캡션 유무와 관계없이 항상 같은 높이(h-4)를 예약해둔다.
          그래야 캡션이 있는 항목과 없는 항목의 사진 박스 높이(위 flex-1)가
          서로 달라지지 않는다. line-clamp-1로 줄바꿈도 막아 높이가
          예약한 값을 넘지 않게 한다. */}
      <div className="shrink-0 h-4 mt-2">
        {pair.caption && !pair.caption.startsWith("[") && (
          <p className="text-xs text-ink-muted text-korean line-clamp-1">{pair.caption}</p>
        )}
      </div>
    </div>
  );
}

// §90 — 처음엔 "1단/2단"을 "슬라이드 한 장에 몇 개를 나란히 놓을지"로
// 이해해서 모델컷을 2개씩 축소해 나란히 놓았는데, 실제 의도는 그게
// 아니었다: "1단"과 "2단"은 위아래로 쌓인 두 개의 독립된 가로 슬라이드
// 줄(tier)을 뜻한다 — 1단(위)은 디테일컷 전용 줄, 2단(아래)은 모델컷
// 전용 줄이고, 각 줄 안에서는 사진이 예전과 똑같이 한 장씩 원본 크기로
// 나온다(줄여서 나란히 놓지 않는다). pair.category로 어느 줄에 들어갈지
// 정하고, 카테고리가 없는(기존) 데이터는 1단(디테일컷)으로 취급한다.
export function BeforeAfterSlider({ pairs }: { pairs: BeforeAfterPair[] }) {
  const sorted = [...pairs].sort((a, b) => a.order - b.order);
  if (sorted.length === 0) return null;

  const detailShots = sorted.filter((p) => (p.category ?? "detail") === "detail");
  const modelShots = sorted.filter((p) => p.category === "model");

  return (
    <Reveal>
      <h2 className="text-2xl md:text-3xl font-semibold mb-4 text-korean">보정 전·후</h2>
      {detailShots.length > 0 && (
        <div className={modelShots.length > 0 ? "mb-12" : undefined}>
          <p className="text-sm font-medium text-ink-secondary mb-3 text-korean">1단 · 디테일컷</p>
          <SlideCarousel
            items={detailShots}
            heightClassName="h-[312px] sm:h-[344px] md:h-[408px]"
            keyOf={(pair) => pair.id}
            renderItem={(pair) => <SliderItem pair={pair} />}
          />
        </div>
      )}
      {modelShots.length > 0 && (
        <div>
          <p className="text-sm font-medium text-ink-secondary mb-3 text-korean">2단 · 모델컷</p>
          <SlideCarousel
            items={modelShots}
            heightClassName="h-[312px] sm:h-[344px] md:h-[408px]"
            keyOf={(pair) => pair.id}
            renderItem={(pair) => <SliderItem pair={pair} />}
          />
        </div>
      )}
    </Reveal>
  );
}
