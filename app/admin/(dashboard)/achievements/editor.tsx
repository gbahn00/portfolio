"use client";

import { useState } from "react";
import { Achievement } from "@/lib/types";
import { TextField, TextAreaField, ToggleField } from "@/components/admin/fields";
import { ConfirmButton } from "@/components/admin/ConfirmButton";

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, { headers: { "Content-Type": "application/json" }, ...options });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "요청에 실패했습니다.");
  return data;
}

function Card({ item, onSaved, onDeleted }: { item: Achievement; onSaved: (v: Achievement) => void; onDeleted: () => void }) {
  const [draft, setDraft] = useState(item);
  const [saving, setSaving] = useState(false);
  function set<K extends keyof Achievement>(key: K, value: Achievement[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }
  async function save() {
    setSaving(true);
    try {
      const updated = await api(`/api/admin/list/achievements/${item.id}`, { method: "PATCH", body: JSON.stringify(draft) });
      onSaved(updated);
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="rounded-md border border-neutral-800 p-4 mb-3">
      <TextField label="성과명" value={draft.name} onChange={(v) => set("name", v)} />
      <div className="grid grid-cols-3 gap-3">
        <TextField label="수치" value={draft.value} onChange={(v) => set("value", v)} placeholder="확인된 값이 없으면 비워두세요" />
        <TextField label="단위" value={draft.unit} onChange={(v) => set("unit", v)} />
        <TextField label="기준일" value={draft.asOfDate} onChange={(v) => set("asOfDate", v)} placeholder="YYYY-MM-DD" />
      </div>
      <TextAreaField label="설명 / 근거" value={draft.description} onChange={(v) => set("description", v)} rows={2} />
      <TextField label="출처" value={draft.source} onChange={(v) => set("source", v)} />
      <div className="flex items-center gap-6 mb-2">
        <label className="flex items-center gap-2 text-xs text-neutral-400">
          <input type="checkbox" checked={draft.visible} onChange={(e) => set("visible", e.target.checked)} /> 공개 화면에 노출
        </label>
        <label className="flex items-center gap-2 text-xs text-neutral-400">
          <input type="checkbox" checked={draft.countUpEnabled} onChange={(e) => set("countUpEnabled", e.target.checked)} /> 숫자 증가 효과
        </label>
      </div>
      <div className="flex items-center justify-between mt-2">
        <ConfirmButton label="삭제" onConfirm={async () => { await api(`/api/admin/list/achievements/${item.id}`, { method: "DELETE" }); onDeleted(); }} />
        <button onClick={save} disabled={saving} className="rounded-md bg-orange-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-orange-400 disabled:opacity-50">
          {saving ? "저장 중..." : "저장"}
        </button>
      </div>
    </div>
  );
}

export function AchievementsManager({ initial }: { initial: Achievement[] }) {
  const [items, setItems] = useState(initial);
  const sorted = [...items].sort((a, b) => a.order - b.order);

  async function add() {
    const created = await api("/api/admin/list/achievements", {
      method: "POST",
      body: JSON.stringify({ name: "", value: "", unit: "", description: "", asOfDate: "", source: "", countUpEnabled: true, visible: false }),
    });
    setItems((i) => [...i, created]);
  }
  async function move(id: string, dir: -1 | 1) {
    const idx = sorted.findIndex((i) => i.id === id);
    const t = idx + dir;
    if (t < 0 || t >= sorted.length) return;
    const copy = [...sorted];
    [copy[idx], copy[t]] = [copy[t], copy[idx]];
    setItems(copy.map((i, ix) => ({ ...i, order: ix })));
    await api("/api/admin/list/achievements/reorder", { method: "POST", body: JSON.stringify({ orderedIds: copy.map((i) => i.id) }) });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">성과 관리</h1>
      <p className="text-sm text-neutral-500 mb-2">확인되지 않은 수치는 임의로 작성하지 않습니다. 값이 비어 있으면 공개 화면에 표시되지 않습니다.</p>
      <p className="text-sm text-neutral-500 mb-8">실제 수치가 확인되면 값을 입력하고 &apos;공개 화면에 노출&apos;을 켜세요.</p>

      {sorted.map((item, idx) => (
        <div key={item.id} className="flex items-start gap-2">
          <div className="flex flex-col gap-1 pt-3">
            <button onClick={() => move(item.id, -1)} disabled={idx === 0} className="text-neutral-400 disabled:opacity-30 text-xs">↑</button>
            <button onClick={() => move(item.id, 1)} disabled={idx === sorted.length - 1} className="text-neutral-400 disabled:opacity-30 text-xs">↓</button>
          </div>
          <div className="flex-1">
            <Card item={item} onSaved={(u) => setItems((is) => is.map((i) => (i.id === u.id ? u : i)))} onDeleted={() => setItems((is) => is.filter((i) => i.id !== item.id))} />
          </div>
        </div>
      ))}
      <button onClick={add} className="rounded-md border border-dashed border-neutral-700 px-4 py-2 text-sm text-neutral-300 hover:border-orange-500">
        + 성과 항목 추가
      </button>
    </div>
  );
}
