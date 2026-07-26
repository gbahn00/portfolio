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
    <div>
      {/* §85 — 예전엔 4:3로 박스를 고정해두고 object-cover로 채웠는데,
          세로로 긴 인물/모델 사진을 넣으면 얼굴이나 발이 잘려나가는
          문제가 있었다. 이제는 박스 크기 자체를 "보정 후" 사진의 원본
          비율에 맞춰(자연스러운 크기로) 잡고, "보정 전" 사진은 그 박스에
          꼭 맞게 겹쳐 올린다 — 보정 전/후는 같은 원본 사진이라 두 비율이
          거의 항상 같으므로 실제로는 잘림이 생기지 않는다. */}
      <div className="relative w-full overflow-hidden rounded-sm select-none bg-bg-soft">
        {/* §89 — 이 "보정 후" 이미지가 박스 높이를 결정한다(after는
            일반 흐름, before는 absolute라 높이에 관여하지 않음). 로드가
            끝나 실제 높이가 확정되는 시점에 ScrollTrigger를 다시
            계산해야 등장 모션이 그 전 높이 기준으로 일찍 사라지지 않는다. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mediaSrc(pair.after.url)}
          alt={pair.after.alt || "보정 후"}
          onLoad={refreshScrollTrigger}
          className="block w-full h-auto pointer-events-none"
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
      {pair.caption && !pair.caption.startsWith("[") && (
        <p className="text-xs text-ink-muted mt-2 text-korean">{pair.caption}</p>
      )}
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
            columns={1}
            gapClassName="gap-6"
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
            columns={1}
            gapClassName="gap-6"
            keyOf={(pair) => pair.id}
            renderItem={(pair) => <SliderItem pair={pair} />}
          />
        </div>
      )}
    </Reveal>
  );
}
