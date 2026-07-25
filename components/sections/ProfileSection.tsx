"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Profile, PhilosophySection, Competency } from "@/lib/types";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { MediaFrame } from "@/components/ui/MediaFrame";
import { gsap, prefersReducedMotion } from "@/lib/gsap";

// ============================================================================
// 전체 구조 개편 명세서 §2 — "02.프로필"
// 기존에 따로 있던 About(정체성 문장), Profile Key Numbers(핵심 수치),
// Competencies(업무 역량), Working Process(일하는 방식) 4개 섹션을
// 물리적으로 하나의 섹션으로 합쳤다. 시각적으로만 겹쳐 보이게 한 것이 아니라
// 아래 4개 섹션 컴포넌트 자체를 메인 페이지에서 제거하고 이 컴포넌트
// 하나로 대체했다.
//
// Full Page Scroll(한 번의 스크롤 = 한 섹션)과 맞물리기 위해, 예전처럼
// "여러 화면 분량을 스크롤해야 다음 문장이 나오는" pin+scrub 방식 대신
// 탭을 클릭해 하위 콘텐츠를 전환하는 방식으로 새로 만들었다. 탭 전환은
// GSAP crossfade로 부드럽게 처리한다.
// ============================================================================

type TabKey = "identity" | "numbers" | "skills" | "process";

const TABS: { key: TabKey; label: string }[] = [
  { key: "identity", label: "소개" },
  { key: "numbers", label: "핵심 수치" },
  { key: "skills", label: "업무 역량" },
  { key: "process", label: "일하는 방식" },
];

const PROCESS_STEPS = [
  { title: "목적과 대상 파악", desc: "콘텐츠가 어디에 쓰이고 누구에게 전달되는지 먼저 확인합니다." },
  { title: "콘텐츠 방향 설계", desc: "목적에 맞춰 색감, 구도, 정보 전달 방식과 톤을 설계합니다." },
  { title: "촬영·제작·AI 활용", desc: "촬영과 편집, 필요한 경우 생성형 AI 도구를 함께 활용해 제작합니다." },
  { title: "검수와 수정", desc: "결과물을 검수하고 담당자·클라이언트 피드백을 반영해 수정합니다." },
  { title: "성과 확인과 개선", desc: "결과를 확인하고 다음 콘텐츠 제작 방식 개선에 반영합니다." },
];

function IdentityPanel({ profile, philosophy }: { profile: Profile; philosophy: PhilosophySection }) {
  const paragraphs = [...philosophy.paragraphs].sort((a, b) => a.order - b.order);
  const keywords = [...philosophy.keywords].sort((a, b) => a.order - b.order);
  return (
    <div className="grid grid-cols-1 md:grid-cols-[0.9fr_1.4fr] gap-8 md:gap-12 items-center">
      <div className="relative aspect-[4/5] w-full max-w-[220px] max-h-[45dvh] overflow-hidden rounded-sm">
        <MediaFrame media={profile.profilePhoto} className="h-full w-full" />
      </div>
      <div>
        <p className="statement-title font-medium text-korean mb-5 max-w-2xl">{profile.representativePhrase}</p>
        <div className="space-y-3 mb-5">
          {paragraphs.map((p) => (
            <p key={p.id} className="body-large text-ink-secondary text-korean max-w-xl">
              {p.text}
            </p>
          ))}
        </div>
        {keywords.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {keywords.map((k) => (
              <span key={k.id} className="text-xs rounded-full border border-line px-3 py-1 text-ink-muted text-korean">
                #{k.text}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NumbersPanel({ profile }: { profile: Profile }) {
  const facts = [...profile.keyFacts].sort((a, b) => a.order - b.order);
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-6 max-w-3xl">
      {facts.map((f) => (
        <div key={f.label}>
          <p className="text-korean text-sm text-ink-muted mb-1">{f.label}</p>
          <p className="text-korean text-2xl md:text-3xl text-ink font-bold">{f.value}</p>
        </div>
      ))}
      {facts.length === 0 && <p className="text-ink-muted text-sm">등록된 핵심 수치가 아직 없습니다.</p>}
    </div>
  );
}

function SkillsPanel({ items }: { items: Competency[] }) {
  const [active, setActive] = useState(0);
  const sorted = [...items].sort((a, b) => a.order - b.order);
  const current = sorted[active];

  if (sorted.length === 0) return <p className="text-ink-muted text-sm">등록된 업무 역량이 아직 없습니다.</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_1.2fr] gap-8 md:gap-12 items-start">
      <div className="space-y-2">
        {sorted.map((c, i) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setActive(i)}
            className="grid grid-cols-[36px_minmax(0,1fr)] items-baseline gap-4 text-left w-full"
          >
            <span className="font-en text-sm text-ink-muted">{String(i + 1).padStart(2, "0")}</span>
            <span
              className="text-xl md:text-2xl font-bold transition-colors duration-300"
              style={{ color: i === active ? "var(--accent)" : "var(--color-text-muted)" }}
            >
              {c.title}
            </span>
          </button>
        ))}
      </div>
      <div key={current.id} className="max-w-[560px]">
        <p className="text-ink-secondary body-large leading-relaxed text-korean mb-6">{current.description}</p>
        {(current.cases || []).length > 0 && (
          <ul className="space-y-2">
            {[...current.cases].sort((a, b) => a.order - b.order).map((cs) => (
              <li key={cs.id} className="text-sm text-ink/80 flex gap-2 text-korean">
                <span className="accent-text">·</span>
                {cs.text}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ProcessPanel() {
  const [active, setActive] = useState(0);
  const step = PROCESS_STEPS[active];
  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap gap-2 mb-10">
        {PROCESS_STEPS.map((s, i) => (
          <button
            key={s.title}
            type="button"
            onClick={() => setActive(i)}
            className="text-xs md:text-sm rounded-full border px-4 py-2 transition-colors duration-300 text-korean"
            style={{
              borderColor: i === active ? "var(--accent)" : "var(--color-border)",
              color: i === active ? "var(--accent)" : "var(--color-text-secondary)",
            }}
          >
            {String(i + 1).padStart(2, "0")}
          </button>
        ))}
      </div>
      <div key={active}>
        <h3 className="project-title font-bold mb-4 text-korean">{step.title}</h3>
        <p className="body-large text-ink-secondary text-korean max-w-xl">{step.desc}</p>
      </div>
    </div>
  );
}

export function ProfileSection({
  profile,
  philosophy,
  competencies,
}: {
  profile: Profile;
  philosophy: PhilosophySection;
  competencies: Competency[];
}) {
  const [tab, setTab] = useState<TabKey>("identity");
  const stageRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage || prefersReducedMotion()) return;
    gsap.fromTo(stage, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: "power2.out", overwrite: "auto" });
  }, [tab]);

  const sortedCompetencies = [...competencies].sort((a, b) => a.order - b.order);

  return (
    <section id="profile" className="fp-section bg-bg-soft py-6 md:py-8">
      <Container className="w-full">
        <Reveal>
          <p className="accent-text text-sm font-medium mb-3 tracking-wide">PROFILE</p>
        </Reveal>
        <Reveal delay={0.05} strength="strong" holdAfterEnter>
          <h2 className="section-title font-bold mb-6 md:mb-8 text-korean">
            {profile.name} · {profile.role}
          </h2>
        </Reveal>

        <div className="flex flex-wrap gap-2 mb-6 md:mb-8 border-b border-line pb-4">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className="text-sm md:text-base font-medium px-1 pb-2 border-b-2 transition-colors duration-300 text-korean"
              style={{
                borderColor: tab === t.key ? "var(--accent)" : "transparent",
                color: tab === t.key ? "var(--color-text-primary)" : "var(--color-text-muted)",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div ref={stageRef}>
          {tab === "identity" && <IdentityPanel profile={profile} philosophy={philosophy} />}
          {tab === "numbers" && <NumbersPanel profile={profile} />}
          {tab === "skills" && <SkillsPanel items={sortedCompetencies} />}
          {tab === "process" && <ProcessPanel />}
        </div>
      </Container>
    </section>
  );
}
