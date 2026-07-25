"use client";

import { useState } from "react";
import { TrashEntry } from "@/lib/types";
import { ConfirmButton } from "@/components/admin/ConfirmButton";

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, { headers: { "Content-Type": "application/json" }, ...options });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "요청에 실패했습니다.");
  return data;
}

const ENTITY_LABEL: Record<string, string> = {
  timeline: "성장과정", projects: "프로젝트", competencies: "역량", achievements: "성과",
  collaborations: "협업 평가", futurePlans: "향후 계획",
};

export function TrashManager({ initial }: { initial: TrashEntry[] }) {
  const [items, setItems] = useState(initial);

  async function restore(id: string) {
    await api(`/api/admin/trash/${id}/restore`, { method: "POST" });
    setItems((is) => is.filter((i) => i.id !== id));
  }
  async function purge(id: string) {
    await api(`/api/admin/trash/${id}/purge`, { method: "DELETE" });
    setItems((is) => is.filter((i) => i.id !== id));
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">휴지통</h1>
      <p className="text-sm text-neutral-500 mb-8">실수로 삭제한 콘텐츠를 복구하거나 완전히 삭제할 수 있습니다.</p>

      {items.length === 0 && <p className="text-sm text-neutral-500 py-10 text-center">휴지통이 비어 있습니다.</p>}

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-md border border-neutral-800 px-4 py-3">
            <div>
              <p className="text-sm">
                <span className="text-orange-400">{ENTITY_LABEL[item.entity] || item.entity}</span>
                {" · "}
                {(item.data as any)?.title || (item.data as any)?.year || (item.data as any)?.name || "(제목 없음)"}
              </p>
              <p className="text-xs text-neutral-500 mt-0.5">
                {new Date(item.deletedAt).toLocaleString("ko-KR")} 삭제됨
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => restore(item.id)} className="text-xs text-neutral-300 hover:text-orange-400">복구</button>
              <ConfirmButton label="완전 삭제" confirmLabel="영구 삭제할까요?" onConfirm={() => purge(item.id)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
