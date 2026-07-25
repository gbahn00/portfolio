"use client";

import { useState } from "react";
import { v4 as uuid } from "uuid";
import { TimelineEntry } from "@/lib/types";
import { TextField, TextAreaField, SelectField } from "@/components/admin/fields";
import { TextListEditor } from "@/components/admin/ArrayEditor";
import { MediaUpload } from "@/components/admin/MediaUpload";
import { ConfirmButton } from "@/components/admin/ConfirmButton";

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, { headers: { "Content-Type": "application/json" }, ...options });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "요청에 실패했습니다.");
  return data;
}

function EntryCard({ entry, onSaved, onDeleted }: { entry: TimelineEntry; onSaved: (e: TimelineEntry) => void; onDeleted: () => void }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(entry);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof TimelineEntry>(key: K, value: TimelineEntry[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  async function save() {
    setSaving(true);
    try {
      const updated = await api(`/api/admin/list/timeline/${entry.id}`, { method: "PATCH", body: JSON.stringify(draft) });
      onSaved(updated);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-md border border-neutral-800 mb-3">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 text-left">
        <span className="text-sm font-medium">{entry.year} · {entry.title || "(제목 없음)"}</span>
        <span className="text-xs text-neutral-500">{open ? "접기 ▲" : "펼치기 ▼"}</span>
      </button>
      {open && (
        <div className="border-t border-neutral-800 p-4">
          <div className="grid grid-cols-2 gap-4">
            <TextField label="연도" value={draft.year} onChange={(v) => set("year", v)} />
            <SelectField
              label="공개 상태" value={draft.status} onChange={(v) => set("status", v as TimelineEntry["status"])}
              options={[
                { value: "draft", label: "작성 중" }, { value: "review", label: "검토 중" },
                { value: "published", label: "공개" }, { value: "hidden", label: "비공개" },
              ]}
            />
          </div>
          <TextField label="제목" value={draft.title} onChange={(v) => set("title", v)} />
          <TextAreaField label="설명" value={draft.description} onChange={(v) => set("description", v)} rows={2} />
          <TextListEditor label="주요 경험" items={draft.experiences} onChange={(v) => set("experiences", v as any)} />
          <TextField label="전달 메시지" value={draft.message} onChange={(v) => set("message", v)} />
          <MediaUpload label="대표 이미지" value={draft.heroImage} onChange={(m) => set("heroImage", m)} />
          <MediaUpload label="대표 영상 (선택)" value={draft.heroVideo} onChange={(m) => set("heroVideo", m)} accept="video/*" />

          <div className="flex items-center justify-between mt-4">
            <ConfirmButton label="이 연도 삭제 (휴지통으로 이동)" onConfirm={async () => { await api(`/api/admin/list/timeline/${entry.id}`, { method: "DELETE" }); onDeleted(); }} />
            <button onClick={save} disabled={saving} className="rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-400 disabled:opacity-50">
              {saving ? "저장 중..." : "저장"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function TimelineManager({ initial }: { initial: TimelineEntry[] }) {
  const [entries, setEntries] = useState(initial);
  const sorted = [...entries].sort((a, b) => a.order - b.order);

  async function addYear() {
    const created = await api("/api/admin/list/timeline", {
      method: "POST",
      body: JSON.stringify({
        year: "", title: "", description: "", experiences: [], message: "", status: "draft", visible: true,
      }),
    });
    setEntries((e) => [...e, created]);
  }

  async function move(id: string, dir: -1 | 1) {
    const idx = sorted.findIndex((e) => e.id === id);
    const t = idx + dir;
    if (t < 0 || t >= sorted.length) return;
    const copy = [...sorted];
    [copy[idx], copy[t]] = [copy[t], copy[idx]];
    const orderedIds = copy.map((e) => e.id);
    setEntries(copy.map((e, i) => ({ ...e, order: i })));
    await api("/api/admin/list/timeline/reorder", { method: "POST", body: JSON.stringify({ orderedIds }) });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">성장과정 관리</h1>
      <p className="text-sm text-neutral-500 mb-8">연도별 업무 확장 과정을 추가·수정·삭제·순서 변경할 수 있습니다.</p>

      {sorted.map((entry, idx) => (
        <div key={entry.id} className="flex items-start gap-2">
          <div className="flex flex-col gap-1 pt-3">
            <button onClick={() => move(entry.id, -1)} disabled={idx === 0} className="text-neutral-400 hover:text-neutral-100 disabled:opacity-30 text-xs">↑</button>
            <button onClick={() => move(entry.id, 1)} disabled={idx === sorted.length - 1} className="text-neutral-400 hover:text-neutral-100 disabled:opacity-30 text-xs">↓</button>
          </div>
          <div className="flex-1">
            <EntryCard
              entry={entry}
              onSaved={(updated) => setEntries((es) => es.map((e) => (e.id === updated.id ? updated : e)))}
              onDeleted={() => setEntries((es) => es.filter((e) => e.id !== entry.id))}
            />
          </div>
        </div>
      ))}

      <button onClick={addYear} className="rounded-md border border-dashed border-neutral-700 px-4 py-2 text-sm text-neutral-300 hover:border-orange-500">
        + 연도 추가
      </button>
    </div>
  );
}
