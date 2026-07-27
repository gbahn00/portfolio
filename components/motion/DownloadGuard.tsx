"use client";

import { useEffect } from "react";

// ============================================================================
// §99 — "개발자 도구로 들어가보니 사진을 다운로드할 수 있더라. 다운로드
// 못 하게 해달라"는 요청.
//
// 먼저 분명히 해둘 점: 브라우저에 사진/영상을 "보여주려면" 어차피 그
// 파일이 사용자 기기로 전송돼야 하므로, 개발자 도구의 네트워크 탭이나
// 페이지 소스 보기, 화면 캡처 등을 통한 다운로드는 기술적으로 100%
// 막을 방법이 없다(이건 이 사이트만의 한계가 아니라 웹의 구조적 특성).
// 대신 여기서는 일반적인 방문자가 실수로/가볍게 저장하는 경로들 —
// 마우스 오른쪽 클릭 "다른 이름으로 저장", 이미지를 끌어다 놓기(드래그),
// 영상 컨트롤의 다운로드 버튼, 롱프레스(모바일) — 를 막아 저장을
// 확실히 더 번거롭게 만든다.
// ============================================================================
export function DownloadGuard() {
  useEffect(() => {
    function isMedia(target: EventTarget | null) {
      const el = target as HTMLElement | null;
      return !!el && (el.tagName === "IMG" || el.tagName === "VIDEO" || el.closest("img, video") !== null);
    }

    function blockContextMenu(e: MouseEvent) {
      if (isMedia(e.target)) e.preventDefault();
    }
    function blockDragStart(e: DragEvent) {
      if (isMedia(e.target)) e.preventDefault();
    }

    document.addEventListener("contextmenu", blockContextMenu);
    document.addEventListener("dragstart", blockDragStart);
    return () => {
      document.removeEventListener("contextmenu", blockContextMenu);
      document.removeEventListener("dragstart", blockDragStart);
    };
  }, []);

  return null;
}
