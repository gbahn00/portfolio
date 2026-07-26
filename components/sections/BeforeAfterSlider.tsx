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
    // §96 — "사진 하나만 보이고 나머지는 큰 빈칸 뒤에 나온다"는 신고가
    // inline-block 전환(§94) 이후에도 재현됐다. 원인은 이 항목이
    // flex-col(§92, box를 flex-1로 남은 높이만큼 늘리는 방식)이었던 것 —
    // 중첩된 flex 컨테이너가 폭을 계산할 때 일부 브라우저에서 "내용
    // 크기만큼만"이 아니라 "가능한 최대 폭"으로 늘어나는 경우가 있었다.
    // flex를 완전히 걷어내고 GalleryGrid와 똑같이 "고정 높이 박스 + 그
    // 아래 캡션"을 평범한 블록으로 쌓는 구조로 바꿔, 폭 계산이 오직
    // w-fit 박스 하나에만 좌우되게 했다.
    <div>
      <div className="relative h-72 sm:h-80 md:h-96 w-fit overflow-hidden rounded-sm select-none bg-bg-soft">
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
          그래야 캡션이 있는 항목과 없는 항목의 전체 높이가 서로 달라지지
          않는다(트랙 높이를 box 고정 높이 + 이 여백에 맞춰뒀다).
          line-clamp-1로 줄바꿈도 막아 높이가 예약한 값을 넘지 않게 한다.
          §93 — max-w를 걸어두지 않으면 캡션 글자 수가 사진 폭보다 길 때
          이 캡션 텍스트의 "내용 기준 폭"이 항목 전체 폭(w-fit) 계산에
          끼어들어 사진보다 항목이 넓어지고, 그만큼 사진 옆에 빈 공간이
          생길 수 있다. 사진 폭을 넘지 않도록 상한을 걸어 항상 캡션이
          사진 폭 안에서만 잘리게(ellipsis) 했다. */}
      <div className="h-4 mt-2 max-w-[200px] sm:max-w-[240px] md:max-w-[280px]">
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
      {/* §98 — "1단 · 디테일컷" / "2단 · 모델컷" 라벨 텍스트만 없애달라는
          요청. 두 줄(디테일컷/모델컷)로 나누는 구조 자체는 그대로 두고,
          화면에 보이던 소제목 문구만 제거했다. */}
      {detailShots.length > 0 && (
        <div className={modelShots.length > 0 ? "mb-12" : undefined}>
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
