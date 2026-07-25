"use client";

import { useState } from "react";
import { ClosingSection } from "@/lib/types";
import { TextField, TextAreaField, SelectField } from "@/components/admin/fields";
import { MediaUpload } from "@/components/admin/MediaUpload";
import { SaveBar } from "@/components/admin/SaveBar";

export function ClosingEditor({ initial }: { initial: ClosingSection }) {
  const [data, setData] = useState<ClosingSection>(initial);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof ClosingSection>(key: K, value: ClosingSection[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/section/closing", {
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
      <h1 className="text-2xl font-bold mb-1">마무리 화면 관리</h1>
      <p className="text-sm text-neutral-500 mb-8">포트폴리오 마지막 화면의 문구와 배경을 관리합니다.</p>

      <SelectField
        label="공개 상태"
        value={data.status}
        onChange={(v) => set("status", v as ClosingSection["status"])}
        options={[
          { value: "draft", label: "작성 중" }, { value: "review", label: "검토 중" },
          { value: "published", label: "공개" }, { value: "hidden", label: "비공개" },
        ]}
      />
      <TextAreaField label="마무리 문구" value={data.message} onChange={(v) => set("message", v)} rows={3} />
      <div className="grid grid-cols-2 gap-4">
        <TextField label="이름" value={data.name} onChange={(v) => set("name", v)} />
        <TextField label="직무" value={data.role} onChange={(v) => set("role", v)} />
        <TextField label="소속" value={data.department} onChange={(v) => set("department", v)} />
        <TextField label="배지 문구" value={data.badge} onChange={(v) => set("badge", v)} />
      </div>
      <MediaUpload label="배경 이미지" value={data.backgroundImage} onChange={(m) => set("backgroundImage", m)} />
      <MediaUpload label="배경 영상 (선택)" value={data.backgroundVideo} onChange={(m) => set("backgroundVideo", m)} accept="video/*" />

      <SaveBar onSave={handleSave} saving={saving} savedAt={savedAt} error={error} />
    </div>
  );
}
