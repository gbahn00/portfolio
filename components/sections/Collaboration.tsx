"use client";

import { useEffect, useRef, useState } from "react";
import { Collaboration as CollaborationType, Project } from "@/lib/types";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { MediaFrame } from "@/components/ui/MediaFrame";

export function Collaboration({ items, projects }: { items: CollaborationType[]; projects: Project[] }) {
  const testimonials = [...items]
    .filter((i) => i.visible !== false && i.review && i.review.trim().length > 0)
    .sort((a, b) => a.order - b.order);

  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const onScroll = () => {
      const idx = Math.round(track.scrollLeft / track.clientWidth);
      setActive(idx);
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, []);

  function goTo(i: number) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: i * track.clientWidth, behavior: "smooth" });
  }

  const evidence = [...items].filter((i) => i.visible !== false).sort((a, b) => a.order - b.order);

  return (
    <section className="section-pad bg-bg-soft overflow-hidden">
      <Container>
        <Reveal>
          <p className="accent-text text-sm font-medium mb-4 tracking-wide">협업 평가</p>
        </Reveal>
        <Reveal delay={0.05} strength="strong" holdAfterEnter>
          <h2 className="section-title font-bold mb-16 text-korean max-w-3xl">
            함께 일하는 방식을<br />결과로 증명했습니다.
          </h2>
        </Reveal>

        {evidence.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 mb-20 pb-16 border-b border-line">
            {evidence.map((e, i) => (
              <Reveal key={e.id} delay={(i % 4) * 0.05}>
                <div className="flex gap-4">
                  <span className="accent-text font-en text-sm pt-1">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <p className="text-ink text-korean font-medium mb-1">{e.partner}</p>
                    <p className="body text-korean">{e.process}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        )}

        <Reveal delay={0.1}>
          <p className="font-en text-xs text-ink-muted tracking-wide mb-8">COLLABORATION FEEDBACK</p>
        </Reveal>

        {testimonials.length === 0 ? (
          <Reveal delay={0.1}>
            <div className="rounded-sm border border-white/10 py-24 text-center">
              <p className="text-ink-muted text-korean">협업 평가 자료 준비 중입니다.</p>
            </div>
          </Reveal>
        ) : (
          <Reveal delay={0.1}>
            <div>
              <div
                ref={trackRef}
                className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth gap-0 -mx-4 px-4"
                style={{ scrollbarWidth: "none" }}
              >
                {testimonials.map((c) => {
                  const project = projects.find((p) => p.id === c.relatedProjectId);
                  return (
                    <div key={c.id} className="w-full shrink-0 snap-center px-4">
                      <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-10 items-center min-h-[360px]">
                        <div>
                          <p className="text-xl md:text-3xl leading-relaxed text-korean mb-8">
                            “{c.review}”
                          </p>
                          <div className="text-sm text-ink-muted">
                            {c.authorNameVisible && c.authorName && (
                              <span className="text-ink font-medium mr-2">{c.authorName}</span>
                            )}
                            {c.authorTitleVisible && c.authorTitle && <span>{c.authorTitle}</span>}
                            {!c.authorNameVisible && <span>{c.partner}</span>}
                          </div>
                        </div>
                        {project?.heroImage && (
                          <MediaFrame media={project.heroImage} className="aspect-[4/3] rounded-sm" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {testimonials.length > 1 && (
                <div className="flex items-center gap-2 mt-8">
                  {testimonials.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => goTo(i)}
                      aria-label={`${i + 1}번째 평가로 이동`}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === active ? "w-8 accent-bg" : "w-1.5 bg-white/20"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </Reveal>
        )}
      </Container>
    </section>
  );
}
