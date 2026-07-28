"use client";

import { useLayoutEffect, useRef, useState } from "react";

// §131 — components/sections/BeforeAfterWithText.tsx(§128)에서 만든 "텍스트
// 칸 실제 렌더링 높이를 재는" 로직을, 대표 이미지/영상 대체 컴포넌트
// (RepresentativeMediaWithText)에서도 똑같이 써야 해서 공용 훅으로 뺐다.
// useLayoutEffect + getBoundingClientRect로 마운트 시점에 동기적으로(=
// 브라우저가 화면을 그리기 전에) 먼저 한 번 재고, 이후 크기 변화는
// ResizeObserver로 계속 잡는다 — 이렇게 해야 옆 칸(사진 등)이 이 높이에
// 맞춰 크기를 정할 때 "잘못된 크기가 잠깐 보였다 되돌아오는" 점프가
// 생기지 않는다.
export function useElementHeight<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [height, setHeight] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setHeight(el.getBoundingClientRect().height);
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setHeight(entry.contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, height };
}
