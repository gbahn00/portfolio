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
          <p key={p.id} className="body-large text-ink-secondary text-korean max-w-xl line-clamp-2 whitespace-pre-line">
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

// §40 — 섹션 이름을 "생성형 활용 도구"에서 "Skills"로 바꾸고, 제외했던
// 범용 AI 아이콘도 다시 포함해 총 6개 아이콘을 전부 쓴다. 아이콘 자체는
// 여전히 첨부받은 고정 이미지(public/icons/tools)를 쓰지만, 이름은
// profile.toolSkills(관리자에서 추가/삭제하고 %를 조절할 수 있음)에서
// 오고, 코드는 이름으로 아이콘을 찾아 붙이기만 한다.
const TOOL_ICON_MAP: Record<string, string> = {
  Photoshop: "/icons/tools/photoshop.png",
  "Premiere Pro": "/icons/tools/premiere.png",
  CapCut: "/icons/tools/capcut.png",
  "생성형 AI": "/icons/tools/ai-tool.png",
  Illustrator: "/icons/tools/illustrator.png",
  "After Effects": "/icons/tools/after-effects.png",
};

// §54 — Skills 아이콘 배치를 "포토샵/프리미어프로 → 일러스트레이터/
// 애프터이펙트 → 캡컷/생성형 AI" 순서로 지정해달라는 요청. 관리자가 입력한
// 순서(order)와 무관하게 항상 이 순서로 보이도록, 이름 기준 고정 우선순위
// 목록을 두고 그 기준으로 정렬한다(목록에 없는 새 이름은 맨 뒤로).
const SKILL_DISPLAY_ORDER = ["Photoshop", "Premiere Pro", "Illustrator", "After Effects", "CapCut", "생성형 AI"];

function NumbersPanel({ profile }: { profile: Profile }) {
  const facts = [...profile.keyFacts].sort((a, b) => a.order - b.order);
  const skills = [...(profile.toolSkills ?? [])]
    .filter((s) => s.name)
    .sort((a, b) => {
      const ai = SKILL_DISPLAY_ORDER.indexOf(a.name);
      const bi = SKILL_DISPLAY_ORDER.indexOf(b.name);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });

  // §64 — Skills 진행바가 처음부터 목표 값만큼 채워진 채로 보이던 걸,
  // 0%에서 목표 값까지 채워지는 모션으로 바꿨다. 이 패널은 "핵심 수치"
  // 탭으로 전환될 때마다 새로 mount되므로(탭이 바뀔 때마다 조건부 렌더링),
  // 이 useLayoutEffect도 매번 다시 실행되어 탭을 볼 때마다 애니메이션이
  // 재생된다.
  const skillsWrapRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const wrap = skillsWrapRef.current;
    if (!wrap) return;
    const bars = Array.from(wrap.querySelectorAll<HTMLElement>("[data-skill-fill]"));
    if (bars.length === 0) return;

    if (prefersReducedMotion()) {
      bars.forEach((bar) => {
        bar.style.width = `${bar.dataset.target}%`;
      });
      return;
    }

    gsap.set(bars, { width: "0%" });
    gsap.to(bars, {
      width: (_i, target) => `${(target as HTMLElement).dataset.target}%`,
      duration: 1,
      ease: "power2.out",
      stagger: 0.08,
      delay: 0.15,
      overwrite: "auto",
    });
  }, [skills.map((s) => s.id).join(",")]);

  return (
    // §54 — 행 사이 구분선은 없애고 왼쪽 정렬 리스트 구조만 유지해달라는
    // 요청에 따라 border를 없애고 gap만으로 행 간격을 준다.
    <div className="h-full flex items-center">
      <div className="w-full">
        <div className="flex flex-col gap-3 md:gap-3.5">
          {facts.map((f) => (
            <div key={f.label} className="flex items-center gap-4 md:gap-6">
              <span className="block w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--accent)" }} />
              <p className="text-korean text-xs md:text-sm text-ink-muted tracking-wide shrink-0 w-20 md:w-24">
                {f.label}
              </p>
              <p className="text-korean text-lg md:text-xl lg:text-2xl text-ink font-bold leading-snug text-left">
                {f.value}
              </p>
            </div>
          ))}
          {facts.length === 0 && <p className="text-ink-muted text-sm">등록된 핵심 수치가 아직 없습니다.</p>}
        </div>

        {/* §40-44 — Skills: 위 핵심 수치와 구분선으로 나뉘는 아래쪽 절반.
            §45 — 아이콘을 한 번 더 키우고(h-11~h-14), 진행바 최대폭도
            늘려서(220~260px) 화면 여백 대비 너무 작아 보이던 느낌을
            해소했다. 라벨/퍼센트 글자도 함께 키웠다.
            §54 — 위 SKILL_DISPLAY_ORDER로 정렬된 순서를 grid-cols-2(행
            우선 채우기)에 그대로 흘려보내면 요청받은 3행 짝이 나온다. */}
        <div className="mt-7 md:mt-9 pt-6 md:pt-8 border-t border-line">
          <p className="font-en text-sm md:text-base text-ink-muted mb-4 tracking-wide">Skills</p>
          <div ref={skillsWrapRef} className="grid grid-cols-2 gap-x-8 gap-y-4 md:gap-y-5">
            {skills.map((s) => (
              <div key={s.id} className="flex items-center gap-3.5">
                {TOOL_ICON_MAP[s.name] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={TOOL_ICON_MAP[s.name]}
                    alt={s.name}
                    title={s.name}
                    className="h-11 w-11 md:h-14 md:w-14 rounded-lg object-cover shrink-0"
                  />
                )}
                <div className="min-w-0 max-w-[220px] md:max-w-[260px] flex-1">
                  <div className="flex items-center justify-between mb-1.5 gap-2">
                    <span className="text-korean text-sm text-ink-secondary truncate">{s.name}</span>
                    <span className="font-en text-xs tabular-nums text-ink-muted shrink-0">{s.percentage}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: "var(--color-border)" }}>
                    <div
                      data-skill-fill
                      data-target={Math.max(0, Math.min(100, s.percentage))}
                      className="h-full rounded-full"
                      style={{ width: "0%", background: "var(--accent)" }}
                    />
                  </div>
                </div>
              </div>
            ))}
            {skills.length === 0 && <p className="text-ink-muted text-sm col-span-2">등록된 도구가 아직 없습니다.</p>}
          </div>
        </div>
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
    // §46 — "사진 프레임 크기에 비해 업무 역량 내용이 작다"는 피드백에 따라
    // 번호/제목/설명 타이포와 행 간격을 전반적으로 한 단계 키웠다(제목
    // text-base/lg → text-lg/xl/2xl, 설명 text-sm → text-sm/base, 번호도
    // 함께 확대). 최대 5개가 들어가도 프레임(최대 640px) 안에 들어오도록
    // 계산해서 키웠다 — 이전의 짤림 버그를 다시 만들지 않도록 주의.
    <div className="h-full flex flex-col justify-center gap-6 md:gap-8">
      {sorted.map((c, i) => (
        <div key={c.id} className="flex gap-4 md:gap-5">
          <span className="font-en text-base md:text-lg tabular-nums shrink-0 mt-1" style={{ color: "var(--accent)" }}>
            {String(i + 1).padStart(2, "0")}
          </span>
          <div className="min-w-0">
            <h3 className="text-lg md:text-xl lg:text-2xl font-bold mb-2 text-korean">{c.title}</h3>
            <p className="text-ink-secondary text-sm md:text-base leading-relaxed text-korean line-clamp-2 whitespace-pre-line">{c.description}</p>
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
          <Reveal holdAfterEnter>
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
