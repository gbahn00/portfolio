"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Project } from "@/lib/types";
import { ConfirmButton } from "@/components/admin/ConfirmButton";

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, { headers: { "Content-Type": "application/json" }, ...options });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "요청에 실패했습니다.");
  return data;
}

const STATUS_LABEL: Record<string, string> = { draft: "작성 중", review: "검토 중", published: "공개", hidden: "비공개" };

export function ProjectsList({ initial }: { initial: Project[] }) {
  const [items, setItems] = useState(initial);
  const router = useRouter();
  const sorted = [...items].sort((a, b) => a.order - b.order);

  async function addProject() {
    const created = await api("/api/admin/list/projects", {
      method: "POST",
      body: JSON.stringify({
        number: "", title: "새 프로젝트", brand: "", brandHidden: true, year: String(new Date().getFullYear()),
        field: "의류", purpose: "", role: "", tools: [], description: "", gallery: [], beforeAfter: [],
        metrics: [], detailBlocks: [], isFeatured: false, isDetailFeatured: false, publicOk: false, status: "draft",
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      }),
    });
    router.push(`/admin/projects/${created.id}`);
  }

  async function move(id: string, dir: -1 | 1) {
    const idx = sorted.findIndex((i) => i.id === id);
    const t = idx + dir;
    if (t < 0 || t >= sorted.length) return;
    const copy = [...sorted];
    [copy[idx], copy[t]] = [copy[t], copy[idx]];
    setItems(copy.map((i, ix) => ({ ...i, order: ix })));
    await api("/api/admin/list/projects/reorder", { method: "POST", body: JSON.stringify({ orderedIds: copy.map((i) => i.id) }) });
  }

  async function duplicate(id: string) {
    const copy = await api(`/api/admin/list/projects/${id}/duplicate`, { method: "POST" });
    setItems((is) => [...is, copy]);
  }

  async function remove(id: string) {
    await api(`/api/admin/list/projects/${id}`, { method: "DELETE" });
    setItems((is) => is.filter((i) => i.id !== id));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">프로젝트 관리</h1>
          <p className="text-sm text-neutral-500">대표 작업 프로젝트를 추가·수정·삭제·순서 변경합니다.</p>
        </div>
        <button onClick={addProject} className="rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-400">
          + 새 프로젝트
        </button>
      </div>

      <div className="space-y-2">
        {sorted.map((p, idx) => (
          <div key={p.id} className="flex items-center gap-3 rounded-md border border-neutral-800 px-4 py-3">
            <div className="flex flex-col gap-1">
              <button onClick={() => move(p.id, -1)} disabled={idx === 0} className="text-neutral-400 disabled:opacity-30 text-xs">↑</button>
              <button onClick={() => move(p.id, 1)} disabled={idx === sorted.length - 1} className="text-neutral-400 disabled:opacity-30 text-xs">↓</button>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Link href={`/admin/projects/${p.id}`} className="text-sm font-medium hover:text-orange-400 truncate">
                  {p.title || "(제목 없음)"}
                </Link>
                {p.isFeatured && <span className="text-[10px] rounded-full bg-orange-500/20 text-orange-400 px-2 py-0.5">대표</span>}
                {p.isDetailFeatured && <span className="text-[10px] rounded-full bg-blue-500/20 text-blue-400 px-2 py-0.5">상세 사례</span>}
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">{p.field} · {p.year} · {STATUS_LABEL[p.status]} · {p.publicOk ? "공개 가능" : "공개 미승인"}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link href={`/admin/projects/${p.id}`} className="text-xs text-neutral-400 hover:text-neutral-100">편집</Link>
              <button onClick={() => duplicate(p.id)} className="text-xs text-neutral-400 hover:text-neutral-100">복제</button>
              <ConfirmButton label="삭제" onConfirm={() => remove(p.id)} />
            </div>
          </div>
        ))}
      </div>

      {sorted.length === 0 && <p className="text-sm text-neutral-500 py-10 text-center">등록된 프로젝트가 없습니다.</p>}
    </div>
  );
}
