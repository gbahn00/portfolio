import { MediaRef } from "@/lib/types";
import { mediaSrc } from "@/lib/utils";

// ============================================================================
// §65-69 — 상세 이미지/영상 표시 방식 변경 이력.
//
// §65-68: 이미지/영상, 가로/세로 관계없이 표시 크기가 같아야 한다는
// 요청으로 고정 비율(4:5) 박스 + object-contain을 썼는데, 이러면 가로
// 콘텐츠가 세로 박스 안에서 레터박스(좌우 여백)가 생겨 오히려 작아
// 보이는 문제가 있었다.
//
// §69 — 격자 대신 "1단 가로 배열 + 많아지면 옆으로 슬라이드"로 바꾸고,
// 고정 비율 박스 대신 "높이만 고정"하는 방식으로 바꿨다. 각 항목은
// 컨테이너 높이(h-full)만 맞추고 너비는 auto로 두어 원본 비율대로 옆으로
// 넓어지거나 좁아진다 — 세로 영상 기준 높이를 그대로 채우고, 가로
// 영상/사진은 그 높이에 맞는 비율만큼 옆으로 넓게 나온다. 레터박스(빈
// 여백)가 전혀 생기지 않는다. 컨테이너 자체의 높이는 className으로
// 호출부에서 지정한다(예: h-72 md:h-96).
// ============================================================================
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
            className="h-full w-auto shrink-0 snap-start rounded-sm bg-bg-soft"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={mediaSrc(m.url)}
            alt={m.alt || ""}
            className="h-full w-auto shrink-0 snap-start rounded-sm bg-bg-soft object-contain"
          />
        )
      )}
    </div>
  );
}
