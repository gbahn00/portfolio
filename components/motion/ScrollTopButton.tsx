"use client";

import { useRef } from "react";
import Link from "next/link";
import { gsap } from "@/lib/gsap";

/** 마우스를 올리면 원형 배경이 확장되는 버튼. href가 있으면 링크, 없으면 최상단 이동 버튼. */
export function ScrollTopButton({ label = "처음으로 돌아가기", href }: { label?: string; href?: string }) {
  const circleRef = useRef<HTMLSpanElement>(null);

  function handleEnter() {
    gsap.to(circleRef.current, { scale: 1, duration: 0.5, ease: "power3.out" });
  }
  function handleLeave() {
    gsap.to(circleRef.current, { scale: 0, duration: 0.4, ease: "power3.in" });
  }
  function handleClick() {
    if (href) return;
    // 상단 이동 중 각 영역 모션이 역방향으로 보이다가, 도착 후 즉시 정상 상태로 복구됩니다.
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const className =
    "group relative inline-flex items-center gap-3 overflow-hidden rounded-full border border-line-strong px-7 py-3.5 text-sm font-medium text-ink";
  const inner = (
    <>
      <span ref={circleRef} className="absolute inset-0 accent-bg rounded-full" style={{ transform: "scale(0)" }} />
      <span className="relative z-10 group-hover:text-bg transition-colors">{label}</span>
      <span className="relative z-10 group-hover:text-bg transition-colors">{href ? "→" : "↑"}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} onMouseEnter={handleEnter} onMouseLeave={handleLeave} className={className}>
        {inner}
      </Link>
    );
  }

  return (
    <button onMouseEnter={handleEnter} onMouseLeave={handleLeave} onClick={handleClick} className={className}>
      {inner}
    </button>
  );
}
