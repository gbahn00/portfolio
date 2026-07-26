"use client";

// §87 — GalleryGrid는 원래 상태가 없는 순수 표시용 컴포넌트라 서버
// 컴포넌트였는데, 이제 내부에서 SlideCarousel(클라이언트 컴포넌트)에
// renderItem 함수를 prop으로 넘긴다. 서버 컴포넌트는 함수를 클라이언트
// 컴포넌트에 prop으로 넘길 수 없어서("Functions cannot be passed
// directly to Client Components") 빌드는 되지만 런타임에 에러가 났다.
// 이 파일도 "use client"로 바꿔 같은 클라이언트 경계 안에서 함수를 바로
// 전달할 수 있게 했다.
import { MediaRef } from "@/lib/types";
import { mediaSrc } from "@/lib/utils";
import { SlideCarousel } from "@/components/ui/SlideCarousel";
import { refreshScrollTrigger } from "@/lib/gsap";

// ============================================================================
// §65-69 — 상세 이미지/영상 표시 방식 변경 이력.
//
// §65-68: 이미지/영상, 가로/세로 관계없이 표시 크기가 같아야 한다는
// 요청으로 고정 비율(4:5) 박스 + object-contain을 썼는데, 이러면 가로
// 콘텐츠가 세로 박스 안에서 레터박스(좌우 여백)가 생겨 오히려 작아
// 보이는 문제가 있었다.
//
// §69 — 격자 대신 "1단 가로 배열 + 많아지면 옆으로 슬라이드"로 바꾸고,
// 고정 비율 박스 대신 "높이만 고정"하는 방식으로 바꿨다.
//
// §87 — 자유 스크롤(높이 고정 + 폭 auto)에서 SlideCarousel 기반의 진짜
// "슬라이드"(화살표/점 인디케이터로 한 장씩 넘김)로 바꿨다. 슬라이드 한
// 장에 몇 개를 나란히 보여줄지는 columns로 정한다 — 기본은 1단(한 장에
// 하나, 화면 폭 전체를 채움), 프로젝트 1번만 2단으로 호출된다.
// ============================================================================
export function GalleryGrid({
  items,
  columns = 1,
  className,
}: {
  items: MediaRef[];
  columns?: 1 | 2;
  className?: string;
}) {
  return (
    <SlideCarousel
      items={items}
      columns={columns}
      className={className}
      // §88 — 이 이미지/영상들은 높이가 고정되어 있지 않고(w-full h-auto)
      // 원본 비율대로 로드된 뒤에야 실제 높이가 정해진다. 로드가 끝난
      // 뒤에도 ScrollTrigger가 예전(더 작은) 높이를 기준으로 남아 있으면
      // 등장 모션이 실제보다 일찍 사라지므로, 로드가 끝나는 시점마다
      // 위치를 다시 계산한다.
      renderItem={(m) =>
        m.kind === "video-file" ? (
          <video
            src={mediaSrc(m.url)}
            poster={m.poster}
            controls
            playsInline
            onLoadedMetadata={refreshScrollTrigger}
            className="w-full h-auto max-h-[70vh] rounded-sm bg-bg-soft"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaSrc(m.url)}
            alt={m.alt || ""}
            onLoad={refreshScrollTrigger}
            className="w-full h-auto max-h-[70vh] rounded-sm bg-bg-soft object-contain"
          />
        )
      }
    />
  );
}
