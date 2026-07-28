"use client";

import { useRef, useState } from "react";
import { MediaRef } from "@/lib/types";

// §138 — "좌측 이미지 높이를 텍스트 칸에 맞추고 object-fit: cover를
// 쓰되, 얼굴 등 주요 피사체가 잘리지 않도록 object-position을 조절할 수
// 있게 해달라"는 요청. showFocus를 true로 켠 곳(현재는 프로젝트 편집의
// "대체 이미지·영상" 목록)에서만 세로 위치 조절 버튼(상단/중앙/하단)이
// 나타난다 — 사이트 전체 MediaUpload에 항상 보이면 대부분의 용도(크롭이
// 일어나지 않는 자리)에서는 불필요한 UI라 옵션으로 뺐다.
const FOCUS_Y_OPTIONS: { value: number; label: string }[] = [
  { value: 15, label: "상단" },
  { value: 50, label: "중앙" },
  { value: 85, label: "하단" },
];

export function MediaUpload({
  label, value, onChange, accept = "image/*", hint, showFocus,
}: { label: string; value?: MediaRef; onChange: (m: MediaRef | undefined) => void; accept?: string; hint?: string; showFocus?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // §77 — 업로드 속도 개선. Supabase 모드에서는 브라우저가 Supabase
  // Storage에 "직접" 업로드한다(서명된 업로드 URL 사용). 예전에는 파일
  // 전체가 브라우저 → Vercel 서버리스 함수 → Supabase Storage 순으로 두 번
  // 실려 나갔는데, 특히 용량이 큰 영상에서 이 중간 홉이 체감 지연의 큰
  // 원인이었다. 로컬 개발(DATA_MODE=local)에서는 Supabase 자체가 없으므로
  // /api/admin/upload/sign이 mode:"local"을 돌려주고, 그러면 예전 방식
  // (파일을 서버로 보내 public/uploads에 저장) 그대로 동작한다.
  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const signRes = await fetch("/api/admin/upload/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });
      const signData = await signRes.json();
      if (!signRes.ok) throw new Error(signData.error || "업로드 준비에 실패했습니다.");

      if (signData.mode === "supabase") {
        const { supabaseBrowserClient } = await import("@/lib/data/supabase-browser");
        const { MEDIA_BUCKET } = await import("@/lib/media-constants");
        const sb = supabaseBrowserClient();
        const { error: uploadError } = await sb.storage
          .from(MEDIA_BUCKET)
          .uploadToSignedUrl(signData.path, signData.token, file, { contentType: file.type });
        if (uploadError) throw uploadError;
        onChange({ url: signData.publicUrl, kind: signData.kind, alt: value?.alt || "" });
      } else {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/admin/upload", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "업로드에 실패했습니다.");
        onChange({ url: data.url, kind: data.kind, alt: value?.alt || "" });
      }
    } catch (e: any) {
      setError(e.message || "업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mb-5">
      <span className="block text-sm font-medium text-neutral-300 mb-1.5">{label}</span>
      {hint && <p className="text-xs text-neutral-500 mb-1.5">{hint}</p>}
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
          {showFocus && value?.url && value.kind !== "video-file" && (
            <div className="mt-2">
              <span className="block text-[11px] text-neutral-500 mb-1">
                피사체 위치 (사진이 잘려야 할 때 어느 쪽을 남길지)
              </span>
              <div className="flex gap-1.5">
                {FOCUS_Y_OPTIONS.map((opt) => {
                  const selected = (value.focusY ?? 50) === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => onChange({ ...value, focusY: opt.value })}
                      className={`rounded-md border px-2.5 py-1 text-xs ${
                        selected ? "border-orange-500 text-orange-400" : "border-neutral-700 text-neutral-400"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
        </div>
      </div>
    </div>
  );
}
