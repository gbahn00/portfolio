"use client";

import { useState } from "react";
import { RetouchHighlight } from "@/lib/types";
import { mediaSrc } from "@/lib/utils";
import { Reveal } from "@/components/motion/Reveal";

// ============================================================================
// §61 — 보정 전(before) 사진이 없이 보정 후 사진만 있는 프로젝트를 위한
// 구조. 사진 위 특정 위치에 표시된 점을 누르면(모션과 함께) 그 부분에서
// 어떤 보정을 했는지 설명이 뜬다 — 원본 비교 없이도 "어디를, 어떻게
// 보정했는지"를 보여줄 수 있다.
// ============================================================================

function HighlightImage({ highlight }: { highlight: RetouchHighlight }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const points = [...highlight.points].sort((a, b) => a.order - b.order).filter((p) => p.label);

  return (
    <div className="relative w-full aspect-[4/3] overflow-hidden rounded-sm select-none bg-bg-soft">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={mediaSrc(highlight.image.url)}
        alt={highlight.image.alt || "보정 후 사진"}
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />

      {points.map((p, i) => {
        const active = activeId === p.id;
        return (
          <div
            key={p.id}
            className="absolute"
            style={{ left: `${p.x}%`, top: `${p.y}%`, transform: "translate(-50%, -50%)" }}
          >
            {/* 툴팁: 클릭/호버 시 위쪽에 페이드+이동으로 등장 */}
            <div
              className="absolute left-1/2 bottom-full mb-2.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/85 px-3 py-1.5 text-xs text-white text-korean transition-all duration-200"
              style={{
                opacity: active ? 1 : 0,
                transform: `translate(-50%, ${active ? "0px" : "4px"})`,
                pointerEvents: "none",
              }}
            >
              {p.label}
            </div>

            <button
              type="button"
              onClick={() => setActiveId(active ? null : p.id)}
              onMouseEnter={() => setActiveId(p.id)}
              onMouseLeave={() => setActiveId((cur) => (cur === p.id ? null : cur))}
              aria-label={p.label}
              className="relative flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold text-white shadow-lg"
              style={{ background: "var(--accent)" }}
            >
              {/* 펄스 모션 — 눌러볼 수 있다는 걸 자연스럽게 알려준다 */}
              <span
                className="absolute inset-0 rounded-full animate-ping"
                style={{ background: "var(--accent)", opacity: active ? 0 : 0.5 }}
              />
              <span className="relative">{i + 1}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function RetouchHighlights({ highlights }: { highlights: RetouchHighlight[] }) {
  const sorted = [...highlights].sort((a, b) => a.order - b.order).filter((h) => h.image?.url);
  if (sorted.length === 0) return null;

  return (
    <Reveal>
      <h2 className="text-2xl md:text-3xl font-semibold mb-2 text-korean">보정 포인트</h2>
      <p className="text-sm text-ink-muted mb-4 text-korean">점을 눌러 어떤 부분을 보정했는지 확인하세요.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {sorted.map((h) => (
          <HighlightImage key={h.id} highlight={h} />
        ))}
      </div>
    </Reveal>
  );
}
