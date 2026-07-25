"use client";

import { useState } from "react";
import { Collaboration, Project } from "@/lib/types";
import { TextField, TextAreaField } from "@/components/admin/fields";
import { ConfirmButton } from "@/components/admin/ConfirmButton";

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, { headers: { "Content-Type": "application/json" }, ...options });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "요청에 실패했습니다.");
  return data;
}

function Card({ item, projects, onSaved, onDeleted }: { item: Collaboration; projects: Project[]; onSaved: (v: Collaboration) => void; onDeleted: () => void }) {
  const [draft, setDraft] = useState(item);
  const [saving, setSaving] = useState(false);
  function set<K extends keyof Collaboration>(key: K, value: Collaboration[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }
  async function save() {
    setSaving(true);
    try {
      const updated = await api(`/api/admin/list/collaborations/${item.id}`, { method: "PATCH", body: JSON.stringify(draft) });
      onSaved(updated);
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="rounded-md border border-neutral-800 p-4 mb-3">
      <TextField label="협업 대상" value={draft.partner} onChange={(v) => set("partner", v)} />
      <TextAreaField label="협업 과정" value={draft.process} onChange={(v) => set("process", v)} rows={2} />
      <TextAreaField label="협업 평가 / 후기 (선택)" value={draft.review || ""} onChange={(v) => set("review", v)} rows={2} />
      <div className="grid grid-cols-2 gap-4">
        <TextField label="작성자 이름 (선택)" value={draft.authorName || ""} onChange={(v) => set("authorName", v)} />
        <TextField label="작성자 직책 (선택)" value={draft.authorTitle || ""} onChange={(v) => set("authorTitle", v)} />
      </div>
      <label className="block mb-3">
        <span className="block text-sm font-medium text-neutral-300 mb-1.5">관련 프로젝트 (선택)</span>
        <select
          value={draft.relatedProjectId || ""}
          onChange={(e) => set("relatedProjectId", e.target.value || undefined)}
          className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-orange-500"
        >
          <option value="">연결 안 함</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
      </label>
      <div className="flex items-center gap-6 mb-2">
        <label className="flex items-center gap-2 text-xs text-neutral-400">
          <input type="checkbox" checked={draft.authorNameVisible} onChange={(e) => set("authorNameVisible", e.target.checked)} /> 작성자 이름 공개
        </label>
        <label className="flex items-center gap-2 text-xs text-neutral-400">
          <input type="checkbox" checked={draft.authorTitleVisible} onChange={(e) => set("authorTitleVisible", e.target.checked)} /> 직책 공개
        </label>
        <label className="flex items-center gap-2 text-xs text-neutral-400">
          <input type="checkbox" checked={draft.visible} onChange={(e) => set("visible", e.target.checked)} /> 공개 화면 노출
        </label>
      </div>
      <div className="flex items-center justify-between mt-2">
        <ConfirmButton label="삭제" onConfirm={async () => { await api(`/api/admin/list/collaborations/${item.id}`, { method: "DELETE" }); onDeleted(); }} />
        <button onClick={save} disabled={saving} className="rounded-md bg-orange-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-orange-400 disabled:opacity-50">
          {saving ? "저장 중..." : "저장"}
        </button>
      </div>
    </div>
  );
}

export function CollaborationsManager({ initial, projects }: { initial: Collaboration[]; projects: Project[] }) {
  const [items, setItems] = useState(initial);
  const sorted = [...items].sort((a, b) => a.order - b.order);

  async function add() {
    const created = await api("/api/admin/list/collaborations", {
      method: "POST",
      body: JSON.stringify({ partner: "", process: "", authorNameVisible: false, authorTitleVisible: false, visible: true }),
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
    await api("/api/admin/list/collaborations/reorder", { method: "POST", body: JSON.stringify({ orderedIds: copy.map((i) => i.id) }) });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">협업 평가 관리</h1>
      <p className="text-sm text-neutral-500 mb-8">협업 대상, 협업 과정과 평가/후기를 관리합니다.</p>

      {sorted.map((item, idx) => (
        <div key={item.id} className="flex items-start gap-2">
          <div className="flex flex-col gap-1 pt-3">
            <button onClick={() => move(item.id, -1)} disabled={idx === 0} className="text-neutral-400 disabled:opacity-30 text-xs">↑</button>
            <button onClick={() => move(item.id, 1)} disabled={idx === sorted.length - 1} className="text-neutral-400 disabled:opacity-30 text-xs">↓</button>
          </div>
          <div className="flex-1">
            <Card item={item} projects={projects} onSaved={(u) => setItems((is) => is.map((i) => (i.id === u.id ? u : i)))} onDeleted={() => setItems((is) => is.filter((i) => i.id !== item.id))} />
          </div>
        </div>
      ))}
      <button onClick={add} className="rounded-md border border-dashed border-neutral-700 px-4 py-2 text-sm text-neutral-300 hover:border-orange-500">
        + 협업 사례 추가
      </button>
    </div>
  );
}
