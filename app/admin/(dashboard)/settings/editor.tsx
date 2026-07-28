"use client";

import { useState } from "react";
import { SiteSettings, TypographySettings, TypographyFontKey, WordBreakMode } from "@/lib/types";
import { TextField, ToggleField } from "@/components/admin/fields";
import { SaveBar } from "@/components/admin/SaveBar";
import { FONT_LABELS } from "@/lib/fonts";

const WORD_BREAK_OPTIONS: { value: WordBreakMode; label: string }[] = [
  { value: "keep-all", label: "단어 단위로 줄바꿈 (한글 기본, 권장)" },
  { value: "normal", label: "일반 줄바꿈 (브라우저 기본)" },
  { value: "break-all", label: "아무 글자에서나 줄바꿈" },
];

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

  // §133 — 타이포그래피(제목용/본문용 폰트·자간·행간·줄바꿈).
  const typography = data.typography ?? {};
  function setTypo<K extends keyof TypographySettings>(key: K, value: TypographySettings[K] | undefined) {
    set("typography", { ...typography, [key]: value });
  }
  function resetTypoGroup(prefix: "title" | "body") {
    const next = { ...typography };
    delete next[`${prefix}Font` as keyof TypographySettings];
    delete next[`${prefix}LetterSpacing` as keyof TypographySettings];
    delete next[`${prefix}LineHeight` as keyof TypographySettings];
    delete next[`${prefix}WordBreak` as keyof TypographySettings];
    set("typography", next);
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

      {/* §133 — "폰트·자간·행간·줄바꿈을 설정 가능하게 해달라"는 요청으로
          추가. 제목용(큰 타이틀들)과 본문용(문단·설명 글자)을 따로
          설정한다. 값을 비워두면(기본값) 기존 디자인이 그대로 유지된다. */}
      <div className="mb-6 rounded-md border border-neutral-800 p-4">
        <span className="block text-sm font-medium text-neutral-300 mb-1">타이포그래피</span>
        <p className="text-xs text-neutral-500 mb-4">
          제목용(큰 타이틀)과 본문용(설명 문단)을 따로 설정합니다. 비워두면(기본값) 지금 디자인이 그대로 유지됩니다. 자간은 보통 -0.06 ~ 0 사이, 행간은 0.9 ~ 1.8 사이 값을 많이 씁니다.
        </p>

        {(["title", "body"] as const).map((prefix) => {
          const label = prefix === "title" ? "제목용 (큰 타이틀)" : "본문용 (설명 문단)";
          const fontKey = typography[`${prefix}Font`] as TypographyFontKey | undefined;
          const letterSpacing = typography[`${prefix}LetterSpacing`] as number | undefined;
          const lineHeight = typography[`${prefix}LineHeight`] as number | undefined;
          const wordBreak = typography[`${prefix}WordBreak`] as WordBreakMode | undefined;
          return (
            <div key={prefix} className="mb-4 last:mb-0 rounded-md border border-neutral-800 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-neutral-300">{label}</span>
                <button
                  type="button"
                  onClick={() => resetTypoGroup(prefix)}
                  className="text-[11px] text-neutral-500 hover:text-neutral-300"
                >
                  기본값으로 되돌리기
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <label className="block">
                  <span className="block text-[11px] text-neutral-500 mb-1">폰트</span>
                  <select
                    value={fontKey ?? ""}
                    onChange={(e) => setTypo(`${prefix}Font`, (e.target.value || undefined) as any)}
                    className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-orange-500"
                  >
                    <option value="">기본값</option>
                    {Object.entries(FONT_LABELS).map(([key, name]) => (
                      <option key={key} value={key}>{name}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="block text-[11px] text-neutral-500 mb-1">줄바꿈</span>
                  <select
                    value={wordBreak ?? ""}
                    onChange={(e) => setTypo(`${prefix}WordBreak`, (e.target.value || undefined) as any)}
                    className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-orange-500"
                  >
                    <option value="">기본값</option>
                    {WORD_BREAK_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="block text-[11px] text-neutral-500 mb-1">자간 (em, 예: -0.05)</span>
                  <input
                    type="number"
                    step="0.005"
                    value={letterSpacing ?? ""}
                    placeholder="기본값"
                    onChange={(e) => setTypo(`${prefix}LetterSpacing`, e.target.value === "" ? undefined : Number(e.target.value))}
                    className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-orange-500"
                  />
                </label>
                <label className="block">
                  <span className="block text-[11px] text-neutral-500 mb-1">행간 (배수, 예: 1.1)</span>
                  <input
                    type="number"
                    step="0.05"
                    value={lineHeight ?? ""}
                    placeholder="기본값"
                    onChange={(e) => setTypo(`${prefix}LineHeight`, e.target.value === "" ? undefined : Number(e.target.value))}
                    className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-orange-500"
                  />
                </label>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mb-6">
        <span className="block text-sm font-medium text-neutral-300 mb-1.5">화면 영역 노출 및 순서</span>
        <p className="text-xs text-neutral-500 mb-2">
          ⚠️ 현재 이 체크박스와 ↑↓ 순서는 실제 홈페이지에는 반영되지 않습니다(홈페이지 구역 순서는 코드에 고정되어 있습니다). 참고용으로만 남아 있습니다.
        </p>
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
