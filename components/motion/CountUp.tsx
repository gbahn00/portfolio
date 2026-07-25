"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { gsap, BIDIRECTIONAL_TOGGLE, prefersReducedMotion } from "@/lib/gsap";

export function CountUp({ value, className }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const numeric = parseFloat(value.replace(/[^0-9.]/g, ""));
  const isNumeric = !isNaN(numeric) && value.trim() !== "";
  const [display, setDisplay] = useState(isNumeric ? "0" : value);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !isNumeric) return;

    if (prefersReducedMotion()) {
      setDisplay(Number.isInteger(numeric) ? String(numeric) : numeric.toFixed(1));
      return;
    }

    const counter = { val: 0 };
    const ctx = gsap.context(() => {
      gsap.fromTo(
        counter,
        { val: 0 },
        {
          val: numeric,
          duration: 1.3,
          ease: "power2.out",
          onUpdate: () => setDisplay(Number.isInteger(numeric) ? String(Math.round(counter.val)) : counter.val.toFixed(1)),
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            end: "bottom 15%",
            // 재진입할 때마다 처음부터 다시 증가하도록 매번 재생합니다.
            toggleActions: "restart reverse restart reverse",
          },
        }
      );
    }, ref);

    return () => ctx.revert();
  }, [numeric, isNumeric]);

  return (
    <span ref={ref} className={className}>
      {isNumeric ? display : value || "[자료 필요]"}
    </span>
  );
}
