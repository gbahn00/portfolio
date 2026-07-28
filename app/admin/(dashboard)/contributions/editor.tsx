"use client";

import { useState } from "react";
import { v4 as uuid } from "uuid";
import { ContributionSection, ContributionItem } from "@/lib/types";
import { TextField, SelectField } from "@/components/admin/fields";
import { SaveBar } from "@/components/admin/SaveBar";
import { ConfirmButton } from "@/components/admin/ConfirmButton";

export function ContributionsEditor({ initial }: { initial: ContributionSection }) {
  const [data, setData] = useState<ContributionSection>(initial);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const items = [...data.items].sort((a, b) => a.order - b.order);

  function set<K extends keyof ContributionSection>(key: K, value: ContributionSection[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }
  function updateItem(id: string, patch: Partial<ContributionItem>) {
    set("items", items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }
  function moveItem(id: string, dir: -1 | 1) {
    const idx = items.findIndex((i) => i.id === id);
    const t = idx + dir;
    if (t < 0 || t >= items.length) return;
    const copy = [...items];
    [copy[idx], copy[t]] = [copy[t], copy[idx]];
    set("items", copy.map((i, ix) => ({ ...i, order: ix })));
  }
  function removeItem(id: string) {
    set("items", items.filter((i) => i.id !== id).map((i, ix) => ({ ...i, order: ix })));
  }
  function addItem() {
    set("items", [...items, { id: uuid(), title: "", description: "", metrics: [], order: items.length, visible: true }]);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/section/contributions", {
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
      <h1 className="text-2xl font-bold mb-1">조직 기여 관리</h1>
      <p className="text-sm text-neutral-500 mb-2">팀/조직 기여 사례를 추가·수정·삭제합니다.</p>
      <p className="text-xs text-amber-500 mb-8">⚠️ 이 메뉴의 내용은 현재 공개 화면 어디에도 표시되지 않습니다.</p>

      <SelectField
        label="공개 상태"
        value={data.status}
        onChange={(v) => set("status", v as ContributionSection["status"])}
        options={[
          { value: "draft", label: "작성 중" }, { value: "review", label: "검토 중" },
          { value: "published", label: "공개" }, { value: "hidden", label: "비공개" },
        ]}
      />
      <TextField label="제목" value={data.title} onChange={(v) => set("title", v)} />

      <div className="space-y-4 mt-4">
        {items.map((item) => (
          <div key={item.id} className="rounded-md border border-neutral-800 p-4">
            <div className="flex items-center gap-2 mb-2">
              <input
                value={item.title}
                onChange={(e) => updateItem(item.id, { title: e.target.value })}
                placeholder="기여 사례 제목"
                className="flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm font-medium text-neutral-100 outline-none focus:border-orange-500"
              />
              <button onClick={() => moveItem(item.id, -1)} className="text-neutral-400 hover:text-neutral-100 px-1">↑</button>
              <button onClick={() => moveItem(item.id, 1)} className="text-neutral-400 hover:text-neutral-100 px-1">↓</button>
              <ConfirmButton label="삭제" onConfirm={() => removeItem(item.id)} />
            </div>
            <textarea
              value={item.description}
              onChange={(e) => updateItem(item.id, { description: e.target.value })}
              rows={2}
              placeholder="설명"
              className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-orange-500 mb-2"
            />
            <label className="flex items-center gap-2 text-xs text-neutral-400">
              <input type="checkbox" checked={item.visible} onChange={(e) => updateItem(item.id, { visible: e.target.checked })} />
              공개 화면에 노출
            </label>
          </div>
        ))}
      </div>
      <button onClick={addItem} className="mt-3 rounded-md border border-dashed border-neutral-700 px-3 py-1.5 text-xs text-neutral-300 hover:border-orange-500">
        + 기여 사례 추가
      </button>

      <SaveBar onSave={handleSave} saving={saving} savedAt={savedAt} error={error} />
    </div>
  );
}
