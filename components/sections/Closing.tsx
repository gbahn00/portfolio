"use client";

import { useLayoutEffect, useRef } from "react";
import { ClosingSection } from "@/lib/types";
import { Container } from "@/components/ui/Container";
import { MaskLines } from "@/components/motion/MaskLines";
import { ScrollTopButton } from "@/components/motion/ScrollTopButton";
import Link from "next/link";
import { mediaSrc } from "@/lib/utils";
import { gsap, prefersReducedMotion, ENTER_ONLY_TOGGLE } from "@/lib/gsap";

// ============================================================================
// 전체 구조 개편 명세서 §6 — "06.마지막 페이지"
// 예전에는 마무리 문구 섹션(약 1화면) 아래에 별도의 Footer 블록이 이어져서
// 실제로는 화면 1.x~2개 분량이었다. 이제는 "진짜 풀스크린 마지막 페이지"
// 요구에 맞춰 문구와 최소한의 정보(메뉴/연락처/프로필/저작권)를 한 화면
// 안에 전부 담았다.
//
// Footer 메뉴에서 FAQ 링크는 제거했다 — 이번 개편으로 FAQ 섹션 자체를
// 6개 섹션 구조에서 완전히 뺐기 때문이다(전체 구조 개편 요청 시 확정).
// Contact(SNS/이메일)는 관리자 페이지에서 값이 채워지기 전까지 비어 있으면
// 그대로 숨긴다 — 임의로 GitHub 링크나 이력서 다운로드를 채워 넣지 않는다
// (앞선 라운드에서 사용자가 명시적으로 제외를 재확인함).
// ============================================================================
export function Closing({ data }: { data: ClosingSection }) {
  const bg = data.backgroundImage ? mediaSrc(data.backgroundImage.url) : "/placeholders/closing-bg.svg";
  const sectionRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);
  const metaRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const lines = messageRef.current?.querySelectorAll<HTMLElement>("[data-mask-line]") ?? [];
      gsap.set(lines, { yPercent: 115, autoAlpha: 0 });
      gsap.set(bgRef.current, { autoAlpha: 0, scale: 1.1 });
      gsap.set([metaRef.current, btnRef.current], { autoAlpha: 0, y: 16 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top 70%",
          end: "top 20%",
          toggleActions: ENTER_ONLY_TOGGLE,
        },
        defaults: { ease: "power3.out" },
      });

      tl.to(bgRef.current, { autoAlpha: 0.35, scale: 1, duration: 1.4 }, 0)
        .to(lines, { yPercent: 0, autoAlpha: 1, duration: 0.9, stagger: 0.14 }, 0.1)
        .to(metaRef.current, { autoAlpha: 1, y: 0, duration: 0.7 }, "-=0.3")
        .to(btnRef.current, { autoAlpha: 1, y: 0, duration: 0.7 }, "-=0.4");
    }, section);

    return () => ctx.revert();
  }, []);

  const links = (data.externalLinks || []).filter((l) => l.label && l.url);
  const year = new Date().getFullYear();

  return (
    <section
      id="closing"
      ref={sectionRef}
      className="relative h-[100dvh] flex flex-col justify-between overflow-hidden bg-bg"
    >
      <div className="absolute inset-0">
        <div ref={bgRef} className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={bg} alt={data.backgroundImage?.alt || ""} className="h-full w-full object-cover blur-sm" />
        </div>
        <div className="absolute inset-0 bg-bg/45" />
      </div>

      <Container className="relative z-10 flex-1 flex flex-col justify-center py-6 md:py-8">
        <div ref={messageRef} className="mb-5">
          <MaskLines text={data.message} className="hero-title font-bold" accentLines={[0]} />
        </div>
        {data.subline && (
          <p className="text-korean text-ink-secondary body-large max-w-xl mb-6 whitespace-pre-line">{data.subline}</p>
        )}
        <div ref={metaRef} className="flex flex-wrap items-center gap-x-4 gap-y-1 text-ink-secondary text-sm md:text-base mb-6">
          <span className="text-ink font-medium">{data.name}</span>
          <span>{data.department}</span>
          <span>{data.role}</span>
          <span>{data.badge}</span>
        </div>
        <div ref={btnRef} className="flex flex-wrap gap-4">
          <ScrollTopButton label="Back to Top" />
          <ScrollTopButton label="View Works" href="/#projects" />
        </div>
      </Container>

      <Container className="relative z-10 pb-5 md:pb-6">
        <div className="pt-8 border-t border-line/60 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs md:text-sm text-ink-secondary">
            <Link href="/#profile" className="hover:text-ink transition-colors duration-300">Profile</Link>
            <Link href="/#growth" className="hover:text-ink transition-colors duration-300">Growth</Link>
            <Link href="/#projects" className="hover:text-ink transition-colors duration-300">Works</Link>
            <Link href="/#faq" className="hover:text-ink transition-colors duration-300">FAQ</Link>
            {links.map((l) => (
              <a
                key={l.id}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-ink transition-colors duration-300"
              >
                {l.label}
              </a>
            ))}
          </div>
          <p className="font-en text-xs text-ink-muted">© {year} {data.name}</p>
        </div>
      </Container>
    </section>
  );
}
