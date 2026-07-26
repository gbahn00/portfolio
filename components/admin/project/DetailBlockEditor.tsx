"use client";

import { v4 as uuid } from "uuid";
import { ProjectDetailBlock, MediaRef, BeforeAfterPair } from "@/lib/types";
import { MediaUpload } from "@/components/admin/MediaUpload";
import { ConfirmButton } from "@/components/admin/ConfirmButton";

const BLOCK_LABELS: Record<string, string> = {
  overview: "프로젝트 개요", purpose: "제작 의도", role: "기여도", tools: "Tools",
};

export function DetailBlockEditor({
  block, onChange, onRemove, onMove, canMoveUp, canMoveDown,
}: {
  block: ProjectDetailBlock;
  onChange: (b: ProjectDetailBlock) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  function set<K extends keyof ProjectDetailBlock>(key: K, value: ProjectDetailBlock[K]) {
    onChange({ ...block, [key]: value });
  }

  function addImage(m: MediaRef | undefined) {
    if (!m) return;
    set("images", [...block.images, m]);
  }
  function removeImage(idx: number) {
    set("images", block.images.filter((_, i) => i !== idx));
  }
  function addVideo(m: MediaRef | undefined) {
    if (!m) return;
    set("videos", [...block.videos, m]);
  }
  function removeVideo(idx: number) {
    set("videos", block.videos.filter((_, i) => i !== idx));
  }
  function addComparePair() {
    const pair: BeforeAfterPair = {
      id: uuid(), before: { url: "", kind: "image" }, after: { url: "", kind: "image" }, order: block.compareImages.length,
    };
    set("compareImages", [...block.compareImages, pair]);
  }
  function updatePair(id: string, patch: Partial<BeforeAfterPair>) {
    set("compareImages", block.compareImages.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }
  function removePair(id: string) {
    set("compareImages", block.compareImages.filter((p) => p.id !== id));
  }
  function addMetric() {
    set("metrics", [...block.metrics, { id: uuid(), label: "", value: "" }]);
  }
  function updateMetric(id: string, patch: Partial<{ label: string; value: string }>) {
    set("metrics", block.metrics.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }
  function removeMetric(id: string) {
    set("metrics", block.metrics.filter((m) => m.id !== id));
  }

  return (
    <div className="rounded-md border border-neutral-800 p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-neutral-500">{BLOCK_LABELS[block.key] || "사용자 지정 항목"}</span>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-neutral-400">
            <input type="checkbox" checked={block.visible} onChange={(e) => set("visible", e.target.checked)} /> 노출
          </label>
          <button onClick={() => onMove(-1)} disabled={!canMoveUp} className="text-neutral-400 disabled:opacity-30 text-xs px-1">↑</button>
          <button onClick={() => onMove(1)} disabled={!canMoveDown} className="text-neutral-400 disabled:opacity-30 text-xs px-1">↓</button>
          <ConfirmButton label="항목 삭제" onConfirm={onRemove} />
        </div>
      </div>

      <input
        value={block.title}
        onChange={(e) => set("title", e.target.value)}
        placeholder={BLOCK_LABELS[block.key] || "항목 제목"}
        className="w-full mb-2 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm font-medium text-neutral-100 outline-none focus:border-orange-500"
      />
      <textarea
        value={block.body}
        onChange={(e) => set("body", e.target.value)}
        rows={3}
        placeholder="내용"
        className="w-full mb-3 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-orange-500"
      />

      <details className="mb-2">
        <summary className="text-xs text-neutral-400 cursor-pointer mb-2">이미지 ({block.images.length})</summary>
        <div className="grid grid-cols-2 gap-3 mb-2">
          {block.images.map((img, idx) => (
            <div key={idx} className="relative">
              <MediaUpload label={`이미지 ${idx + 1}`} value={img} onChange={(m) => { if (!m) removeImage(idx); else set("images", block.images.map((im, i) => (i === idx ? m : im))); }} />
            </div>
          ))}
        </div>
        <MediaUpload label="이미지 추가" value={undefined} onChange={addImage} />
      </details>

      <details className="mb-2">
        <summary className="text-xs text-neutral-400 cursor-pointer mb-2">영상 ({block.videos.length})</summary>
        {block.videos.map((v, idx) => (
          <MediaUpload key={idx} label={`영상 ${idx + 1}`} value={v} onChange={(m) => { if (!m) removeVideo(idx); else set("videos", block.videos.map((vv, i) => (i === idx ? m : vv))); }} accept="video/*" />
        ))}
        <MediaUpload label="영상 추가" value={undefined} onChange={addVideo} accept="video/*" />
      </details>

      <details className="mb-2">
        <summary className="text-xs text-neutral-400 cursor-pointer mb-2">보정 전후 비교 ({block.compareImages.length})</summary>
        {block.compareImages.map((pair) => (
          <div key={pair.id} className="grid grid-cols-2 gap-3 mb-3 border border-neutral-800 rounded p-3">
            <MediaUpload label="보정 전" value={pair.before} onChange={(m) => m && updatePair(pair.id, { before: m })} />
            <MediaUpload label="보정 후" value={pair.after} onChange={(m) => m && updatePair(pair.id, { after: m })} />
            <div className="col-span-2 flex justify-end">
              <ConfirmButton label="이 비교쌍 삭제" onConfirm={() => removePair(pair.id)} />
            </div>
          </div>
        ))}
        <button onClick={addComparePair} className="text-xs rounded-md border border-dashed border-neutral-700 px-3 py-1.5 text-neutral-300 hover:border-orange-500">
          + 보정 전후 비교 추가
        </button>
      </details>

      <details>
        <summary className="text-xs text-neutral-400 cursor-pointer mb-2">성과 수치 ({block.metrics.length})</summary>
        {block.metrics.map((m) => (
          <div key={m.id} className="flex gap-2 mb-2">
            <input value={m.label} onChange={(e) => updateMetric(m.id, { label: e.target.value })} placeholder="항목명" className="flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-100 outline-none focus:border-orange-500" />
            <input value={m.value} onChange={(e) => updateMetric(m.id, { value: e.target.value })} placeholder="값" className="flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-100 outline-none focus:border-orange-500" />
            <button onClick={() => removeMetric(m.id)} className="text-xs text-red-400">삭제</button>
          </div>
        ))}
        <button onClick={addMetric} className="text-xs rounded-md border border-dashed border-neutral-700 px-3 py-1.5 text-neutral-300 hover:border-orange-500">
          + 수치 추가
        </button>
      </details>
    </div>
  );
}
