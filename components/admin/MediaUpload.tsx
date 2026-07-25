"use client";

import { useRef, useState } from "react";
import { MediaRef } from "@/lib/types";

export function MediaUpload({
  label, value, onChange, accept = "image/*",
}: { label: string; value?: MediaRef; onChange: (m: MediaRef | undefined) => void; accept?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "업로드에 실패했습니다.");
      onChange({ url: data.url, kind: data.kind, alt: value?.alt || "" });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mb-5">
      <span className="block text-sm font-medium text-neutral-300 mb-1.5">{label}</span>
      <div className="flex items-start gap-3">
        <div className="h-24 w-32 shrink-0 overflow-hidden rounded-md bg-neutral-800 border border-neutral-700 flex items-center justify-center">
          {value?.url ? (
            value.kind?.startsWith("video") ? (
              <video src={value.url} className="h-full w-full object-cover" muted />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={value.url} alt={value.alt || ""} className="h-full w-full object-cover" />
            )
          ) : (
            <span className="text-xs text-neutral-500">미리보기 없음</span>
          )}
        </div>
        <div className="flex-1">
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="rounded-md border border-neutral-700 px-3 py-1.5 text-xs text-neutral-200 hover:border-orange-500 disabled:opacity-50"
          >
            {uploading ? "업로드 중..." : "파일 선택 / 교체"}
          </button>
          {value?.url && (
            <button
              type="button"
              onClick={() => onChange(undefined)}
              className="ml-2 rounded-md border border-neutral-700 px-3 py-1.5 text-xs text-neutral-400 hover:border-red-500 hover:text-red-400"
            >
              제거
            </button>
          )}
          {value?.url && (
            <input
              type="text"
              placeholder="대체 설명(alt) 입력"
              value={value.alt || ""}
              onChange={(e) => onChange({ ...value, alt: e.target.value })}
              className="mt-2 w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-100 outline-none focus:border-orange-500"
            />
          )}
          {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
        </div>
      </div>
    </div>
  );
}
