"use client";

import { useState } from "react";
import { v4 as uuid } from "uuid";
import { AiSection, AiTool } from "@/lib/types";
import { TextField, TextAreaField, SelectField, ToggleField, FieldGroup } from "@/components/admin/fields";
import { SaveBar } from "@/components/admin/SaveBar";
import { ConfirmButton } from "@/components/admin/ConfirmButton";

export function AiEditor({ initial }: { initial: AiSection }) {
  const [data, setData] = useState<AiSection>(initial);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const steps = [...data.processSteps].sort((a, b) => a.order - b.order);
  const tools = [...data.tools].sort((a, b) => a.order - b.order);

  function set<K extends keyof AiSection>(key: K, value: AiSection[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  function updateStep(id: string, title: string) {
    set("processSteps", steps.map((s) => (s.id === id ? { ...s, title } : s)));
  }
  function moveStep(id: string, dir: -1 | 1) {
    const idx = steps.findIndex((s) => s.id === id);
    const t = idx + dir;
    if (t < 0 || t >= steps.length) return;
    const copy = [...steps];
    [copy[idx], copy[t]] = [copy[t], copy[idx]];
    set("processSteps", copy.map((s, i) => ({ ...s, order: i })));
  }
  function removeStep(id: string) {
    set("processSteps", steps.filter((s) => s.id !== id).map((s, i) => ({ ...s, order: i })));
  }

  function updateTool(id: string, patch: Partial<AiTool>) {
    set("tools", tools.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }
  function moveTool(id: string, dir: -1 | 1) {
    const idx = tools.findIndex((t) => t.id === id);
    const target = idx + dir;
    if (target < 0 || target >= tools.length) return;
    const copy = [...tools];
    [copy[idx], copy[target]] = [copy[target], copy[idx]];
    set("tools", copy.map((t, i) => ({ ...t, order: i })));
  }
  function removeTool(id: string) {
    set("tools", tools.filter((t) => t.id !== id).map((t, i) => ({ ...t, order: i })));
  }
  function addTool() {
    set("tools", [
      ...tools,
      { id: uuid(), name: "", purpose: "", linkedProjectIds: [], results: [], promptSamples: [], failureNotes: [], order: tools.length, visible: true },
    ]);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/section/ai", {
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
      <h1 className="text-2xl font-bold mb-1">생성형 인공지능 활용 관리</h1>
      <p className="text-sm text-neutral-500 mb-2">제작 흐름 단계와 사용 도구를 관리합니다.</p>
      <p className="text-xs text-amber-500 mb-8">⚠️ 이 메뉴의 내용은 현재 공개 화면 어디에도 표시되지 않습니다.</p>

      <FieldGroup title="텍스트">
        <TextField label="제목" value={data.title} onChange={(v) => set("title", v)} />
      </FieldGroup>

      <div className="mb-6">
        <span className="block text-sm font-medium text-neutral-300 mb-1.5">제작 흐름 단계</span>
        <div className="space-y-2">
          {steps.map((s, idx) => (
            <div key={s.id} className="flex items-center gap-2">
              <span className="w-6 text-xs text-neutral-500">{idx + 1}</span>
              <input
                value={s.title}
                onChange={(e) => updateStep(s.id, e.target.value)}
                className="flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-orange-500"
              />
              <button onClick={() => moveStep(s.id, -1)} className="text-neutral-400 hover:text-neutral-100 px-1">↑</button>
              <button onClick={() => moveStep(s.id, 1)} className="text-neutral-400 hover:text-neutral-100 px-1">↓</button>
              <button onClick={() => removeStep(s.id)} className="text-red-400 hover:text-red-300 text-sm px-1">삭제</button>
            </div>
          ))}
        </div>
        <button
          onClick={() => set("processSteps", [...steps, { id: uuid(), order: steps.length, title: "" }])}
          className="mt-2 rounded-md border border-dashed border-neutral-700 px-3 py-1.5 text-xs text-neutral-300 hover:border-orange-500"
        >
          + 단계 추가
        </button>
      </div>

      <div className="mb-6">
        <span className="block text-sm font-medium text-neutral-300 mb-1.5">사용 도구</span>
        <div className="space-y-4">
          {tools.map((t) => (
            <div key={t.id} className="rounded-md border border-neutral-800 p-4">
              <div className="flex items-center justify-between mb-3">
                <input
                  value={t.name}
                  onChange={(e) => updateTool(t.id, { name: e.target.value })}
                  placeholder="도구명 (예: Higgsfield AI)"
                  className="flex-1 mr-3 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm font-medium text-neutral-100 outline-none focus:border-orange-500"
                />
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => moveTool(t.id, -1)} className="text-neutral-400 hover:text-neutral-100 px-1">↑</button>
                  <button onClick={() => moveTool(t.id, 1)} className="text-neutral-400 hover:text-neutral-100 px-1">↓</button>
                  <ConfirmButton label="삭제" onConfirm={() => removeTool(t.id)} />
                </div>
              </div>
              <textarea
                value={t.purpose}
                onChange={(e) => updateTool(t.id, { purpose: e.target.value })}
                placeholder="실제 활용 목적"
                rows={2}
                className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-orange-500 mb-2"
              />
              <label className="flex items-center gap-2 text-xs text-neutral-400">
                <input type="checkbox" checked={t.visible} onChange={(e) => updateTool(t.id, { visible: e.target.checked })} />
                공개 화면에 노출
              </label>
            </div>
          ))}
        </div>
        <button onClick={addTool} className="mt-2 rounded-md border border-dashed border-neutral-700 px-3 py-1.5 text-xs text-neutral-300 hover:border-orange-500">
          + 도구 추가
        </button>
      </div>

      <FieldGroup title="노출 설정">
        <SelectField
          label="공개 상태"
          value={data.status}
          onChange={(v) => set("status", v as AiSection["status"])}
          options={[
            { value: "draft", label: "작성 중" }, { value: "review", label: "검토 중" },
            { value: "published", label: "공개" }, { value: "hidden", label: "비공개" },
          ]}
        />
      </FieldGroup>

      <SaveBar onSave={handleSave} saving={saving} savedAt={savedAt} error={error} />
    </div>
  );
}
