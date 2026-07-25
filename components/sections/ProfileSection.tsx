"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Profile, PhilosophySection, Competency } from "@/lib/types";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { MediaFrame } from "@/components/ui/MediaFrame";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { registerSubSteps } from "@/lib/fullpage";

// ============================================================================
// 인터랙션 수정 요청서 §5-23 (누적) — "02.프로필" 섹션.
//
// - "일하는 방식" 탭은 완전히 제거했다(컴포넌트/데이터/상태값/스타일 전부).
// - 남은 3개 탭(소개/핵심 수치/업무 역량) + 업무 역량 탭 내부의 1~5번
//   콘텐츠까지 합쳐 총 "가상 스텝" 시퀀스로 다룬다:
//     0=소개, 1=핵심 수치, 2..(2+N-1)=업무 역량 1~N번
//   세로 스크롤 한 번은 이 시퀀스에서 정확히 ±1만 이동한다. 이 로직은
//   FullPageScroll이 lib/fullpage.ts의 registerSubSteps를 통해 제어한다 —
//   탭/스킬 인덱스 상태 자체는 이 컴포넌트가 소유하고, FullPageScroll에는
//   "지금 몇 번째 스텝인지 읽기 / 스텝 바꾸기"만 노출한다.
// - 탭·스텝이 바뀌어도 페이지 전체 비율(제목/이미지/탭 메뉴/구분선 위치)은
//   그대로 유지되고, 고정 높이 프레임 안에서 내용만 Fade 전환된다.
// ============================================================================

type TabKey = "identity" | "numbers" | "skills";

const TABS: { key: TabKey; label: string }[] = [
  { key: "identity", label: "소개" },
  { key: "numbers", label: "핵심 수치" },
  { key: "skills", label: "업무 역량" },
];

const MAX_SKILL_STEPS = 5;

function IdentityPanel({ profile, philosophy }: { profile: Profile; philosophy: PhilosophySection }) {
  const paragraphs = [...philosophy.paragraphs].sort((a, b) => a.order - b.order).slice(0, 2);
  const keywords = [...philosophy.keywords].sort((a, b) => a.order - b.order);
  return (
    <div className="grid grid-cols-1 md:grid-cols-[0.9fr_1.1fr] gap-6 md:gap-10 items-center h-full">
      {/* 색상/프로필 이미지 수정 요청서 §7-11 — 이미지 영역을 42~46%까지
          키우고, 고정 높이 프레임을 그대로 채우도록(h-full) 조정했다. */}
      <div className="relative w-full max-w-[46%] md:max-w-none h-full mx-auto md:mx-0 overflow-hidden rounded-sm">
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

// §14-21 — 업무 역량 탭 내부에 1~N(최대 5)개의 독립적인 콘텐츠 단계를 두고,
// 스크롤 한 번마다 한 단계씩 전환한다. 실제 CMS에 등록된 역량 데이터를
// 그대로 쓰고(가짜 항목을 만들어 채우지 않음), 5개보다 많으면 순서상 앞의
// 5개만 사용한다.
function SkillsPanel({ items, index }: { items: Competency[]; index: number }) {
  const sorted = items.slice(0, MAX_SKILL_STEPS);
  const current = sorted[Math.min(index, Math.max(sorted.length - 1, 0))];

  if (sorted.length === 0) return <p className="text-ink-muted text-sm">등록된 업무 역량이 아직 없습니다.</p>;

  return (
    <div className="h-full flex flex-col justify-center">
      <div className="flex items-center gap-2 mb-4">
        {sorted.map((_, i) => (
          <span
            key={i}
            className="font-en text-xs tabular-nums transition-colors duration-300"
            style={{ color: i === index ? "var(--accent)" : "var(--color-text-muted)" }}
          >
            {String(i + 1).padStart(2, "0")}
            {i < sorted.length - 1 && <span className="mx-1.5 text-ink-muted">/</span>}
          </span>
        ))}
      </div>
      <div key={current.id} className="max-w-2xl">
        <h3 className="text-xl md:text-2xl font-bold mb-3 text-korean">{current.title}</h3>
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
  const sortedCompetencies = [...competencies].sort((a, b) => a.order - b.order);
  const skillCount = Math.min(sortedCompetencies.length, MAX_SKILL_STEPS);

  const [tab, setTab] = useState<TabKey>("identity");
  const [skillIndex, setSkillIndex] = useState(0);
  const tabRef = useRef<TabKey>(tab);
  const skillIndexRef = useRef(skillIndex);
  const stageRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    tabRef.current = tab;
  }, [tab]);
  useLayoutEffect(() => {
    skillIndexRef.current = skillIndex;
  }, [skillIndex]);

  // 인터랙션 수정 요청서 §16-19 — FullPageScroll에 "가상 스텝" 컨트롤을
  // 등록한다. 0=소개, 1=핵심 수치, 2..(2+skillCount-1)=업무 역량 1~N번.
  useLayoutEffect(() => {
    const totalSteps = 2 + skillCount;
    const unregister = registerSubSteps("profile", {
      count: totalSteps,
      getActive: () => {
        if (tabRef.current === "identity") return 0;
        if (tabRef.current === "numbers") return 1;
        return 2 + Math.min(skillIndexRef.current, Math.max(skillCount - 1, 0));
      },
      enter: (dir) => {
        if (dir === 1) {
          setTab("identity");
        } else if (skillCount > 0) {
          setTab("skills");
          setSkillIndex(skillCount - 1);
        } else {
          setTab("numbers");
        }
      },
      setActive: (index) => {
        const clamped = Math.max(0, Math.min(totalSteps - 1, index));
        if (clamped === 0) setTab("identity");
        else if (clamped === 1) setTab("numbers");
        else {
          setTab("skills");
          setSkillIndex(clamped - 2);
        }
      },
    });
    return unregister;
  }, [skillCount]);

  // §21 — 탭/스텝 변경은 페이지 전체가 아니라 고정 프레임 안의 내용만
  // Fade 전환한다(약 320~350ms). 프레임 높이/제목/이미지/탭 메뉴 위치는
  // 그대로 둔다.
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage || prefersReducedMotion()) return;
    gsap.fromTo(stage, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.2, delay: 0.12, ease: "power2.out", overwrite: "auto" });
  }, [tab, skillIndex]);

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
              onClick={() => {
                // §19 — 업무 역량 탭을 직접 클릭하면 항상 1번부터 시작한다.
                if (t.key === "skills") setSkillIndex(0);
                setTab(t.key);
              }}
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

        {/* §22-23 — 탭/스텝 콘텐츠 길이가 달라도 화면이 흔들리지 않도록
            프레임 높이를 고정하고, 페이지 배경(secondary)과 구분되도록
            반대 톤(primary)의 배경을 준다. */}
        <div
          className="relative w-full overflow-hidden rounded-sm bg-bg p-5 md:p-8"
          style={{ height: "clamp(260px, 38dvh, 460px)" }}
        >
          <div ref={stageRef} className="absolute inset-5 md:inset-8">
            {tab === "identity" && <IdentityPanel profile={profile} philosophy={philosophy} />}
            {tab === "numbers" && <NumbersPanel profile={profile} />}
            {tab === "skills" && <SkillsPanel items={sortedCompetencies} index={skillIndex} />}
          </div>
        </div>
      </Container>
    </section>
  );
}
