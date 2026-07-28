"use client";

import { useRef, useState } from "react";
import { v4 as uuid } from "uuid";
import { MediaRef, RetouchMarker } from "@/lib/types";

// ============================================================================
// §135 — "인물 프로필 사진에는 내가 보정한 곳이 어디인지 설정하여서, 그
// 위치에 커서를 가져갔을 때 어떤 부분이 수정됐는지 확인할 수 있게 해달라"
// 는 요청. 관리자는 사진을 클릭해 마커를 찍고 설명을 입력하면, 공개
// 상세 페이지(RepresentativeMediaColumn)에서 같은 위치에 점이 표시되고
// 커서를 올리면 설명이 뜬다.
//
// 좌표는 사진 원본 전체를 기준으로 한 퍼센트(0~100)로 저장한다. 사진을
// object-cover로 꽉 채우는 half 레이아웃에서는 화면 비율에 따라 가장자리
// 일부가 잘릴 수 있어, 잘리는 가장자리에 마커를 두면 라이브 화면에서는
// 안 보일 수 있다 — 인물이 보통 중앙에 위치하므로 중앙 위주로 표시하면
// 문제가 없다.
// ============================================================================

export function RetouchMarkerEditor({
  media,
  markers,
  onChange,
}: {
  media: MediaRef[];
  markers: RetouchMarker[];
  onChange: (markers: RetouchMarker[]) => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const imgWrapRef = useRef<HTMLDivElement>(null);

  const images = media.filter((m) => m?.url && m.kind !== "video-file");
  if (images.length === 0) {
    return (
      <p className="text-xs text-neutral-500">
        먼저 위 "대체 이미지·영상"에 사진을 첨부해야 보정 위치를 표시할 수 있습니다(영상에는 표시할 수 없습니다).
      </p>
    );
  }

  const activeImage = images[Math.min(activeIndex, images.length - 1)];
  // §135 — 마커의 mediaIndex는 공개 페이지가 쓰는 원본 media 배열(영상
  // 포함) 기준 인덱스와 일치해야 하므로, 여기서 이미지 전용 목록(images)의
  // 인덱스가 아니라 원본 배열에서의 실제 위치를 찾아 사용한다.
  const currentRealIndex = media.findIndex((m) => m === activeImage);
  const currentMarkers = markers.filter((m) => m.mediaIndex === currentRealIndex).sort((a, b) => a.order - b.order);

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = imgWrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.round((((e.clientX - rect.left) / rect.width) * 100) * 10) / 10;
    const y = Math.round((((e.clientY - rect.top) / rect.height) * 100) * 10) / 10;
    const marker: RetouchMarker = {
      id: uuid(),
      mediaIndex: currentRealIndex,
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
      label: "",
      order: markers.length,
    };
    onChange([...markers, marker]);
  }

  function updateMarker(id: string, patch: Partial<RetouchMarker>) {
    onChange(markers.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }
  function removeMarker(id: string) {
    onChange(markers.filter((m) => m.id !== id));
  }

  return (
    <div>
      {images.length > 1 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`rounded-md border px-2.5 py-1 text-xs ${
                i === activeIndex ? "border-orange-500 text-orange-400" : "border-neutral-700 text-neutral-400"
              }`}
            >
              사진 {i + 1}
            </button>
          ))}
        </div>
      )}
      <p className="text-xs text-neutral-500 mb-2">사진에서 보정한 위치를 클릭하면 마커가 추가됩니다.</p>
      <div
        ref={imgWrapRef}
        onClick={handleClick}
        className="relative w-full max-w-md rounded-md overflow-hidden border border-neutral-700 cursor-crosshair select-none"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={activeImage.url} alt="" className="block w-full h-auto pointer-events-none" draggable={false} />
        {currentMarkers.map((m, i) => (
          <div
            key={m.id}
            className="absolute h-5 w-5 -mt-2.5 -ml-2.5 flex items-center justify-center rounded-full border-2 border-white bg-orange-500 text-[10px] font-semibold text-white shadow"
            style={{ left: `${m.x}%`, top: `${m.y}%` }}
          >
            {i + 1}
          </div>
        ))}
      </div>
      <div className="mt-3 space-y-2">
        {currentMarkers.map((m, i) => (
          <div key={m.id} className="flex items-center gap-2">
            <span className="text-xs text-neutral-500 w-5 shrink-0">{i + 1}</span>
            <input
              value={m.label}
              onChange={(e) => updateMarker(m.id, { label: e.target.value })}
              placeholder="이 위치에서 보정한 내용을 입력하세요 (예: 피부 톤 보정)"
              className="flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-100 outline-none focus:border-orange-500"
            />
            <button type="button" onClick={() => removeMarker(m.id)} className="text-xs text-red-400 px-2 shrink-0">
              삭제
            </button>
          </div>
        ))}
        {currentMarkers.length === 0 && <p className="text-xs text-neutral-600">아직 등록된 마커가 없습니다. 위 사진을 클릭해 추가하세요.</p>}
      </div>
    </div>
  );
}
