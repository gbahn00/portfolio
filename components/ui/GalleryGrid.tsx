"use client";

// §87 — GalleryGrid는 원래 상태가 없는 순수 표시용 컴포넌트라 서버
// 컴포넌트였는데, 이제 내부에서 SlideCarousel(클라이언트 컴포넌트)에
// renderItem 함수를 prop으로 넘긴다. 서버 컴포넌트는 함수를 클라이언트
// 컴포넌트에 prop으로 넘길 수 없어서("Functions cannot be passed
// directly to Client Components") 빌드는 되지만 런타임에 에러가 났다.
// 이 파일도 "use client"로 바꿔 같은 클라이언트 경계 안에서 함수를 바로
// 전달할 수 있게 했다.
import { MediaRef } from "@/lib/types";
import { mediaSrc, optimizedImageSrc } from "@/lib/utils";
import { AutoScrollRow } from "@/components/ui/AutoScrollRow";
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
// §87-89 — 한때 슬라이드 한 장이 폭 전체를 채우는 방식으로 바꿨었는데,
// §91에서 "사진이 너무 크다 / 간격이 너무 넓다 / 한 장씩밖에 안 보인다"는
// 피드백을 받아 §69 방식(높이만 고정, 폭은 원본 비율)으로 되돌리고 화살표
// 스크롤만 SlideCarousel에서 얹었다. columns는 더 이상 쓰지 않는다 —
// 여러 장이 동시에 보이는지 여부는 화면 폭과 각 사진의 원본 비율에 따라
// 자연스럽게 정해진다.
//
// §105 — 화살표로 직접 넘기는 SlideCarousel 대신, 1번부터 끝 번호까지
// 계속 왼쪽으로 흘러가며 반복되는 자동 슬라이드(AutoScrollRow)로 교체했다.
// ============================================================================
export function GalleryGrid({ items, className }: { items: MediaRef[]; className?: string }) {
  return (
    <AutoScrollRow
      items={items}
      keyFn={(m) => m.url}
      className={className}
      // §88 — 이 이미지/영상들은 높이만 고정되고 폭은 원본 비율대로
      // 로드된 뒤에야 정확한 폭이 정해진다. 로드가 끝난 뒤에도
      // ScrollTrigger가 예전(더 작은) 크기를 기준으로 남아 있으면 등장
      // 모션이 실제보다 일찍 사라지므로, 로드가 끝나는 시점마다 위치를
      // 다시 계산한다.
      // §148 — 트랙이 항목을 두 번 이어붙이는 데다(doubled) w-auto라 폭이
      // 영상 비율에 좌우돼서, 본문 데이터는 미루되(preload="metadata")
      // 비율 정보는 먼저 받아 트랙 폭 계산(AutoScrollRow)이 틀어지지
      // 않게 한다. 이미지는 화면에 실제 필요한 시점에 지연 로드한다.
      renderItem={(m) =>
        m.kind === "video-file" ? (
          // §99 — controlsList="nodownload"로 컨트롤 바의 다운로드
          // 아이콘을 숨긴다.
          <video
            src={mediaSrc(m.url)}
            poster={m.poster}
            controls
            controlsList="nodownload noremoteplayback"
            disablePictureInPicture
            onContextMenu={(e) => e.preventDefault()}
            playsInline
            preload="metadata"
            onLoadedMetadata={refreshScrollTrigger}
            className="h-full w-auto rounded-sm bg-bg-soft"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={optimizedImageSrc(m.url, 1200)}
            alt={m.alt || ""}
            onLoad={refreshScrollTrigger}
            onContextMenu={(e) => e.preventDefault()}
            draggable={false}
            loading="lazy"
            decoding="async"
            className="h-full w-auto rounded-sm bg-bg-soft object-contain"
          />
        )
      }
    />
  );
}
