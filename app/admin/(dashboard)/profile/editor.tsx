"use client";

import { useState } from "react";
import { v4 as uuid } from "uuid";
import { Profile } from "@/lib/types";
import { TextField, TextAreaField } from "@/components/admin/fields";
import { MediaUpload } from "@/components/admin/MediaUpload";
import { SaveBar } from "@/components/admin/SaveBar";

export function ProfileEditor({ initial }: { initial: Profile }) {
  const [data, setData] = useState<Profile>(initial);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof Profile>(key: K, value: Profile[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/section/profile", {
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

  function updateFact(idx: number, patch: Partial<Profile["keyFacts"][number]>) {
    const next = [...data.keyFacts];
    next[idx] = { ...next[idx], ...patch };
    set("keyFacts", next);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">프로필 관리</h1>
      <p className="text-sm text-neutral-500 mb-8">이름, 소속, 자기소개와 프로필 사진을 관리합니다.</p>

      <div className="grid grid-cols-2 gap-4">
        <TextField label="이름" value={data.name} onChange={(v) => set("name", v)} />
        <TextField label="소속" value={data.affiliation} onChange={(v) => set("affiliation", v)} />
        <TextField label="직급" value={data.rank} onChange={(v) => set("rank", v)} />
        <TextField label="직무" value={data.role} onChange={(v) => set("role", v)} />
      </div>
      <TextField label="입사일" value={data.joinedAt} onChange={(v) => set("joinedAt", v)} hint="예: 2024-07-01" />
      <TextAreaField label="짧은 자기소개" value={data.introShort} onChange={(v) => set("introShort", v)} rows={2} />
      <TextAreaField label="긴 자기소개" value={data.introLong} onChange={(v) => set("introLong", v)} rows={4} />
      <TextField label="대표 문구" value={data.representativePhrase} onChange={(v) => set("representativePhrase", v)} />

      <MediaUpload label="프로필 사진" value={data.profilePhoto} onChange={(m) => set("profilePhoto", m)} />

      <div className="mb-5">
        <span className="block text-sm font-medium text-neutral-300 mb-1.5">촬영 현장 사진</span>
        <div className="space-y-3">
          {data.onSitePhotos.map((photo, idx) => (
            <MediaUpload
              key={idx}
              label={`현장 사진 ${idx + 1}`}
              value={photo}
              onChange={(m) => {
                const next = [...data.onSitePhotos];
                if (m) next[idx] = m; else next.splice(idx, 1);
                set("onSitePhotos", next);
              }}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => set("onSitePhotos", [...data.onSitePhotos, { url: "", kind: "image", alt: "" }])}
          className="mt-1 rounded-md border border-dashed border-neutral-700 px-3 py-1.5 text-xs text-neutral-300 hover:border-orange-500"
        >
          + 현장 사진 추가
        </button>
      </div>

      <div className="mb-5">
        <span className="block text-sm font-medium text-neutral-300 mb-1.5">주요 정보</span>
        <div className="space-y-2">
          {data.keyFacts.map((f, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                value={f.label}
                onChange={(e) => updateFact(idx, { label: e.target.value })}
                placeholder="항목명"
                className="w-40 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-orange-500"
              />
              <input
                value={f.value}
                onChange={(e) => updateFact(idx, { value: e.target.value })}
                placeholder="값"
                className="flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-orange-500"
              />
              <button
                type="button"
                onClick={() => set("keyFacts", data.keyFacts.filter((_, i) => i !== idx))}
                className="text-xs text-red-400 hover:text-red-300 px-2"
              >
                삭제
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => set("keyFacts", [...data.keyFacts, { label: "", value: "", order: data.keyFacts.length }])}
          className="mt-2 rounded-md border border-dashed border-neutral-700 px-3 py-1.5 text-xs text-neutral-300 hover:border-orange-500"
        >
          + 정보 추가
        </button>
      </div>

      <SaveBar onSave={handleSave} saving={saving} savedAt={savedAt} error={error} />
    </div>
  );
}
