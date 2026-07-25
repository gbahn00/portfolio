"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuid } from "uuid";
import Link from "next/link";
import { Project, ProjectField, ProjectDetailBlock, MediaRef } from "@/lib/types";
import { TextField, TextAreaField, SelectField, ToggleField } from "@/components/admin/fields";
import { MediaUpload } from "@/components/admin/MediaUpload";
import { SaveBar } from "@/components/admin/SaveBar";
import { DetailBlockEditor } from "@/components/admin/project/DetailBlockEditor";

const FIELD_OPTIONS: ProjectField[] = [
  "의류", "카페 및 음식", "인테리어", "인물 프로필", "치과 및 병원 광고", "유튜브", "생성형 인공지능 콘텐츠",
];

const BLOCK_KEYS: ProjectDetailBlock["key"][] = [
  "overview", "before", "purpose", "role", "process", "decisions", "tools", "result", "impact", "future-use",
];
const BLOCK_LABELS: Record<string, string> = {
  overview: "프로젝트 개요", before: "기존 상황", purpose: "제작 목적", role: "담당 역할",
  process: "기획 및 제작 과정", decisions: "주요 판단", tools: "사용 도구", result: "최종 결과물",
  impact: "성과 및 의미", "future-use": "이후 활용 가능성",
};

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, { headers: { "Content-Type": "application/json" }, ...options });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "요청에 실패했습니다.");
  return data;
}

export function ProjectEditor({ initial }: { initial: Project }) {
  const [data, setData] = useState<Project>(initial);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function set<K extends keyof Project>(key: K, value: Project[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const updated = await api(`/api/admin/list/projects/${data.id}`, {
        method: "PATCH",
        body: JSON.stringify({ ...data, updatedAt: new Date().toISOString() }),
      });
      setData(updated);
      setSavedAt(new Date().toLocaleTimeString("ko-KR"));
    } catch (e: any) {
      setError(e.message || "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  function addBlock(key: ProjectDetailBlock["key"]) {
    const block: ProjectDetailBlock = {
      id: uuid(), key, title: BLOCK_LABELS[key], body: "", order: data.detailBlocks.length, visible: true,
      images: [], videos: [], compareImages: [], links: [], metrics: [],
    };
    set("detailBlocks", [...data.detailBlocks, block]);
  }
  function updateBlock(id: string, block: ProjectDetailBlock) {
    set("detailBlocks", data.detailBlocks.map((b) => (b.id === id ? block : b)));
  }
  function removeBlock(id: string) {
    set("detailBlocks", data.detailBlocks.filter((b) => b.id !== id).map((b, i) => ({ ...b, order: i })));
  }
  function moveBlock(id: string, dir: -1 | 1) {
    const blocks = [...data.detailBlocks].sort((a, b) => a.order - b.order);
    const idx = blocks.findIndex((b) => b.id === id);
    const t = idx + dir;
    if (t < 0 || t >= blocks.length) return;
    [blocks[idx], blocks[t]] = [blocks[t], blocks[idx]];
    set("detailBlocks", blocks.map((b, i) => ({ ...b, order: i })));
  }

  function addGalleryImage(m: MediaRef | undefined) {
    if (!m) return;
    set("gallery", [...data.gallery, m]);
  }
  function addMetric() {
    set("metrics", [...data.metrics, { id: uuid(), label: "", value: "" }]);
  }
  function updateMetric(id: string, patch: Partial<{ label: string; value: string; unit?: string }>) {
    set("metrics", data.metrics.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }
  function removeMetric(id: string) {
    set("metrics", data.metrics.filter((m) => m.id !== id));
  }

  const sortedBlocks = [...data.detailBlocks].sort((a, b) => a.order - b.order);
  const usedKeys = new Set(sortedBlocks.map((b) => b.key));

  return (
    <div>
      <Link href="/admin/projects" className="text-xs text-neutral-500 hover:text-neutral-300">← 프로젝트 목록으로</Link>
      <h1 className="text-2xl font-bold mt-2 mb-1">프로젝트 편집</h1>
      <p className="text-sm text-neutral-500 mb-8">{data.title || "(제목 없음)"}</p>

      <div className="grid grid-cols-2 gap-4">
        <TextField label="프로젝트 번호" value={data.number} onChange={(v) => set("number", v)} />
        <TextField label="제작 연도" value={data.year} onChange={(v) => set("year", v)} />
      </div>
      <TextField label="프로젝트명" value={data.title} onChange={(v) => set("title", v)} />
      <div className="grid grid-cols-2 gap-4 items-end">
        <TextField label="브랜드명" value={data.brand} onChange={(v) => set("brand", v)} />
        <ToggleField label="브랜드명 비공개 처리" value={data.brandHidden} onChange={(v) => set("brandHidden", v)} />
      </div>
      <SelectField
        label="작업 분야" value={data.field} onChange={(v) => set("field", v as ProjectField)}
        options={FIELD_OPTIONS.map((f) => ({ value: f, label: f }))}
      />
      <TextAreaField label="제작 목적" value={data.purpose} onChange={(v) => set("purpose", v)} rows={2} />
      <TextField label="담당 역할" value={data.role} onChange={(v) => set("role", v)} hint="촬영/보조촬영/보정/기획/편집 등 실제 역할을 구체적으로 기재하세요." />
      <TextAreaField label="상세 설명" value={data.description} onChange={(v) => set("description", v)} rows={3} />

      <div className="mb-5">
        <span className="block text-sm font-medium text-neutral-300 mb-1.5">사용 도구</span>
        <textarea
          value={data.tools.join("\n")}
          onChange={(e) => set("tools", e.target.value.split("\n"))}
          rows={3}
          placeholder="한 줄에 하나씩 입력"
          className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-orange-500"
        />
      </div>

      <MediaUpload label="대표 이미지" value={data.heroImage} onChange={(m) => set("heroImage", m)} />
      <MediaUpload label="미리보기 영상 (선택)" value={data.previewVideo} onChange={(m) => set("previewVideo", m)} accept="video/*" />
      <MediaUpload label="최종 영상 (선택)" value={data.finalVideo} onChange={(m) => set("finalVideo", m)} accept="video/*" />

      <div className="mb-5">
        <span className="block text-sm font-medium text-neutral-300 mb-1.5">상세 이미지 (갤러리)</span>
        <div className="grid grid-cols-3 gap-3 mb-2">
          {data.gallery.map((img, idx) => (
            <MediaUpload key={idx} label={`이미지 ${idx + 1}`} value={img} onChange={(m) => { if (!m) set("gallery", data.gallery.filter((_, i) => i !== idx)); else set("gallery", data.gallery.map((g, i) => (i === idx ? m : g))); }} />
          ))}
        </div>
        <MediaUpload label="이미지 추가" value={undefined} onChange={addGalleryImage} />
      </div>

      <div className="mb-5">
        <span className="block text-sm font-medium text-neutral-300 mb-1.5">성과 수치</span>
        {data.metrics.map((m) => (
          <div key={m.id} className="flex gap-2 mb-2">
            <input value={m.label} onChange={(e) => updateMetric(m.id, { label: e.target.value })} placeholder="항목명" className="flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-orange-500" />
            <input value={m.value} onChange={(e) => updateMetric(m.id, { value: e.target.value })} placeholder="값 (확인 안 되면 [자료 필요])" className="flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-orange-500" />
            <button onClick={() => removeMetric(m.id)} className="text-xs text-red-400 px-2">삭제</button>
          </div>
        ))}
        <button onClick={addMetric} className="rounded-md border border-dashed border-neutral-700 px-3 py-1.5 text-xs text-neutral-300 hover:border-orange-500">
          + 수치 추가
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ToggleField label="대표 작업으로 지정" value={data.isFeatured} onChange={(v) => set("isFeatured", v)} />
        <ToggleField label="대표 프로젝트 상세 사례로 지정" value={data.isDetailFeatured} onChange={(v) => set("isDetailFeatured", v)} hint="상세 사례는 최대 4개를 권장합니다." />
      </div>
      <div className="grid grid-cols-2 gap-4 items-start">
        <ToggleField label="공개 가능 여부 (클라이언트 승인)" value={data.publicOk} onChange={(v) => set("publicOk", v)} hint="꺼져 있으면 공개 화면에 절대 노출되지 않습니다." />
        <SelectField
          label="공개 상태" value={data.status} onChange={(v) => set("status", v as Project["status"])}
          options={[
            { value: "draft", label: "작성 중" }, { value: "review", label: "검토 중" },
            { value: "published", label: "공개" }, { value: "hidden", label: "비공개" },
          ]}
        />
      </div>

      <div className="mt-8 mb-4">
        <h2 className="text-lg font-semibold mb-1">대표 프로젝트 상세 사례 항목</h2>
        <p className="text-xs text-neutral-500 mb-4">이 프로젝트를 상세 사례로 소개할 때 사용할 항목들입니다. 필요하지 않은 항목은 삭제해도 됩니다.</p>
        {sortedBlocks.map((block, idx) => (
          <DetailBlockEditor
            key={block.id}
            block={block}
            onChange={(b) => updateBlock(block.id, b)}
            onRemove={() => removeBlock(block.id)}
            onMove={(dir) => moveBlock(block.id, dir)}
            canMoveUp={idx > 0}
            canMoveDown={idx < sortedBlocks.length - 1}
          />
        ))}
        <div className="flex flex-wrap gap-2">
          {BLOCK_KEYS.filter((k) => !usedKeys.has(k)).map((k) => (
            <button
              key={k}
              onClick={() => addBlock(k)}
              className="rounded-md border border-dashed border-neutral-700 px-3 py-1.5 text-xs text-neutral-300 hover:border-orange-500"
            >
              + {BLOCK_LABELS[k]}
            </button>
          ))}
        </div>
      </div>

      <SaveBar onSave={handleSave} saving={saving} savedAt={savedAt} error={error} />
    </div>
  );
}
