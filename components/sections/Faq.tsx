"use client";

import { useRef, useState } from "react";
import { FaqItem } from "@/lib/types";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";

function FaqRow({ item, index, open, onToggle }: { item: FaqItem; index: number; open: boolean; onToggle: () => void }) {
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div className="border-b border-line">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 md:gap-8 py-8 md:py-10 text-left"
        aria-expanded={open}
      >
        <span className="flex items-center gap-4 md:gap-8 min-w-0">
          <span
            className="font-en text-sm shrink-0 transition-colors duration-300"
            style={{ color: open ? "var(--accent)" : "var(--color-text-muted)" }}
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="text-xl md:text-2xl font-medium text-korean">{item.question}</span>
        </span>
        <span
          className={cn("shrink-0 flex items-center justify-center h-10 w-10 md:h-12 md:w-12 rounded-full border transition-all duration-300")}
          style={{
            borderColor: open ? "var(--accent)" : "var(--color-border-strong)",
            color: open ? "var(--accent)" : "var(--color-text-secondary)",
            transform: open ? "rotate(45deg)" : "rotate(0deg)",
          }}
        >
          <span className="text-xl">+</span>
        </span>
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-400 ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <p ref={contentRef} className="body text-ink-secondary leading-relaxed pb-8 md:pl-16 max-w-2xl text-korean">
            {item.answer}
          </p>
        </div>
      </div>
    </div>
  );
}

export function Faq({ items }: { items: FaqItem[] }) {
  const visible = [...items].filter((i) => i.visible !== false).sort((a, b) => a.order - b.order);
  const [openId, setOpenId] = useState<string | null>(visible[0]?.id ?? null);

  if (visible.length === 0) return null;

  return (
    <section className="section-pad bg-bg">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-[5fr_7fr] gap-10 md:gap-16">
          <div>
            <Reveal>
              <p className="accent-text text-sm font-medium mb-4 tracking-wide">추가 설명</p>
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
