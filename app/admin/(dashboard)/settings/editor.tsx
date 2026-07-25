"use client";

import { useState } from "react";
import { SiteSettings } from "@/lib/types";
import { TextField, ToggleField } from "@/components/admin/fields";
import { SaveBar } from "@/components/admin/SaveBar";

const SECTION_LABELS: Record<string, string> = {
  hero: "시작 화면", philosophy: "핵심 업무 철학", profile: "프로필 및 주요 정보",
  timeline: "업무 확장 과정", work: "대표 작업", featuredCases: "대표 프로젝트 상세 사례",
  competencies: "주요 업무 역량", ai: "생성형 인공지능 활용 과정", contributions: "팀과 조직에 대한 기여",
  achievements: "주요 성과", collaboration: "협업 방식", fitness: "특별진급 적합성",
  futurePlans: "특별진급 이후 실행 계획", closing: "마무리 화면",
};

export function SettingsEditor({ initial }: { initial: SiteSettings }) {
  const [data, setData] = useState<SiteSettings>(initial);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  function moveSection(key: string, dir: -1 | 1) {
    const order = [...data.sectionOrder];
    const idx = order.indexOf(key);
    const t = idx + dir;
    if (t < 0 || t >= order.length) return;
    [order[idx], order[t]] = [order[t], order[idx]];
    set("sectionOrder", order);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/section/settings", {
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
      <h1 className="text-2xl font-bold mb-1">사이트 설정</h1>
      <p className="text-sm text-neutral-500 mb-8">화면 영역의 노출 여부와 순서, 강조 색상을 관리합니다.</p>

      <TextField label="사이트 제목" value={data.siteTitle} onChange={(v) => set("siteTitle", v)} />

      <div className="mb-6">
        <span className="block text-sm font-medium text-neutral-300 mb-1.5">강조 색상</span>
        <div className="flex gap-3">
          <button
            onClick={() => set("accentColor", "orange")}
            className={`flex items-center gap-2 rounded-md border px-4 py-2 text-sm ${data.accentColor === "orange" ? "border-orange-500" : "border-neutral-700"}`}
          >
            <span className="h-4 w-4 rounded-full" style={{ background: "#EB613B" }} /> 주황색
          </button>
          <button
            onClick={() => set("accentColor", "blue")}
            className={`flex items-center gap-2 rounded-md border px-4 py-2 text-sm ${data.accentColor === "blue" ? "border-blue-500" : "border-neutral-700"}`}
          >
            <span className="h-4 w-4 rounded-full" style={{ background: "#5B7CFF" }} /> 푸른색
          </button>
        </div>
      </div>

      <ToggleField
        label="움직임 감소 설정 지원"
        value={data.reduceMotionRespect}
        onChange={(v) => set("reduceMotionRespect", v)}
        hint="방문자의 OS 움직임 감소 설정을 감지해 애니메이션을 최소화합니다."
      />

      <div className="mb-6">
        <span className="block text-sm font-medium text-neutral-300 mb-1.5">화면 영역 노출 및 순서</span>
        <div className="space-y-2">
          {data.sectionOrder.map((key, idx) => (
            <div key={key} className="flex items-center justify-between rounded-md border border-neutral-800 px-4 py-2.5">
              <span className="text-sm">{SECTION_LABELS[key] || key}</span>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs text-neutral-400">
                  <input
                    type="checkbox"
                    checked={data.sectionVisibility[key] !== false}
                    onChange={(e) => set("sectionVisibility", { ...data.sectionVisibility, [key]: e.target.checked })}
                  />
                  노출
                </label>
                <button onClick={() => moveSection(key, -1)} disabled={idx === 0} className="text-neutral-400 hover:text-neutral-100 disabled:opacity-30 px-1">↑</button>
                <button onClick={() => moveSection(key, 1)} disabled={idx === data.sectionOrder.length - 1} className="text-neutral-400 hover:text-neutral-100 disabled:opacity-30 px-1">↓</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <SaveBar onSave={handleSave} saving={saving} savedAt={savedAt} error={error} />
    </div>
  );
}
