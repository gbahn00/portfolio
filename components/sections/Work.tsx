"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Project, ProjectField } from "@/lib/types";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { MediaFrame } from "@/components/ui/MediaFrame";
import { cn } from "@/lib/utils";

const FIELDS: ProjectField[] = [
  "의류", "카페 및 음식", "인테리어", "인물 프로필", "치과 및 병원 광고", "유튜브", "생성형 인공지능 콘텐츠",
];

export function Work({ projects }: { projects: Project[] }) {
  const [active, setActive] = useState<ProjectField | "전체">("전체");

  const filtered = useMemo(() => {
    const list = active === "전체" ? projects : projects.filter((p) => p.field === active);
    return [...list].sort((a, b) => a.order - b.order);
  }, [projects, active]);

  const availableFields = useMemo(
    () => FIELDS.filter((f) => projects.some((p) => p.field === f)),
    [projects]
  );

  return (
    <section className="section-pad bg-bg-soft">
      <Container>
        <Reveal>
          <p className="accent-text text-sm font-medium mb-4 tracking-wide">주요 작업</p>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-korean">콘텐츠의 대상과 목적에 맞춘 표현</h2>
        </Reveal>
        <Reveal delay={0.08}>
          <p className="text-ink-muted text-base md:text-lg mb-10 max-w-2xl">
            콘텐츠의 대상과 활용 목적에 맞춰 촬영과 보정, 영상의 표현방식을 다르게 적용했습니다.
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="flex flex-wrap gap-2 mb-10">
            <button
              onClick={() => setActive("전체")}
              className={cn(
                "rounded-full px-4 py-2 text-sm border transition-colors",
                active === "전체" ? "accent-bg accent-border text-bg" : "border-white/15 text-ink-muted hover:text-ink"
              )}
            >
              전체
            </button>
            {availableFields.map((f) => (
              <button
                key={f}
                onClick={() => setActive(f)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm border transition-colors",
                  active === f ? "accent-bg accent-border text-bg" : "border-white/15 text-ink-muted hover:text-ink"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((p, i) => (
            <Reveal key={p.id} delay={(i % 6) * 0.05}>
              <Link href={`/projects/${p.id}`} className="group block">
                <MediaFrame media={p.heroImage} className="aspect-[4/3] rounded-sm mb-4 transition-transform duration-500 group-hover:scale-[1.02]" />
                <p className="accent-text text-xs mb-1">{p.field}</p>
                <h3 className="text-lg font-semibold group-hover:text-white/80 transition-colors text-korean">{p.title}</h3>
                <p className="text-ink-muted text-sm mt-1 opacity-70 group-hover:opacity-100 transition-opacity text-korean">{p.role}</p>
              </Link>
            </Reveal>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-ink-muted text-center py-16">해당 분야에 공개된 작업이 아직 없습니다.</p>
        )}
      </Container>
    </section>
  );
}
