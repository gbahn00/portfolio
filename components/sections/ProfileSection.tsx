"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Profile, PhilosophySection, Competency } from "@/lib/types";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { MediaFrame } from "@/components/ui/MediaFrame";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { registerSubSteps } from "@/lib/fullpage";

// ============================================================================
// 인터랙션 수정 요청서 §5-17 — "02.프로필" 섹션.
//
// - "일하는 방식" 탭은 완전히 제거했다(컴포넌트/데이터/상태값/스타일 전부).
// - 남은 3개 탭(소개/핵심 수치/업무 역량)은 세로 스크롤 한 번에 하나씩
//   전환된다. 이 로직은 FullPageScroll이 lib/fullpage.ts의 registerSubSteps
//   를 통해 제어한다 — 탭 상태 자체는 이 컴포넌트가 useState로 소유하고,
//   FullPageScroll에는 "지금 몇 번 탭인지 읽기 / 탭 바꾸기"만 노출한다.
// - 탭이 바뀌어도 페이지 전체 비율(제목/이미지/탭 메뉴/구분선 위치)은
//   그대로 유지되고, 고정 높이 프레임(.profile-tab-panel) 안에서 내용만
//   Fade 전환된다(§14, §16).
// ============================================================================

type TabKey = "identity" | "numbers" | "skills";

const TABS: { key: TabKey; label: string }[] = [
  { key: "identity", label: "소개" },
  { key: "numbers", label: "핵심 수치" },
  { key: "skills", label: "업무 역량" },
];

function IdentityPanel({ profile, philosophy }: { profile: Profile; philosophy: PhilosophySection }) {
  const paragraphs = [...philosophy.paragraphs].sort((a, b) => a.order - b.order).slice(0, 2);
  const keywords = [...philosophy.keywords].sort((a, b) => a.order - b.order);
  return (
    <div className="grid grid-cols-1 md:grid-cols-[0.8fr_1.4fr] gap-6 md:gap-10 items-center h-full">
      <div className="relative aspect-[4/5] w-full max-w-[180px] max-h-full overflow-hidden rounded-sm mx-auto md:mx-0">
        <MediaFrame media={profile.profilePhoto} className="h-full w-full" />
      </div>
      <div className="min-w-0">
        <p className="statement-title font-medium text-korean mb-3 max-w-2xl line-clamp-2">{profile.representativePhrase}</p>
        <div className="space-y-2 mb-3">
          {paragraphs.map((p) => (
            <p key={p.id} className="body-large text-ink-secondary text-korean max-w-xl line-clamp-2">
              {p.text}
            </p>
          ))}
        </div>
        {keywords.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {keywords.slice(0, 5).map((k) => (
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
    <div className="h-full flex items-center">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-6 max-w-3xl">
        {facts.map((f) => (
          <div key={f.label}>
            <p className="text-korean text-sm text-ink-muted mb-1">{f.label}</p>
            <p className="text-korean text-2xl md:text-3xl text-ink font-bold">{f.value}</p>
          </div>
        ))}
        {facts.length === 0 && <p className="text-ink-muted text-sm">등록된 핵심 수치가 아직 없습니다.</p>}
      </div>
    </div>
  );
}

function SkillsPanel({ items }: { items: Competency[] }) {
  const [active, setActive] = useState(0);
  const sorted = items.slice(0, 6);
  const current = sorted[active];

  if (sorted.length === 0) return <p className="text-ink-muted text-sm">등록된 업무 역량이 아직 없습니다.</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_1.2fr] gap-6 md:gap-10 items-center h-full">
      <div className="space-y-1.5 overflow-hidden">
        {sorted.map((c, i) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setActive(i)}
            className="grid grid-cols-[32px_minmax(0,1fr)] items-baseline gap-3 text-left w-full"
          >
            <span className="font-en text-xs text-ink-muted">{String(i + 1).padStart(2, "0")}</span>
            <span
              className="text-lg md:text-xl font-bold transition-colors duration-300 truncate"
              style={{ color: i === active ? "var(--accent)" : "var(--color-text-muted)" }}
            >
              {c.title}
            </span>
          </button>
        ))}
      </div>
      <div key={current.id} className="max-w-[520px] overflow-hidden">
        <p className="text-ink-secondary body-large leading-relaxed text-korean line-clamp-4">{current.description}</p>
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
  const tabRef = useRef<TabKey>(tab);
  const stageRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    tabRef.current = tab;
  }, [tab]);

  // 인터랙션 수정 요청서 §6-11 — FullPageScroll에 탭 컨트롤을 등록한다.
  useLayoutEffect(() => {
    const unregister = registerSubSteps("profile", {
      count: TABS.length,
      getActive: () => TABS.findIndex((t) => t.key === tabRef.current),
      enter: (dir) => setTab(dir === 1 ? TABS[0].key : TABS[TABS.length - 1].key),
      setActive: (index) => {
        const clamped = Math.max(0, Math.min(TABS.length - 1, index));
        setTab(TABS[clamped].key);
      },
    });
    return unregister;
  }, []);

  // §16 — 탭 변경은 페이지 전체가 아니라 고정 프레임 안의 내용만 Fade
  // 전환한다(약 350ms). 프레임 높이/제목/이미지/탭 메뉴 위치는 그대로 둔다.
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage || prefersReducedMotion()) return;
    gsap.fromTo(stage, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.2, delay: 0.12, ease: "power2.out", overwrite: "auto" });
  }, [tab]);

  const sortedCompetencies = [...competencies].sort((a, b) => a.order - b.order);
  const activeIndex = TABS.findIndex((t) => t.key === tab);

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
          {TABS.map((t, i) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className="text-sm md:text-base font-medium px-1 pb-2 border-b-2 transition-colors duration-300 text-korean"
              style={{
                borderColor: i === activeIndex ? "var(--accent)" : "transparent",
                color: i === activeIndex ? "var(--color-text-primary)" : "var(--color-text-muted)",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* §14 — 탭 콘텐츠 길이가 달라도 화면이 흔들리지 않도록 프레임 높이를 고정한다. */}
        <div
          className="relative w-full overflow-hidden"
          style={{ height: "clamp(240px, 34dvh, 420px)" }}
        >
          <div ref={stageRef} className="absolute inset-0">
            {tab === "identity" && <IdentityPanel profile={profile} philosophy={philosophy} />}
            {tab === "numbers" && <NumbersPanel profile={profile} />}
            {tab === "skills" && <SkillsPanel items={sortedCompetencies} />}
          </div>
        </div>
      </Container>
    </section>
  );
}
