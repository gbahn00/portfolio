"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ScrollTrigger, refreshScrollTrigger } from "@/lib/gsap";

/**
 * 페이지 전역에서 한 번만 마운트되는 컴포넌트.
 * 이미지·폰트 로딩, 화면 크기 변경, 모바일 회전 이후 ScrollTrigger 위치를
 * 다시 계산해 스크롤 고정/스크럽 영역이 어긋나지 않도록 합니다.
 */
export function GsapProvider() {
  // §88 — 이 컴포넌트는 루트 레이아웃에 한 번만 마운트되고, 아래 window
  // "load" 이벤트와 500ms/1500ms 재계산은 "최초 페이지 로드" 시점에만
  // 실행됐다. 그런데 프로젝트 상세 페이지처럼 링크를 눌러 이동하는
  // 클라이언트 사이드 네비게이션에서는 "load" 이벤트가 다시 발생하지
  // 않아서, 새로 진입한 페이지에서 이미지/영상이 뒤늦게 로드되며 박스
  // 높이가 바뀌어도 ScrollTrigger의 시작/끝 위치가 갱신되지 않았다. 그
  // 결과 등장 모션의 "끝(bottom 15%)" 기준점이 이미지 로드 전(더 작은
  // 높이) 기준으로 고정되어 실제보다 일찍 사라지는(reverse) 문제가
  // 있었다 — "보정 전/후 · 이미지/영상을 첨부하면 모션이 일찍 없어진다"는
  // 증상과 일치한다. usePathname()으로 라우트가 바뀔 때마다 같은 재계산
  // 루틴을 다시 실행해 새 페이지의 콘텐츠 로딩에도 대응하게 했다.
  const pathname = usePathname();

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
    };
  }, [pathname]);

  useEffect(() => {
    return () => {
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, []);

  return null;
}
