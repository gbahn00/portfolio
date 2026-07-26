import { MediaRef } from "@/lib/types";
import { mediaSrc } from "@/lib/utils";

// §65-67 — 이미지/영상, 가로/세로 관계없이 상세 화면에서 보이는 "표시
// 크기"는 항상 같은 규격이어야 한다는 요청. 그리드 칸을 고정 비율(4:3)
// 박스로 통일하고, 그 안에서 원본 해상도·비율은 그대로 유지한 채
// object-fit: contain으로 박스에 맞춰 넣는다 — 자르지 않고, 남는 공간은
// 배경색으로 채워진다. 가로 영상도 세로 영상도, 가로 사진도 세로 사진도
// 항상 똑같은 크기의 박스 안에 나온다.
export function GalleryGrid({ items, className }: { items: MediaRef[]; className?: string }) {
  return (
    <div className={className}>
      {items.map((m, i) => (
        <div
          key={i}
          className="relative aspect-[4/3] overflow-hidden rounded-sm bg-bg-soft flex items-center justify-center"
        >
          {m.kind === "video-file" ? (
            <video
              src={mediaSrc(m.url)}
              poster={m.poster}
              controls
              playsInline
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mediaSrc(m.url)} alt={m.alt || ""} className="max-h-full max-w-full object-contain" />
          )}
        </div>
      ))}
    </div>
  );
}
