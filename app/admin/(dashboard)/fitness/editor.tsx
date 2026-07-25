"use client";

import { useState } from "react";
import { v4 as uuid } from "uuid";
import { FitnessSection } from "@/lib/types";
import { TextField, SelectField } from "@/components/admin/fields";
import { SaveBar } from "@/components/admin/SaveBar";
import { ConfirmButton } from "@/components/admin/ConfirmButton";

export function FitnessEditor({ initial }: { initial: FitnessSection }) {
  const [data, setData] = useState<FitnessSection>(initial);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const points = [...data.points].sort((a, b) => a.order - b.order);

  function set<K extends keyof FitnessSection>(key: K, value: FitnessSection[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }
  function updatePoint(id: string, patch: Partial<(typeof points)[number]>) {
    set("points", points.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }
  function moveP(id: string, dir: -1 | 1) {
    const idx = points.findIndex((p) => p.id === id);
    const t = idx + dir;
    if (t < 0 || t >= points.length) return;
    const copy = [...points];
    [copy[idx], copy[t]] = [copy[t], copy[idx]];
    set("points", copy.map((p, i) => ({ ...p, order: i })));
  }
  function removeP(id: string) {
    set("points", points.filter((p) => p.id !== id).map((p, i) => ({ ...p, order: i })));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/section/fitness", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setSavedAt(new Date().toLocaleTimeString("ko-KR"));
    } catch (e: any) {
      setError(e.message || "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">특별진급 적합성 관리</h1>
      <p className="text-sm text-neutral-500 mb-8">특별진급 적합성 핵심 내용을 관리합니다.</p>

      <SelectField
        label="공개 상태"
        value={data.status}
        onChange={(v) => set("status", v as FitnessSection["status"])}
        options={[
          { value: "draft", label: "작성 중" }, { value: "review", label: "검토 중" },
          { value: "published", label: "공개" }, { value: "hidden", label: "비공개" },
        ]}
      />
      <TextField label="제목" value={data.title} onChange={(v) => set("title", v)} />

      <div className="space-y-3 mt-4">
        {points.map((p) => (
          <div key={p.id} className="rounded-md border border-neutral-800 p-4">
            <div className="flex items-center gap-2 mb-2">
              <input
                value={p.title}
                onChange={(e) => updatePoint(p.id, { title: e.target.value })}
                placeholder="소제목"
                className="flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm font-medium text-neutral-100 outline-none focus:border-orange-500"
              />
              <button onClick={() => moveP(p.id, -1)} className="text-neutral-400 hover:text-neutral-100 px-1">↑</button>
              <button onClick={() => moveP(p.id, 1)} className="text-neutral-400 hover:text-neutral-100 px-1">↓</button>
              <ConfirmButton label="삭제" onConfirm={() => removeP(p.id)} />
            </div>
            <textarea
              value={p.body}
              onChange={(e) => updatePoint(p.id, { body: e.target.value })}
              rows={2}
              className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-orange-500"
            />
          </div>
        ))}
      </div>
      <button
        onClick={() => set("points", [...points, { id: uuid(), title: "", body: "", order: points.length }])}
        className="mt-3 rounded-md border border-dashed border-neutral-700 px-3 py-1.5 text-xs text-neutral-300 hover:border-orange-500"
      >
        + 항목 추가
      </button>

      <SaveBar onSave={handleSave} saving={saving} savedAt={savedAt} error={error} />
    </div>
  );
}
