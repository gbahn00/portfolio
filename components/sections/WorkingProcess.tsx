"use client";

import { useLayoutEffect, useRef } from "react";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { gsap, prefersReducedMotion, FAST_SCROLL_SAFE } from "@/lib/gsap";

// §12 Working Process — 실제 업무에 접근하는 5단계.
// (신규 섹션으로, 현재는 코드에 직접 반영된 고정 콘텐츠입니다.
//  추후 문구 수정이 필요하면 이 파일의 STEPS 배열을 바꾸면 됩니다.)
const STEPS = [
  { title: "목적과 대상 파악", desc: "콘텐츠가 어디에 쓰이고 누구에게 전달되는지 먼저 확인합니다." },
  { title: "콘텐츠 방향 설계", desc: "목적에 맞춰 색감, 구도, 정보 전달 방식과 톤을 설계합니다." },
  { title: "촬영·제작·AI 활용", desc: "촬영과 편집, 필요한 경우 생성형 AI 도구를 함께 활용해 제작합니다." },
  { title: "검수와 수정", desc: "결과물을 검수하고 담당자·클라이언트 피드백을 반영해 수정합니다." },
  { title: "성과 확인과 개선", desc: "결과를 확인하고 다음 콘텐츠 제작 방식 개선에 반영합니다." },
];

export function WorkingProcess() {
  const pinRef = useRef<HTMLDivElement>(null);
  const numRef = useRef<HTMLSpanElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const pin = pinRef.current;
    if (!pin) return;
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: pin,
          start: "top top",
          end: `+=${STEPS.length * 760}`,
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          ...FAST_SCROLL_SAFE,
        },
      });

      STEPS.forEach((step, i) => {
        if (i === 0) return;
        const t = i - 0.15;
        tl.to([titleRef.current, descRef.current, numRef.current], { autoAlpha: 0, y: -16, duration: 0.2, overwrite: "auto" }, t)
          .call(
            () => {
              if (numRef.current) numRef.current.textContent = String(i + 1).padStart(2, "0");
              if (titleRef.current) titleRef.current.textContent = STEPS[i].title;
              if (descRef.current) descRef.current.textContent = STEPS[i].desc;
            },
            undefined,
            t + 0.2
          )
          .to([titleRef.current, descRef.current, numRef.current], { autoAlpha: 1, y: 0, duration: 0.25, overwrite: "auto" }, t + 0.22)
          .to(barRef.current, { scaleX: (i + 1) / STEPS.length, duration: 0.3, overwrite: "auto" }, t);
      });

      return () => {
        tl.scrollTrigger?.kill();
        tl.kill();
      };
    }, pin);

    return () => ctx.revert();
  }, []);

  return (
    <section className="section-pad bg-bg-soft">
      <Container>
        <Reveal>
          <p className="accent-text text-sm font-medium mb-4 tracking-wide">WORKING PROCESS</p>
        </Reveal>
      </Container>

      <div ref={pinRef} className="relative min-h-[80svh] w-full flex items-center">
        <Container className="w-full">
          <div className="max-w-3xl">
            <span ref={numRef} className="accent-text font-en section-title font-bold block mb-6">
              01
            </span>
            <h3 ref={titleRef} className="project-title font-bold mb-6 text-korean">
              {STEPS[0].title}
            </h3>
            <p ref={descRef} className="body-large text-ink-secondary text-korean max-w-xl">
              {STEPS[0].desc}
            </p>
          </div>

          <div className="mt-16 h-[2px] w-full bg-line relative overflow-hidden">
            <div ref={barRef} className="absolute inset-0 accent-bg origin-left" style={{ transform: `scaleX(${1 / STEPS.length})` }} />
          </div>
        </Container>
      </div>
    </section>
  );
}
