"use client";

import { useRef } from "react";
import { v4 as uuid } from "uuid";
import { RetouchHighlight, RetouchPoint } from "@/lib/types";
import { MediaUpload } from "@/components/admin/MediaUpload";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { mediaSrc } from "@/lib/utils";

// §61 — 보정 전 사진이 없을 때 쓰는 대안 편집기. 사진을 올리고 그 위를
// 클릭하면 클릭한 위치(%)에 점이 찍히고, 그 점마다 무엇을 보정했는지
// 짧은 설명을 입력한다.
export function RetouchHighlightEditor({
  highlight,
  onChange,
  onRemove,
}: {
  highlight: RetouchHighlight;
  onChange: (h: RetouchHighlight) => void;
  onRemove: () => void;
}) {
  const imgRef = useRef<HTMLImageElement>(null);

  function set<K extends keyof RetouchHighlight>(key: K, value: RetouchHighlight[K]) {
    onChange({ ...highlight, [key]: value });
  }

  function addPointAt(e: React.MouseEvent<HTMLDivElement>) {
    const el = imgRef.current;
    if (!el || !highlight.image?.url) return;
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    const point: RetouchPoint = {
      id: uuid(),
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
      label: "",
      order: highlight.points.length,
    };
    set("points", [...highlight.points, point]);
  }

  function updatePoint(id: string, patch: Partial<RetouchPoint>) {
    set("points", highlight.points.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }
  function removePoint(id: string) {
    set("points", highlight.points.filter((p) => p.id !== id).map((p, i) => ({ ...p, order: i })));
  }

  return (
    <div className="rounded-md border border-neutral-800 p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-neutral-500">보정 포인트 사진</span>
        <ConfirmButton label="이 사진 삭제" onConfirm={onRemove} />
      </div>

      <MediaUpload label="사진 (보정 후)" value={highlight.image} onChange={(m) => m && set("image", m)} />

      {highlight.image?.url ? (
        <div className="mt-3">
          <p className="text-xs text-neutral-500 mb-2">사진 위를 클릭해서 보정한 위치에 점을 찍으세요.</p>
          <div className="relative inline-block cursor-crosshair" onClick={addPointAt}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={mediaSrc(highlight.image.url)}
              alt=""
              className="max-w-full max-h-80 rounded-md select-none"
              draggable={false}
            />
            {highlight.points.map((p, i) => (
              <div
                key={p.id}
                onClick={(e) => e.stopPropagation()}
                className="absolute flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-semibold text-white shadow"
                style={{ left: `${p.x}%`, top: `${p.y}%`, transform: "translate(-50%, -50%)" }}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-neutral-600 mt-2">사진을 먼저 업로드하면 점을 찍을 수 있습니다.</p>
      )}

      <div className="mt-3 space-y-2">
        {highlight.points.map((p, i) => (
          <div key={p.id} className="flex items-center gap-2">
            <span className="text-xs text-neutral-500 w-5 shrink-0 text-center">{i + 1}</span>
            <input
              value={p.label}
              onChange={(e) => updatePoint(p.id, { label: e.target.value })}
              placeholder="이 위치에서 어떤 보정을 했는지 (예: 피부 톤 보정)"
              className="flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-100 outline-none focus:border-orange-500"
            />
            <button onClick={() => removePoint(p.id)} className="text-xs text-red-400 px-1">삭제</button>
          </div>
        ))}
        {highlight.points.length === 0 && <p className="text-xs text-neutral-600">아직 찍은 점이 없습니다.</p>}
      </div>
    </div>
  );
}
