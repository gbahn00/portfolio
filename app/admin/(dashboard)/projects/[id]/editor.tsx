"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuid } from "uuid";
import Link from "next/link";
import { Project, ProjectField, ProjectDetailBlock, MediaRef, BeforeAfterPair } from "@/lib/types";
import { TextField, TextAreaField, SelectField, ToggleField, FieldGroup, NumberField } from "@/components/admin/fields";
import { MediaUpload } from "@/components/admin/MediaUpload";
import { SaveBar } from "@/components/admin/SaveBar";
import { DetailBlockEditor } from "@/components/admin/project/DetailBlockEditor";
import { RetouchMarkerEditor } from "@/components/admin/project/RetouchMarkerEditor";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { TOOL_ICON_MAP, TOOL_ICON_ORDER } from "@/lib/tool-icons";

const FIELD_OPTIONS: ProjectField[] = [
  "의류", "카페 및 음식", "인테리어", "인물 프로필", "치과 및 병원 광고", "유튜브", "생성형 인공지능 콘텐츠",
];

// §55 — 상세 페이지 본문 구조를 "프로젝트 개요 / 제작 의도 / 기여도" 3개로
// 고정하면서, 여기서 고를 수 있는 보충 항목도 그 3개로 맞췄다(예전 10개짜리
// 자유 블록 중 실제로 쓰이는 것만 남김). 이 블록은 선택 사항이며, 비워두면
// 위쪽 프로젝트 기본 정보(제작 목적/담당 역할/상세 설명)가 그대로 상세
// 페이지에 쓰인다 — 여기서는 사진을 곁들이거나 본문을 상세 페이지에서만
// 다르게 쓰고 싶을 때만 채우면 된다.
// §137 — "Tools"는 자유 텍스트/이미지 보충 블록에서 빠졌다. 이제 아래
// "Tools (사용 프로그램)" FieldGroup에서 아이콘을 선택하는 방식으로만
// 관리한다(자유 입력 항목이 아니게 됨에 따라 이 보충 블록 목록에서 제외).
const BLOCK_KEYS: ProjectDetailBlock["key"][] = ["overview", "purpose", "role"];
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
  // §135 — beforeAfterFallbackMedia가 단일 객체(§131)에서 배열로
  // 바뀌면서, 예전에 저장된 단일 객체 데이터도 배열로 감싸 안전하게
  // 편집할 수 있게 한다.
  const rawFallback = p.beforeAfterFallbackMedia as unknown;
  const fallbackArr = Array.isArray(rawFallback)
    ? (rawFallback as Project["beforeAfterFallbackMedia"])
    : rawFallback && typeof rawFallback === "object"
      ? [rawFallback as MediaRef]
      : [];
  return {
    ...p,
    tools: p.tools ?? [],
    gallery: p.gallery ?? [],
    contents: p.contents ?? [],
    beforeAfter: p.beforeAfter ?? [],
    metrics: p.metrics ?? [],
    detailBlocks: p.detailBlocks ?? [],
    beforeAfterFallbackMedia: fallbackArr,
    retouchMarkers: p.retouchMarkers ?? [],
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

  // §135 — 보정 전후 없을 때 대체 이미지·영상. 단일 필드에서 목록으로
  // 바뀌어 갤러리/Contents와 같은 방식(추가 → 그리드에 항목별 업로드칸)으로
  // 관리한다. 항목을 지우면(빈 값으로 변경) 그 인덱스를 참조하던
  // 보정 위치 마커도 함께 정리한다(밀려서 다른 사진을 가리키는 것 방지).
  const fallbackMediaList = data.beforeAfterFallbackMedia ?? [];
  function addFallbackMedia(m: MediaRef | undefined) {
    if (!m) return;
    set("beforeAfterFallbackMedia", [...fallbackMediaList, m]);
  }
  function updateFallbackMedia(idx: number, m: MediaRef | undefined) {
    if (!m) {
      set("beforeAfterFallbackMedia", fallbackMediaList.filter((_, i) => i !== idx));
      set("retouchMarkers", (data.retouchMarkers ?? []).filter((mk) => mk.mediaIndex !== idx).map((mk) => (mk.mediaIndex > idx ? { ...mk, mediaIndex: mk.mediaIndex - 1 } : mk)));
    } else {
      set("beforeAfterFallbackMedia", fallbackMediaList.map((g, i) => (i === idx ? m : g)));
    }
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

      <FieldGroup title="기본 정보">
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
      </FieldGroup>

      <FieldGroup title="텍스트" hint="상세 페이지의 '프로젝트 개요 / 제작 의도 / 기여도 / Tools' 섹션에 그대로 쓰입니다.">
        <TextAreaField label="제작 의도" value={data.purpose} onChange={(v) => set("purpose", v)} rows={2} />
        <TextAreaField
          label="기여도 (담당 역할)"
          value={data.role}
          onChange={(v) => set("role", v)}
          rows={2}
          hint="촬영/보조촬영/보정/기획/편집 등 실제 역할을 구체적으로 기재하세요. Enter로 줄바꿈하면 상세 페이지에 그대로 반영됩니다(대표 화면 상단의 짧은 요약줄에서는 자동으로 한 줄로 보입니다)."
        />
        <NumberField
          label="기여도 퍼센트 (선택)"
          value={data.contributionPercentage}
          onChange={(v) => set("contributionPercentage", v)}
          hint="입력하면 상세 페이지 '기여도' 제목 옆에 예: 70% 형태로 표시됩니다. 비워두면 표시되지 않습니다."
        />
        <TextAreaField label="상세 설명 (프로젝트 개요)" value={data.description} onChange={(v) => set("description", v)} rows={3} />
      </FieldGroup>

      <FieldGroup
        title="Tools (사용 프로그램)"
        hint='자유 입력이 아니라 Skill 페이지(프로필 → 핵심 수치 → Skills)에 등록된 아이콘 중에서 이 프로젝트에 사용한 도구를 선택합니다. 상세 페이지에는 아이콘만 나오고 도구명은 표시되지 않으며, 커서를 올리면 이름이 툴팁으로 보입니다. 같은 아이콘은 중복 선택할 수 없습니다.'
      >
        <div className="flex flex-wrap gap-2.5 mb-3">
          {TOOL_ICON_ORDER.map((name) => {
            const selected = data.tools.includes(name);
            return (
              <button
                key={name}
                type="button"
                onClick={() => set("tools", selected ? data.tools.filter((t) => t !== name) : [...data.tools, name])}
                className={`flex flex-col items-center gap-1.5 rounded-lg border p-2.5 w-[76px] transition-colors ${
                  selected ? "border-orange-500 bg-orange-500/10" : "border-neutral-700 hover:border-neutral-500"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={TOOL_ICON_MAP[name]} alt={name} className="h-9 w-9 rounded-md object-cover" />
                <span className="text-[10px] text-neutral-400 text-center leading-tight">{name}</span>
              </button>
            );
          })}
        </div>
        {data.tools.filter((t) => TOOL_ICON_MAP[t]).length > 0 && (
          <div className="flex flex-wrap gap-2 pt-3 border-t border-neutral-800">
            {data.tools.filter((t) => TOOL_ICON_MAP[t]).map((name) => (
              <span key={name} className="flex items-center gap-1.5 rounded-full border border-neutral-700 pl-1 pr-2 py-1 text-xs text-neutral-300">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={TOOL_ICON_MAP[name]} alt="" className="h-5 w-5 rounded object-cover" />
                {name}
                <button
                  type="button"
                  onClick={() => set("tools", data.tools.filter((t) => t !== name))}
                  className="ml-1 text-neutral-500 hover:text-red-400"
                  aria-label={`${name} 제거`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </FieldGroup>

      <FieldGroup title="대표·목록 사진·영상">
        <MediaUpload label="대표 이미지 (상세 페이지용)" value={data.heroImage} onChange={(m) => set("heroImage", m)} />
        <MediaUpload
          label="목록 미리보기 이미지/영상 (선택, 비워두면 대표 이미지 사용)"
          value={data.listPreviewMedia}
          onChange={(m) => set("listPreviewMedia", m)}
          accept="image/*,video/*"
        />
        <MediaUpload label="미리보기 영상 (선택)" value={data.previewVideo} onChange={(m) => set("previewVideo", m)} accept="video/*" hint="⚠️ 현재 화면에는 표시되지 않습니다(참고용)." />
        <MediaUpload label="최종 영상 (선택)" value={data.finalVideo} onChange={(m) => set("finalVideo", m)} accept="video/*" hint="상세 페이지의 '결과물 영상' 큰 블록에 쓰입니다." />
      </FieldGroup>

      <FieldGroup title="상세 이미지·영상 (갤러리)" hint="사진뿐 아니라 영상도 첨부할 수 있습니다. 영상은 정사각형으로 자르지 않고 원본 가로세로 비율 그대로 보여줍니다. 상세 페이지의 '상세 이미지' 구역에 자동 반복 스크롤로 나타납니다.">
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
      </FieldGroup>

      <FieldGroup title="Contents (영상 전용, 선택)" hint='위 "상세 이미지·영상"과는 별도의 영역입니다. 영상만 등록할 수 있고, 상세 페이지에서 마우스로 드래그해 한 편씩 넘겨볼 수 있는 전용 칸으로 노출됩니다. 비워두면 해당 영역이 아예 보이지 않습니다.'>
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
      </FieldGroup>

      <FieldGroup
        title="보정 전·후 비교 (선택)"
        hint='등록하면 상세 페이지 대표 화면 아래에 드래그로 비교하는 사진이 나타납니다(왼쪽 큰 칸). 여러 장 등록하면 "이전/다음" 버튼으로 한 장씩 넘겨볼 수 있습니다. 비워두면 해당 영역이 아예 보이지 않습니다. "구분"에서 각 비교쌍을 디테일컷/모델컷으로 지정하면, 두 종류가 모두 하나 이상 있을 때 상세 페이지가 "디테일컷 | 모델컷 | 프로젝트 개요~Tools" 3단 구조로 바뀌고 두 그룹의 이전/다음 넘기기가 서로 독립적으로 동작합니다. 구분을 지정하지 않으면(기본값) 지금처럼 구분 없는 단일 슬라이더로 보입니다.'
      >
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
                <MediaUpload label="보정 후" value={pair.after} onChange={(m) => m && updateBeforeAfter(pair.id, { after: m })} showFocus />
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
      </FieldGroup>

      <FieldGroup
        title="보정 전후 없을 때 대체 이미지·영상 (선택)"
        hint='위 "보정 전·후 비교"가 하나도 없는 프로젝트는 상세 페이지의 그 자리가 텍스트만으로 채워지는데, 여기에 이미지·영상을 등록하면 그 자리에 대신 나타납니다(왼쪽 사진/영상 + 오른쪽 프로젝트 개요~Tools). 여러 장 등록하면 보정 전·후 비교와 같은 방식으로 화살표(‹ ›)를 눌러 이전/다음 사진을 볼 수 있습니다. 비워두면 위쪽 "대표 이미지"를 자동으로 대신 씁니다. 보정 전·후 비교가 하나라도 있으면 이 항목은 쓰이지 않습니다. 사진 영역의 높이는 항상 오른쪽 텍스트 칸 높이에 정확히 맞춰지고, 폭은 원본 비율 그대로 자연스럽게 정해집니다(여백·크롭 없음). 다만 사진이 아주 가로로 넓어 옆 텍스트 칸을 침범할 정도면 그때만 살짝 잘리는데, 이런 경우 아래 "피사체 위치"에서 남길 쪽을 지정할 수 있습니다.'
      >
        <div className="grid grid-cols-3 gap-3 mb-2">
          {fallbackMediaList.map((item, idx) => (
            <MediaUpload
              key={idx}
              label={`항목 ${idx + 1}`}
              value={item}
              accept="image/*,video/*"
              onChange={(m) => updateFallbackMedia(idx, m)}
              showFocus
            />
          ))}
        </div>
        <MediaUpload label="이미지·영상 추가" value={undefined} onChange={addFallbackMedia} accept="image/*,video/*" />

        <div className="mt-4 pt-4 border-t border-neutral-800">
          <SelectField
            label="레이아웃"
            value={data.beforeAfterFallbackLayout ?? "auto"}
            onChange={(v) => set("beforeAfterFallbackLayout", v === "half" ? "half" : undefined)}
            options={[
              { value: "auto", label: "자동 (사진 원본 비율 유지, 기본값)" },
              { value: "half", label: "좌우 50/50 분할 (사진이 왼쪽 절반을 꽉 채움 — 예: 인물 프로필)" },
            ]}
            hint='"좌우 50/50 분할"을 선택하면 사진이 화면 좌측 절반을 채우고(필요하면 잘림), 텍스트는 우측 절반에 배치됩니다.'
          />
        </div>

        <div className="mt-4 pt-4 border-t border-neutral-800">
          <span className="block text-sm font-medium text-neutral-300 mb-1.5">보정 위치 표시 (선택)</span>
          <p className="text-xs text-neutral-500 mb-2">
            사진에서 보정한 위치를 표시해두면, 공개 상세 페이지에서 그 위치에 커서를 올렸을 때 설명이 나타납니다.
          </p>
          <RetouchMarkerEditor
            media={fallbackMediaList}
            markers={data.retouchMarkers ?? []}
            onChange={(markers) => set("retouchMarkers", markers)}
          />
        </div>
      </FieldGroup>

      <FieldGroup title="성과 수치" hint="⚠️ 현재 상세 페이지 어디에도 표시되지 않습니다(참고용).">
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
      </FieldGroup>

      <FieldGroup title="노출·공개 설정">
        <div className="grid grid-cols-2 gap-4">
          <ToggleField label="대표 작업으로 지정" value={data.isFeatured} onChange={(v) => set("isFeatured", v)} hint="⚠️ 현재 목록 화면의 참고용 태그일 뿐, 실제 노출 순서에는 영향이 없습니다." />
          <ToggleField label="대표 프로젝트 상세 사례로 지정" value={data.isDetailFeatured} onChange={(v) => set("isDetailFeatured", v)} hint="⚠️ 위와 마찬가지로 참고용 태그입니다." />
        </div>
        <div className="grid grid-cols-2 gap-4 items-start">
          <ToggleField label="공개 가능 여부 (클라이언트 승인)" value={data.publicOk} onChange={(v) => set("publicOk", v)} hint="실제로 작동합니다 — 꺼져 있으면 공개 화면에 절대 노출되지 않습니다." />
          <SelectField
            label="공개 상태" value={data.status} onChange={(v) => set("status", v as Project["status"])}
            options={[
              { value: "draft", label: "작성 중" }, { value: "review", label: "검토 중" },
              { value: "published", label: "공개" }, { value: "hidden", label: "비공개" },
            ]}
            hint="⚠️ 현재 실제 노출에는 반영되지 않습니다(위 '공개 가능 여부'만 실제로 작동합니다)."
          />
        </div>
      </FieldGroup>

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
