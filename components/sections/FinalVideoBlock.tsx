"use client";

import { MediaRef } from "@/lib/types";
import { mediaSrc } from "@/lib/utils";
import { refreshScrollTrigger } from "@/lib/gsap";

// §89 — 이 영상은 폭만 꽉 채우고(w-full) 높이는 원본 비율대로 자동
// 결정되는데(h-auto), 로드가 끝나기 전까지는 실제 높이를 알 수 없다.
// 페이지(app/projects/[id]/page.tsx)는 서버 컴포넌트라 <video>에
// onLoadedMetadata 같은 이벤트 핸들러를 직접 넣을 수 없어서("Event
// handlers cannot be passed to Client Component props") 이 부분만 별도
// 클라이언트 컴포넌트로 분리했다. 로드가 끝나는 시점에 ScrollTrigger를
// 다시 계산해, 영상 높이가 늦게 확정되면서 등장 모션이 일찍 사라지는
// 문제를 막는다.
// §109 — 상세 페이지 대표 화면(ProjectCover)을 제외한 나머지 구간은
// 스크롤에 따라 나타났다 사라지는 모션(Reveal)을 전부 뺐다. 이 영상
// 블록도 더 이상 <Reveal>로 감싸지 않고 바로 보여준다.
export function FinalVideoBlock({ video, posterFallback }: { video: MediaRef; posterFallback?: string }) {
  return (
    <div>
      <h2 className="text-2xl md:text-3xl font-semibold mb-4 text-korean">결과물 영상</h2>
      {/* §68 — 여기는 영상이 하나뿐이라(격자로 나란히 놓고 비교할 필요가
          없음) 고정 박스로 강제로 자르거나 레터박스를 두지 않고, 영상
          자체의 원본 비율대로 크게 보여준다(가로 영상은 넓게, 세로 영상은
          높게). 세로 영상이 화면을 너무 많이 차지하지 않도록 최대 높이만
          넉넉하게 잡아뒀다. */}
      {/* §99 — controlsList="nodownload"로 컨트롤 바의 다운로드 아이콘을
          숨긴다(완전 차단은 아니지만 가장 눈에 띄는 저장 경로를 없앤다). */}
      <video
        src={mediaSrc(video.url)}
        poster={video.poster || posterFallback}
        controls
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
        onContextMenu={(e) => e.preventDefault()}
        playsInline
        onLoadedMetadata={refreshScrollTrigger}
        className="w-full h-auto max-h-[75vh] mx-auto block rounded-sm bg-bg-soft"
      />
    </div>
  );
}
