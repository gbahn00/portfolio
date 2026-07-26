"use client";

import { useRef, useState } from "react";
import { FaqItem } from "@/lib/types";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";

// 인터랙션 수정 요청서(3차) — FAQ를 06번 섹션으로 다시 도입한다. Full Page
// Scroll의 다른 섹션들과 마찬가지로 한 화면(fp-section)에 들어와야 하므로,
// 한 번에 하나의 답변만 펼쳐지는 아코디언 구조를 유지하되 행 간격을
// 줄이고, 질문이 너무 많으면 앞의 6개만 보여준다(§ 콘텐츠 축소 원칙과 동일).
const MAX_ITEMS = 6;

function FaqRow({ item, index, open, onToggle }: { item: FaqItem; index: number; open: boolean; onToggle: () => void }) {
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div className="border-b border-line">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 md:gap-6 py-3 md:py-4 text-left"
        aria-expanded={open}
      >
        <span className="flex items-center gap-3 md:gap-6 min-w-0">
          <span
            className="font-en text-xs shrink-0 transition-colors duration-300"
            style={{ color: open ? "var(--accent)" : "var(--color-text-muted)" }}
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="text-base md:text-lg font-medium text-korean truncate">{item.question}</span>
        </span>
        <span
          className={cn("shrink-0 flex items-center justify-center h-8 w-8 rounded-full border transition-all duration-300")}
          style={{
            borderColor: open ? "var(--accent)" : "var(--color-border-strong)",
            color: open ? "var(--accent)" : "var(--color-text-secondary)",
            transform: open ? "rotate(45deg)" : "rotate(0deg)",
          }}
        >
          <span className="text-base">+</span>
        </span>
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <p ref={contentRef} className="body text-ink-secondary leading-relaxed pb-4 md:pl-14 max-w-2xl text-korean whitespace-pre-line">
            {item.answer}
          </p>
        </div>
      </div>
    </div>
  );
}

export function Faq({ items }: { items: FaqItem[] }) {
  const visible = [...items].filter((i) => i.visible !== false).sort((a, b) => a.order - b.order).slice(0, MAX_ITEMS);
  const [openId, setOpenId] = useState<string | null>(visible[0]?.id ?? null);

  if (visible.length === 0) return null;

  return (
    <section id="faq" className="fp-section bg-bg-soft py-6 md:py-8">
      <Container className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-[4fr_8fr] gap-6 md:gap-12 items-start">
          <div>
            <Reveal holdAfterEnter>
              <p className="accent-text text-sm font-medium mb-3 tracking-wide">추가 설명</p>
            </Reveal>
            <Reveal delay={0.05} strength="strong" holdAfterEnter>
              <h2 className="section-title font-bold text-korean">
                궁금할 수 있는
                <br />
                질문에 답했습니다.
              </h2>
            </Reveal>
          </div>

          <Reveal delay={0.1} holdAfterEnter>
            <div className="border-t border-line">
              {visible.map((item, i) => (
                <FaqRow
                  key={item.id}
                  item={item}
                  index={i}
                  open={openId === item.id}
                  onToggle={() => setOpenId(openId === item.id ? null : item.id)}
                />
              ))}
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
