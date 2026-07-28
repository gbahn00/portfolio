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

// §132 — "대체 이미지가 옆 텍스트 세로 길이보다 작다, 잘리거나 찌그러지지
// 않으면서 그 세로 길이에 맞춰달라"는 요청. 가로로 아주 넓은(파노라마성)
// 사진은 세로 높이를 텍스트 칸 높이에 정확히 맞추려면 폭이 아주 커져야
// 하는데, 기존엔 고정된 폭 상한(MAX_W)에 먼저 걸려 높이가 목표에 못
// 미쳤다. 매직 넘버로 상한을 올리는 대신, "사진+텍스트를 담는 줄
// 전체의 실제 폭"을 이 훅으로 재서, 거기서 텍스트가 최소한으로 필요한
// 폭만 빼고 나머지를 전부 사진 폭 상한으로 쓴다 — 그러면 사진이 줄을
// 벗어나 텍스트를 완전히 밀어내는 일 없이, 남는 공간 안에서는 항상
// 원본 비율 그대로(자르거나 찌그러뜨리지 않고) 높이를 최대한 채운다.
export function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.getBoundingClientRect().width);
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, width };
}

// §134 — "프로필 사진도 옆 텍스트의 세로 크기 비율에 맞춰달라"는 요청.
// 하나의 요소에서 폭과 높이를 동시에(같은 ResizeObserver 하나로) 재야
// 할 때 쓴다. useElementHeight + useElementWidth를 각각 따로 쓰면 같은
// DOM 요소에 ref를 두 개 붙일 수 없어서(JSX ref는 하나만 받는다) 합친
// 버전을 새로 만들었다.
export function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState<{ width: number; height: number } | undefined>(undefined);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setSize({ width: rect.width, height: rect.height });
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, width: size?.width, height: size?.height };
}
