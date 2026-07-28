"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuid } from "uuid";
import Link from "next/link";
import { Project, ProjectField, ProjectDetailBlock, MediaRef, BeforeAfterPair } from "@/lib/types";
import { TextField, TextAreaField, SelectField, ToggleField } from "@/components/admin/fields";
import { MediaUpload } from "@/components/admin/MediaUpload";
import { SaveBar } from "@/components/admin/SaveBar";
import { DetailBlockEditor } from "@/components/admin/project/DetailBlockEditor";
import { ConfirmButton } from "@/components/admin/ConfirmButton";

const FIELD_OPTIONS: ProjectField[] = [
  "의류", "카페 및 음식", "인테리어", "인물 프로필", "치과 및 병원 광고", "유튜브", "생성형 인공지능 콘텐츠",
];

// §55 — 상세 페이지 본문 구조를 "프로젝트 개요 / 제작 의도 / 기여도 / Tools"
// 4개로 고정하면서, 여기서 고를 수 있는 보충 항목도 그 4개로 맞췄다(예전
// 10개짜리 자유 블록 중 실제로 쓰이는 4개만 남김). 이 블록은 선택 사항이며,
// 비워두면 위쪽 프로젝트 기본 정보(제작 목적/담당 역할/사용 도구/상세
// 설명)가 그대로 상세 페이지에 쓰인다 — 여기서는 사진을 곁들이거나 본문을
// 상세 페이지에서만 다르게 쓰고 싶을 때만 채우면 된다.
const BLOCK_KEYS: ProjectDetailBlock["key"][] = ["overview", "purpose", "role", "tools"];
const BLOCK_LABELS: Record<string, string> = {
  overview: "프로젝트 개요", purpose: "제작 의도", role: "기여도", tools: "Tools",
};

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, { headers: { "Content-Type": "application/json" }, ...options });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "요청에 실패했습니다.");
  return data;
}

// §62 — 구버전 데이터에 새로 추가된 배열 필드가 없어 undefined로 들어오면
// .map 호출 시 그대로 크래시하므로, 여기서 한 번에 비어있는 배열로 채워
// 넣어 방어한다.
function normalizeProject(p: Project): Project {
  return {
    ...p,
    tools: p.tools ?? [],
    gallery: p.gallery ?? [],
    contents: p.contents ?? [],
    beforeAfter: p.beforeAfter ?? [],
    metrics: p.metrics ?? [],
    detailBlocks: p.detailBlocks ?? [],
  };
}

export function ProjectEditor({ initial }: { initial: Project }) {
  const [data, setData] = useState<Project>(() => normalizeProject(initial));
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
      setData(normalizeProject(updated));
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

  // §124 — Contents(영상 전용, 드래그로 넘겨보는 영역)
  function addContentsItem(m: MediaRef | undefined) {
    if (!m) return;
    set("contents", [...data.contents, m]);
  }

  // §58 — 보정 전/후 비교(beforeAfter)는 선택 사항이다. 등록해두면 상세
  // 페이지의 대표 화면 바로 아래에 드래그로 비교하는 슬라이더가 뜨고,
  // 비워두면 그 영역 자체가 나타나지 않는다.
  function addBeforeAfter() {
    const pair: BeforeAfterPair = {
      id: uuid(),
      before: { url: "", kind: "image" },
      after: { url: "", kind: "image" },
      caption: "",
      order: data.beforeAfter.length,
    };
    set("beforeAfter", [...data.beforeAfter, pair]);
  }
  function updateBeforeAfter(id: string, patch: Partial<BeforeAfterPair>) {
    set("beforeAfter", data.beforeAfter.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }
  function removeBeforeAfter(id: string) {
    set("beforeAfter", data.beforeAfter.filter((p) => p.id !== id).map((p, i) => ({ ...p, order: i })));
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
      <TextAreaField
        label="프로젝트명"
        value={data.title}
        onChange={(v) => set("title", v)}
        rows={2}
        hint="Enter로 줄바꿈을 입력하면 상세 페이지 제목에 그대로 반영됩니다(목록 등 한 줄로 표시되는 곳에서는 자동으로 한 줄로 보입니다)."
      />
      <div className="grid grid-cols-2 gap-4 items-end">
        <TextField label="브랜드명" value={data.brand} onChange={(v) => set("brand", v)} />
        <ToggleField label="브랜드명 비공개 처리" value={data.brandHidden} onChange={(v) => set("brandHidden", v)} />
      </div>
      <SelectField
        label="작업 분야" value={data.field} onChange={(v) => set("field", v as ProjectField)}
        options={FIELD_OPTIONS.map((f) => ({ value: f, label: f }))}
      />
      <TextAreaField label="제작 의도" value={data.purpose} onChange={(v) => set("purpose", v)} rows={2} hint="상세 페이지의 '제작 의도' 섹션에 그대로 쓰입니다." />
      <TextAreaField
        label="기여도 (담당 역할)"
        value={data.role}
        onChange={(v) => set("role", v)}
        rows={2}
        hint="촬영/보조촬영/보정/기획/편집 등 실제 역할을 구체적으로 기재하세요. 상세 페이지의 '기여도' 섹션에 쓰입니다. Enter로 줄바꿈하면 상세 페이지에 그대로 반영됩니다(대표 화면 상단의 짧은 요약줄에서는 자동으로 한 줄로 보입니다)."
      />
      <TextAreaField label="상세 설명 (프로젝트 개요)" value={data.description} onChange={(v) => set("description", v)} rows={3} hint="상세 페이지의 '프로젝트 개요' 섹션에 그대로 쓰입니다." />

      <div className="mb-5">
        <span className="block text-sm font-medium text-neutral-300 mb-1.5">Tools (사용 도구)</span>
        <p className="text-xs text-neutral-500 mb-1.5">상세 페이지의 'Tools' 섹션에 태그 형태로 그대로 쓰입니다.</p>
        <textarea
          value={data.tools.join("\n")}
          onChange={(e) => set("tools", e.target.value.split("\n"))}
          rows={3}
          placeholder="한 줄에 하나씩 입력"
          className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-orange-500"
        />
      </div>

      <MediaUpload label="대표 이미지 (상세 페이지용)" value={data.heroImage} onChange={(m) => set("heroImage", m)} />
      <MediaUpload
        label="목록 미리보기 이미지/영상 (선택, 비워두면 대표 이미지 사용)"
        value={data.listPreviewMedia}
        onChange={(m) => set("listPreviewMedia", m)}
        accept="image/*,video/*"
      />
      <MediaUpload label="미리보기 영상 (선택)" value={data.previewVideo} onChange={(m) => set("previewVideo", m)} accept="video/*" />
      <MediaUpload label="최종 영상 (선택)" value={data.finalVideo} onChange={(m) => set("finalVideo", m)} accept="video/*" />

      <div className="mb-5">
        <span className="block text-sm font-medium text-neutral-300 mb-1.5">상세 이미지·영상 (갤러리)</span>
        <p className="text-xs text-neutral-500 mb-2">
          사진뿐 아니라 영상도 첨부할 수 있습니다. 영상은 정사각형으로 자르지 않고 원본 가로세로 비율 그대로 보여줍니다.
        </p>
        <div className="grid grid-cols-3 gap-3 mb-2">
          {data.gallery.map((img, idx) => (
            <MediaUpload
              key={idx}
              label={`항목 ${idx + 1}`}
              value={img}
              accept="image/*,video/*"
              onChange={(m) => { if (!m) set("gallery", data.gallery.filter((_, i) => i !== idx)); else set("gallery", data.gallery.map((g, i) => (i === idx ? m : g))); }}
            />
          ))}
        </div>
        <MediaUpload label="이미지·영상 추가" value={undefined} onChange={addGalleryImage} accept="image/*,video/*" />
      </div>

      <div className="mb-5">
        <span className="block text-sm font-medium text-neutral-300 mb-1.5">Contents (영상 전용, 선택)</span>
        <p className="text-xs text-neutral-500 mb-2">
          위 "상세 이미지·영상"과는 별도의 영역입니다. 영상만 등록할 수 있고, 상세 페이지에서 마우스로 드래그해 한 편씩 넘겨볼 수 있는 전용 칸으로 노출됩니다. 비워두면 해당 영역이 아예 보이지 않습니다.
        </p>
        <div className="grid grid-cols-3 gap-3 mb-2">
          {data.contents.map((v, idx) => (
            <MediaUpload
              key={idx}
              label={`영상 ${idx + 1}`}
              value={v}
              accept="video/*"
              onChange={(m) => { if (!m) set("contents", data.contents.filter((_, i) => i !== idx)); else set("contents", data.contents.map((c, i) => (i === idx ? m : c))); }}
            />
          ))}
        </div>
        <MediaUpload label="영상 추가" value={undefined} onChange={addContentsItem} accept="video/*" />
      </div>

      <div className="mb-5">
        <span className="block text-sm font-medium text-neutral-300 mb-1.5">보정 전·후 비교 (선택)</span>
        <p className="text-xs text-neutral-500 mb-2">
          등록하면 상세 페이지 대표 화면 아래에 드래그로 비교하는 사진이 나타납니다(왼쪽 큰 칸). 여러 장 등록하면 "이전/다음" 버튼으로 한 장씩 넘겨볼 수 있습니다. 비워두면 해당 영역이 아예 보이지 않습니다.
          {" "}
          아래 "구분"에서 각 비교쌍을 디테일컷/모델컷으로 지정하면, 두 종류가 모두 하나 이상 있을 때 상세 페이지가 "디테일컷 | 모델컷 | 프로젝트 개요~Tools" 3단 구조로 바뀌고 두 그룹의 이전/다음 넘기기가 서로 독립적으로 동작합니다. 구분을 지정하지 않으면(기본값) 지금처럼 구분 없는 단일 슬라이더로 보입니다.
        </p>
        <div className="space-y-3 mb-2">
          {data.beforeAfter.map((pair) => (
            <div key={pair.id} className="rounded-md border border-neutral-800 p-3">
              <SelectField
                label="구분"
                value={pair.category ?? ""}
                onChange={(v) => updateBeforeAfter(pair.id, { category: (v || undefined) as BeforeAfterPair["category"] })}
                options={[
                  { value: "", label: "구분 없음" },
                  { value: "detail", label: "디테일컷" },
                  { value: "model", label: "모델컷" },
                ]}
              />
              <div className="grid grid-cols-2 gap-3 mb-2">
                <MediaUpload label="보정 전" value={pair.before} onChange={(m) => m && updateBeforeAfter(pair.id, { before: m })} />
                <MediaUpload label="보정 후" value={pair.after} onChange={(m) => m && updateBeforeAfter(pair.id, { after: m })} />
              </div>
              <div className="flex gap-2 items-center">
                <input
                  value={pair.caption ?? ""}
                  onChange={(e) => updateBeforeAfter(pair.id, { caption: e.target.value })}
                  placeholder="캡션 (선택)"
                  className="flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-100 outline-none focus:border-orange-500"
                />
                <ConfirmButton label="이 비교쌍 삭제" onConfirm={() => removeBeforeAfter(pair.id)} />
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addBeforeAfter}
          className="rounded-md border border-dashed border-neutral-700 px-3 py-1.5 text-xs text-neutral-300 hover:border-orange-500"
        >
          + 보정 전·후 비교쌍 추가
        </button>
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
        <h2 className="text-lg font-semibold mb-1">상세 페이지 보충 항목 (선택)</h2>
        <p className="text-xs text-neutral-500 mb-4">
          위 프로젝트 개요/제작 의도/기여도/Tools에 사진을 곁들이거나, 상세 페이지에서만 다른 본문을 쓰고 싶을 때 추가하세요.
          채우지 않으면 위쪽 기본 정보가 그대로 상세 페이지에 쓰입니다.
        </p>
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
