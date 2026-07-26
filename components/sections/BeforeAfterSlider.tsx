"use client";

import { useState } from "react";
import { BeforeAfterPair } from "@/lib/types";
import { mediaSrc } from "@/lib/utils";
import { Reveal } from "@/components/motion/Reveal";

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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mediaSrc(pair.after.url)}
          alt={pair.after.alt || "보정 후"}
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

export function BeforeAfterSlider({ pairs }: { pairs: BeforeAfterPair[] }) {
  const sorted = [...pairs].sort((a, b) => a.order - b.order);
  if (sorted.length === 0) return null;

  return (
    <Reveal>
      <h2 className="text-2xl md:text-3xl font-semibold mb-4 text-korean">보정 전·후</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {sorted.map((pair) => (
          <SliderItem key={pair.id} pair={pair} />
        ))}
      </div>
    </Reveal>
  );
}
