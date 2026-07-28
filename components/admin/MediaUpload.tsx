"use client";

import { useRef, useState } from "react";
import { MediaRef } from "@/lib/types";
import { MEDIA_BUCKET } from "@/lib/media-constants";

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
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const tusUploadRef = useRef<any>(null);

  // §77/§156-27 — 업로드 속도·안정성 개선. Supabase 모드에서는 브라우저가
  // Storage에 "직접" 업로드한다. 처음엔 서명된 URL로 단일 PUT
  // (uploadToSignedUrl)만 썼는데, 500MB~1GB가 넘는 영상에서는 한 번의 PUT
  // 요청이 네트워크가 잠깐만 끊겨도 처음부터 다시 올려야 했다(§156 업로드
  // 오류 로그의 원인 중 하나). 이제는 같은 서명 토큰(createSignedUploadUrl)을
  // TUS 재개형(resumable) 업로드의 x-signature 헤더로 그대로 재사용해
  // (Supabase 공식 "Presigned uploads" 방식), 6MB씩 나눠 올리고 중간에
  // 끊기면 그 지점부터 이어서 올린다. 로컬 개발(DATA_MODE=local)에서는
  // Supabase 자체가 없으므로 /api/admin/upload/sign이 mode:"local"을
  // 돌려주고, 예전 방식(파일을 서버로 보내 public/uploads에 저장) 그대로
  // 동작한다.
  async function handleFile(file: File) {
    setUploading(true);
    setProgress(0);
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
        const tus = await import("tus-js-client");
        const { supabaseResumableUploadEndpoint, supabaseAnonKey } = await import("@/lib/data/supabase-browser");

        await new Promise<void>((resolve, reject) => {
          const upload = new tus.Upload(file, {
            endpoint: supabaseResumableUploadEndpoint(),
            retryDelays: [0, 3000, 5000, 10000, 20000],
            headers: {
              "x-signature": signData.token,
              apikey: supabaseAnonKey(),
              "x-upsert": "true",
            },
            uploadDataDuringCreation: true,
            removeFingerprintOnSuccess: true,
            metadata: {
              bucketName: MEDIA_BUCKET,
              objectName: signData.path,
              contentType: file.type,
              cacheControl: "3600",
            },
            chunkSize: 6 * 1024 * 1024, // Supabase 요구사항: 현재는 6MB 고정
            onError: (err) => reject(err),
            onProgress: (sent, total) => setProgress(Math.round((sent / total) * 100)),
            onSuccess: () => resolve(),
          });
          tusUploadRef.current = upload;
          upload.findPreviousUploads().then((previous) => {
            if (previous.length > 0) upload.resumeFromPreviousUpload(previous[0]);
            upload.start();
          });
        });

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
      setProgress(null);
      tusUploadRef.current = null;
    }
  }

  function cancelUpload() {
    tusUploadRef.current?.abort();
    setUploading(false);
    setProgress(null);
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
            {uploading ? (progress !== null ? `업로드 중... ${progress}%` : "업로드 중...") : "파일 선택 / 교체"}
          </button>
          {uploading && (
            <>
              <div className="mt-2 h-1 w-48 overflow-hidden rounded-full bg-neutral-800">
                <div
                  className="h-full rounded-full bg-orange-500 transition-all"
                  style={{ width: `${progress ?? 0}%` }}
                />
              </div>
              <button
                type="button"
                onClick={cancelUpload}
                className="mt-1.5 text-xs text-neutral-500 hover:text-red-400"
              >
                업로드 취소
              </button>
            </>
          )}
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
