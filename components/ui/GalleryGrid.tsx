import { MediaRef } from "@/lib/types";
import { MediaFrame } from "@/components/ui/MediaFrame";
import { mediaSrc } from "@/lib/utils";

// §63 — 상세 이미지 갤러리에 영상도 첨부할 수 있게 했다. 사진은 기존처럼
// 정사각형으로 크롭해서 격자에 맞추지만, 영상은 크롭하지 않고 원본
// 가로세로 비율 그대로 보이도록(width 100%, height auto) 다르게
// 렌더링한다 — 격자 칸에 맞춰 폭만 맞추고 높이는 원본 비율을 따른다.
export function GalleryGrid({ items, className }: { items: MediaRef[]; className?: string }) {
  return (
    <div className={className}>
      {items.map((m, i) =>
        m.kind === "video-file" ? (
          <video
            key={i}
            src={mediaSrc(m.url)}
            poster={m.poster}
            controls
            playsInline
            className="w-full h-auto rounded-sm bg-bg-soft self-start"
          />
        ) : (
          <MediaFrame key={i} media={m} className="aspect-square rounded-sm" />
        )
      )}
    </div>
  );
}
