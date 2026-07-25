"use client";

import { useState } from "react";
import { HeroSection } from "@/lib/types";
import { TextField, TextAreaField, ToggleField, SelectField } from "@/components/admin/fields";
import { MediaUpload } from "@/components/admin/MediaUpload";
import { SaveBar } from "@/components/admin/SaveBar";

export function HeroEditor({ initial }: { initial: HeroSection }) {
  const [data, setData] = useState<HeroSection>(initial);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof HeroSection>(key: K, value: HeroSection[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/section/hero", {
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
      <h1 className="text-2xl font-bold mb-1">시작 화면 관리</h1>
      <p className="text-sm text-neutral-500 mb-8">첫 화면의 핵심 문구와 대표 영상/이미지를 관리합니다.</p>

      <ToggleField label="시작 화면 노출" value={data.visible} onChange={(v) => set("visible", v)} />
      <SelectField
        label="공개 상태"
        value={data.status}
        onChange={(v) => set("status", v as HeroSection["status"])}
        options={[
          { value: "draft", label: "작성 중" },
          { value: "review", label: "검토 중" },
          { value: "published", label: "공개" },
          { value: "hidden", label: "비공개" },
        ]}
      />

      <TextAreaField label="핵심 문구" value={data.headline} onChange={(v) => set("headline", v)} rows={3} hint="줄바꿈으로 여러 줄 표현 가능" />
      <TextAreaField label="보조 문구" value={data.subline} onChange={(v) => set("subline", v)} rows={2} />

      <div className="grid grid-cols-2 gap-4">
        <TextField label="이름" value={data.name} onChange={(v) => set("name", v)} />
        <TextField label="직무" value={data.role} onChange={(v) => set("role", v)} />
        <TextField label="소속" value={data.department} onChange={(v) => set("department", v)} />
        <TextField label="입사 연도 표기" value={data.joinYear} onChange={(v) => set("joinYear", v)} />
      </div>
      <TextField label="배지 문구" value={data.badge} onChange={(v) => set("badge", v)} hint="예: 2026년 특별진급 포트폴리오" />

      <MediaUpload label="대표 영상 (선택)" value={data.backgroundVideo} onChange={(m) => set("backgroundVideo", m)} accept="video/*" />
      <MediaUpload label="대표 이미지 (영상 재생 불가 시 대체)" value={data.backgroundImage} onChange={(m) => set("backgroundImage", m)} />

      <SaveBar onSave={handleSave} saving={saving} savedAt={savedAt} error={error} />
    </div>
  );
}
