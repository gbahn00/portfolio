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

// §35 — "탭을 바꾸면 사진이 통째로 사라진다"는 피드백에 따라 구조를 바꿨다.
// 예전에는 사진+소개글이 하나의 IdentityPanel로 묶여 있어서, 핵심 수치/
// 업무 역량 탭으로 넘어가면 사진까지 같이 없어졌다. 이제 사진은 박스 왼쪽
// 절반에 항상 고정으로 떠 있고(탭이 바뀌어도 다시 렌더링되지 않음), 탭에
// 따라 바뀌는 건 오른쪽 절반의 텍스트 콘텐츠뿐이다 — ProfileSection의
// return 안에서 사진을 stage 밖에 별도로 그린다.
function IdentityText({ profile, philosophy }: { profile: Profile; philosophy: PhilosophySection }) {
  const paragraphs = [...philosophy.paragraphs].sort((a, b) => a.order - b.order).slice(0, 2);
  const keywords = [...philosophy.keywords].sort((a, b) => a.order - b.order);
  return (
    // §36 — narrower(~55%) 오른쪽 칼럼에 히어로급 statement-title(최대
    // 82px) 클램프를 그대로 쓰니 폭에 비해 글자가 과하게 크고 줄바꿈도
    // 어색했다. 이 칼럼 폭에 맞는 크기로 다시 잡았다.
    <div className="h-full flex flex-col justify-center min-w-0">
      <p className="text-2xl md:text-3xl lg:text-4xl font-medium text-korean mb-3 max-w-2xl line-clamp-2 leading-snug">{profile.representativePhrase}</p>
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
  );
}

function NumbersPanel({ profile }: { profile: Profile }) {
  const facts = [...profile.keyFacts].sort((a, b) => a.order - b.order);
  return (
    // §29 — 보조창이 커진 만큼(flex-1) 숫자 콘텐츠도 그에 맞춰 키웠다.
    // 작은 악센트 밑줄 + 라벨 + 큰 숫자로 이어지는 통계 카드 형태로 바꾸고,
    // 그리드 간격도 넓혀 여백이 남는 느낌 없이 박스를 채우게 했다.
    // §35 — 사진이 항상 옆에 고정되면서 이 패널은 이제 박스 전체가 아니라
    // 오른쪽 절반 폭만 쓴다. 3열은 좁은 폭에서 답답해 보여 2열로 조정했다.
    <div className="h-full flex items-center">
      <div className="grid grid-cols-2 gap-x-8 md:gap-x-10 gap-y-8 md:gap-y-10 w-full">
        {facts.map((f) => (
          <div key={f.label}>
            <span className="block w-6 h-[2px] mb-3" style={{ background: "var(--accent)" }} />
            <p className="text-korean text-sm md:text-base text-ink-muted mb-2 tracking-wide">{f.label}</p>
            <p className="text-korean text-3xl md:text-4xl text-ink font-bold tabular-nums">{f.value}</p>
          </div>
        ))}
        {facts.length === 0 && <p className="text-ink-muted text-sm">등록된 핵심 수치가 아직 없습니다.</p>}
      </div>
    </div>
  );
}

// §37 — "1개씩 스크롤해서 보는 게 아니라 1~5번을 전부 나열해달라"는 요청에
// 따라, 업무 역량 탭 내부의 1단계씩 넘기는 스크롤 서브스텝을 없앴다.
// 실제 CMS에 등록된 역량 데이터를 그대로 쓰고(가짜 항목을 만들어 채우지
// 않음), 5개보다 많으면 순서상 앞의 5개까지만 한 번에 나열한다.
function SkillsPanel({ items }: { items: Competency[] }) {
  const sorted = items.slice(0, MAX_SKILL_STEPS);

  if (sorted.length === 0) return <p className="text-ink-muted text-sm">등록된 업무 역량이 아직 없습니다.</p>;

  return (
    <div className="h-full flex flex-col justify-center gap-5 md:gap-6">
      {sorted.map((c, i) => (
        <div key={c.id} className="flex gap-4">
          <span className="font-en text-sm tabular-nums shrink-0 mt-1" style={{ color: "var(--accent)" }}>
            {String(i + 1).padStart(2, "0")}
          </span>
          <div className="min-w-0">
            <h3 className="text-base md:text-lg font-bold mb-1 text-korean">{c.title}</h3>
            <p className="text-ink-secondary text-sm leading-relaxed text-korean line-clamp-2">{c.description}</p>
          </div>
        </div>
      ))}
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

  const [tab, setTab] = useState<TabKey>("identity");
  const tabRef = useRef<TabKey>(tab);
  const stageRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    tabRef.current = tab;
  }, [tab]);

  // §37 — 업무 역량 탭이 더 이상 내부적으로 1~5단계를 스크롤로 넘기지 않고
  // 한 번에 다 보여주므로, "가상 스텝" 개념 자체가 필요 없어졌다. 이제는
  // 딱 3개 탭(소개/핵심 수치/업무 역량) 사이만 스크롤 ±1로 오간다.
  useLayoutEffect(() => {
    const totalSteps = TABS.length;
    const unregister = registerSubSteps("profile", {
      count: totalSteps,
      getActive: () => TABS.findIndex((t) => t.key === tabRef.current),
      enter: (dir) => setTab(dir === 1 ? "identity" : "skills"),
      setActive: (index) => {
        const clamped = Math.max(0, Math.min(totalSteps - 1, index));
        setTab(TABS[clamped].key);
      },
    });
    return unregister;
  }, []);

  // §21 — 탭 변경은 페이지 전체가 아니라 고정 프레임 안의 내용만 Fade
  // 전환한다(약 320~350ms). 프레임 높이/제목/이미지/탭 메뉴 위치는 그대로 둔다.
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage || prefersReducedMotion()) return;
    gsap.fromTo(stage, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.2, delay: 0.12, ease: "power2.out", overwrite: "auto" });
  }, [tab]);

  const activeIndex = TABS.findIndex((t) => t.key === tab);

  return (
    // §24 — 보조창(탭 콘텐츠 박스)이 작아 보인다는 피드백에 따라 구조를 바꿨다.
    // 기존에는 fp-section의 justify-content:center가 콘텐츠를 세로로 가운데
    // 정렬만 하고, 박스는 clamp() 고정 높이(최대 460px)로 작게 묶여 있었다.
    // 이제는 이 섹션만 justify-content를 stretch로 덮어써서 Container가
    // 섹션 높이(100dvh - padding) 전체를 세로 flex로 채우게 하고, 그 안에서
    // 제목/탭 메뉴는 원래 크기 그대로(shrink-0), 박스는 flex-1로 "남는
    // 공간을 전부" 차지한다. 즉 화면이 크면 박스도 그만큼 커지고, 화면이
    // 작으면 자동으로 줄어들되 최소/최대 높이로 안전선을 둔다 — 이전처럼
    // 임의의 vh 비율을 추측해서 넣는 방식보다 실제 남는 공간에 맞춰 항상
    // 최대한 크게 나온다.
    <section id="profile" className="fp-section bg-bg-soft py-6 md:py-8" style={{ justifyContent: "stretch" }}>
      <Container className="w-full h-full flex flex-col">
        <div className="shrink-0">
          <Reveal>
            <p className="accent-text text-sm font-medium mb-3 tracking-wide">PROFILE</p>
          </Reveal>
          <Reveal delay={0.05} strength="strong" holdAfterEnter>
            <h2 className="section-title font-bold mb-4 md:mb-6 text-korean">
              {profile.name} · {profile.role}
            </h2>
          </Reveal>

          <div className="flex flex-wrap gap-2 mb-4 md:mb-6 border-b border-line pb-4">
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
        </div>

        {/* §22-24, §36 — 탭/스텝 콘텐츠 길이가 달라도 화면이 흔들리지 않게
            프레임 크기(flex-1, min/max 높이)는 고정하고 내부만 Fade
            전환하는 건 그대로 유지한다. 다만 "굳이 박스가 필요 없다"는
            피드백에 따라 반대 톤 배경/모서리/안쪽 패딩으로 된 카드 프레임은
            없앴다 — 사진과 텍스트가 섹션 배경 위에 바로 놓인다. */}
        <div className="relative w-full flex-1 min-h-0" style={{ minHeight: "260px", maxHeight: "640px" }}>
          {/* §35 — 사진(왼쪽)은 탭과 무관하게 항상 고정이고, 오른쪽 절반만
              탭에 따라 Fade 전환된다. 그리드 비율(0.9fr/1.1fr)은 이전
              IdentityPanel과 동일하게 유지해 사진 크기/위치가 그대로다. */}
          <div className="grid grid-cols-1 md:grid-cols-[0.9fr_1.1fr] gap-6 md:gap-10 h-full items-stretch">
            <div className="relative w-full max-w-[46%] md:max-w-none h-full mx-auto md:mx-0 overflow-hidden rounded-sm">
              <MediaFrame media={profile.profilePhoto} className="h-full w-full" />
            </div>
            <div ref={stageRef} className="relative h-full min-w-0">
              {tab === "identity" && <IdentityText profile={profile} philosophy={philosophy} />}
              {tab === "numbers" && <NumbersPanel profile={profile} />}
              {tab === "skills" && <SkillsPanel items={sortedCompetencies} />}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
