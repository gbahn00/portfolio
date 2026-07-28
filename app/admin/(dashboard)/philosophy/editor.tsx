"use client";

import { useState } from "react";
import { PhilosophySection } from "@/lib/types";
import { TextField, ToggleField, SelectField, FieldGroup } from "@/components/admin/fields";
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

      <FieldGroup title="텍스트" hint="이 문단·키워드는 '프로필 관리'의 '소개 탭 본문'과 같은 데이터입니다. 되도록 한쪽에서만 수정하세요.">
        <TextField label="제목" value={data.title} onChange={(v) => set("title", v)} hint="⚠️ 현재 화면에는 표시되지 않습니다(참고용)." />
        <TextListEditor
          label="문단"
          items={data.paragraphs}
          onChange={(v) => set("paragraphs", v as any)}
          placeholder="문단 내용"
          multiline
          hint="Enter로 줄바꿈을 입력하면 공개 화면에도 그대로 반영됩니다. 앞 2개 문단만 화면에 보입니다."
        />
        <TextListEditor label="키워드" items={data.keywords} onChange={(v) => set("keywords", v as any)} placeholder="키워드" hint="최대 5개까지 화면에 보입니다." />
      </FieldGroup>

      <FieldGroup title="노출 설정" hint="⚠️ 아래 두 값은 현재 실제 화면에는 반영되지 않습니다(항상 노출됨). 참고용으로만 남아 있습니다.">
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
      </FieldGroup>

      <SaveBar onSave={handleSave} saving={saving} savedAt={savedAt} error={error} />
    </div>
  );
}
