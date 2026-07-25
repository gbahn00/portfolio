"use client";

import { useEffect } from "react";
import { ScrollTrigger, refreshScrollTrigger } from "@/lib/gsap";

/**
 * 페이지 전역에서 한 번만 마운트되는 컴포넌트.
 * 이미지·폰트 로딩, 화면 크기 변경, 모바일 회전 이후 ScrollTrigger 위치를
 * 다시 계산해 스크롤 고정/스크럽 영역이 어긋나지 않도록 합니다.
 */
export function GsapProvider() {
  useEffect(() => {
    const refresh = () => refreshScrollTrigger();

    // 폰트 로딩이 끝나면 글자 크기가 바뀌어 레이아웃이 변할 수 있으므로 재계산합니다.
    if ("fonts" in document) {
      (document as any).fonts.ready.then(refresh).catch(() => {});
    }

    window.addEventListener("load", refresh);
    window.addEventListener("resize", refresh);
    window.addEventListener("orientationchange", refresh);

    // 이미지가 늦게 로드되며 문서 높이가 바뀌는 경우를 대비해 짧게 한 번 더 재계산합니다.
    const t1 = setTimeout(refresh, 500);
    const t2 = setTimeout(refresh, 1500);

    return () => {
      window.removeEventListener("load", refresh);
      window.removeEventListener("resize", refresh);
      window.removeEventListener("orientationchange", refresh);
      clearTimeout(t1);
      clearTimeout(t2);
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, []);

  return null;
}
