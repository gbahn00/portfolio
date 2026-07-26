"use client";

import { useState } from "react";
import { FuturePlan } from "@/lib/types";
import { TextField, TextAreaField, SelectField } from "@/components/admin/fields";
import { TextListEditor } from "@/components/admin/ArrayEditor";
import { ConfirmButton } from "@/components/admin/ConfirmButton";

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, { headers: { "Content-Type": "application/json" }, ...options });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "요청에 실패했습니다.");
  return data;
}

function Card({ item, onSaved, onDeleted }: { item: FuturePlan; onSaved: (v: FuturePlan) => void; onDeleted: () => void }) {
  const [draft, setDraft] = useState(item);
  const [saving, setSaving] = useState(false);
  function set<K extends keyof FuturePlan>(key: K, value: FuturePlan[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }
  async function save() {
    setSaving(true);
    try {
      const updated = await api(`/api/admin/list/futurePlans/${item.id}`, { method: "PATCH", body: JSON.stringify(draft) });
      onSaved(updated);
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="rounded-md border border-neutral-800 p-4 mb-3">
      <TextAreaField
        label="제목"
        value={draft.title}
        onChange={(v) => set("title", v)}
        rows={2}
        hint="Enter로 줄바꿈을 입력하면 공개 화면에도 그대로 반영됩니다."
      />
      <TextAreaField label="요약" value={draft.summary} onChange={(v) => set("summary", v)} rows={2} />
      <TextListEditor label="세부 계획" items={draft.details} onChange={(v) => set("details", v as any)} />
      <TextAreaField label="기대 효과" value={draft.expectedEffect} onChange={(v) => set("expectedEffect", v)} rows={2} />
      <div className="grid grid-cols-2 gap-4">
        <SelectField
          label="진행 상태" value={draft.progress} onChange={(v) => set("progress", v as FuturePlan["progress"])}
          options={[
            { value: "예정", label: "예정" }, { value: "준비중", label: "준비중" },
            { value: "진행중", label: "진행중" }, { value: "완료", label: "완료" },
          ]}
        />
      </div>
      <div className="flex items-center justify-between mt-2">
        <ConfirmButton label="삭제" onConfirm={async () => { await api(`/api/admin/list/futurePlans/${item.id}`, { method: "DELETE" }); onDeleted(); }} />
        <button onClick={save} disabled={saving} className="rounded-md bg-orange-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-orange-400 disabled:opacity-50">
          {saving ? "저장 중..." : "저장"}
        </button>
      </div>
    </div>
  );
}

export function FuturePlansManager({ initial }: { initial: FuturePlan[] }) {
  const [items, setItems] = useState(initial);
  const sorted = [...items].sort((a, b) => a.order - b.order);

  async function add() {
    const created = await api("/api/admin/list/futurePlans", {
      method: "POST",
      body: JSON.stringify({ title: "", summary: "", details: [], expectedEffect: "", progress: "예정", visible: true }),
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
    await api("/api/admin/list/futurePlans/reorder", { method: "POST", body: JSON.stringify({ orderedIds: copy.map((i) => i.id) }) });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">향후 계획 관리</h1>
      <p className="text-sm text-neutral-500 mb-8">특별진급 이후 실행 계획을 추가·수정·삭제합니다.</p>

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
        + 실행 계획 추가
      </button>
    </div>
  );
}
