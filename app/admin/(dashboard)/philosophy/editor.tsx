"use client";

import { useState } from "react";
import { PhilosophySection } from "@/lib/types";
import { TextField, ToggleField, SelectField } from "@/components/admin/fields";
import { TextListEditor } from "@/components/admin/ArrayEditor";
import { SaveBar } from "@/components/admin/SaveBar";

export function PhilosophyEditor({ initial }: { initial: PhilosophySection }) {
  const [data, setData] = useState<PhilosophySection>(initial);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof PhilosophySection>(key: K, value: PhilosophySection[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/section/philosophy", {
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
      <h1 className="text-2xl font-bold mb-1">핵심 업무 철학 관리</h1>
      <p className="text-sm text-neutral-500 mb-8">문단과 키워드를 자유롭게 추가·삭제·순서 변경할 수 있습니다.</p>

      <ToggleField label="영역 노출" value={data.visible} onChange={(v) => set("visible", v)} />
      <SelectField
        label="공개 상태"
        value={data.status}
        onChange={(v) => set("status", v as PhilosophySection["status"])}
        options={[
          { value: "draft", label: "작성 중" }, { value: "review", label: "검토 중" },
          { value: "published", label: "공개" }, { value: "hidden", label: "비공개" },
        ]}
      />
      <TextField label="제목" value={data.title} onChange={(v) => set("title", v)} />

      <TextListEditor label="문단" items={data.paragraphs} onChange={(v) => set("paragraphs", v as any)} placeholder="문단 내용" />
      <TextListEditor label="키워드" items={data.keywords} onChange={(v) => set("keywords", v as any)} placeholder="키워드" />

      <SaveBar onSave={handleSave} saving={saving} savedAt={savedAt} error={error} />
    </div>
  );
}
