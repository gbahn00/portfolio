"use client";

import { v4 as uuid } from "uuid";

export interface OrderedText {
  id: string;
  text: string;
  order: number;
}

export function TextListEditor({
  label, items, onChange, placeholder, multiline, hint,
}: {
  label: string;
  items: OrderedText[];
  onChange: (items: OrderedText[]) => void;
  placeholder?: string;
  // §72 — 기본은 한 줄짜리 input(태그/키워드처럼 줄바꿈이 필요 없는
  // 항목용)이다. multiline을 켜면 textarea로 바뀌어 문단처럼 관리자가
  // 직접 원하는 위치에서 Enter로 줄을 나눌 수 있다 — 입력한 줄바꿈은
  // 공개 화면에서도 whitespace-pre-line으로 그대로 보여진다.
  multiline?: boolean;
  hint?: string;
}) {
  const sorted = [...items].sort((a, b) => a.order - b.order);

  function update(id: string, text: string) {
    onChange(sorted.map((i) => (i.id === id ? { ...i, text } : i)));
  }
  function remove(id: string) {
    onChange(sorted.filter((i) => i.id !== id).map((i, idx) => ({ ...i, order: idx })));
  }
  function add() {
    onChange([...sorted, { id: uuid(), text: "", order: sorted.length }]);
  }
  function move(id: string, dir: -1 | 1) {
    const idx = sorted.findIndex((i) => i.id === id);
    const target = idx + dir;
    if (target < 0 || target >= sorted.length) return;
    const copy = [...sorted];
    [copy[idx], copy[target]] = [copy[target], copy[idx]];
    onChange(copy.map((i, ix) => ({ ...i, order: ix })));
  }

  return (
    <div className="mb-5">
      <span className="block text-sm font-medium text-neutral-300 mb-1.5">{label}</span>
      {hint && <span className="block text-xs text-neutral-500 mb-1.5">{hint}</span>}
      <div className="space-y-2">
        {sorted.map((item, idx) => (
          <div key={item.id} className={multiline ? "flex items-start gap-2" : "flex items-center gap-2"}>
            {multiline ? (
              <textarea
                value={item.text}
                rows={3}
                placeholder={placeholder}
                onChange={(e) => update(item.id, e.target.value)}
                className="flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-orange-500 resize-y"
              />
            ) : (
              <input
                type="text"
                value={item.text}
                placeholder={placeholder}
                onChange={(e) => update(item.id, e.target.value)}
                className="flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-orange-500"
              />
            )}
            <div className={multiline ? "flex flex-col gap-1 pt-1" : "flex items-center gap-2"}>
              <button type="button" onClick={() => move(item.id, -1)} disabled={idx === 0} className="text-neutral-400 hover:text-neutral-100 disabled:opacity-30 px-1">↑</button>
              <button type="button" onClick={() => move(item.id, 1)} disabled={idx === sorted.length - 1} className="text-neutral-400 hover:text-neutral-100 disabled:opacity-30 px-1">↓</button>
              <button type="button" onClick={() => remove(item.id)} className="text-red-400 hover:text-red-300 px-1 text-sm">삭제</button>
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={add}
        className="mt-2 rounded-md border border-dashed border-neutral-700 px-3 py-1.5 text-xs text-neutral-300 hover:border-orange-500"
      >
        + 항목 추가
      </button>
    </div>
  );
}
