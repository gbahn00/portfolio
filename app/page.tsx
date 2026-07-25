import { getContent } from "@/lib/data/repo";
import { visibleSorted } from "@/lib/publish";
import { MediaRef } from "@/lib/types";
import { Hero } from "@/components/sections/Hero";
import { ProfileSection } from "@/components/sections/ProfileSection";
import { Timeline } from "@/components/sections/Timeline";
import { SelectedWork } from "@/components/sections/SelectedWork";
import { FuturePlans } from "@/components/sections/FuturePlans";
import { Closing } from "@/components/sections/Closing";
import { FullPageScroll } from "@/components/motion/FullPageScroll";
import { PageIndicator } from "@/components/motion/PageIndicator";

export const dynamic = "force-dynamic";

const PROJECT_FIELD_COUNT = 7; // 의류·카페및음식·인테리어·인물프로필·치과및병원광고·유튜브·생성형AI콘텐츠

// 전체 구조 개편 명세서 §1~§7 — 메인 페이지를 정확히 6개 섹션으로 고정한다.
// 01.대표 페이지 → 02.프로필 → 03.업무 성장과정 → 04.대표 프로젝트 →
// 05.향후 추진 계획 → 06.마지막 페이지. 예전의 개별 About/Profile Key
// Numbers/업무역량/Working Process/Collaboration/FAQ/Contributions 섹션은
// 물리적으로 제거했다(About·KeyNumbers·역량·일하는 방식은 02.프로필 안의
// 탭으로 통합됨). 순서는 더 이상 관리자 화면에서 바꿀 수 없는 고정 구조다.
export default async function HomePage() {
  const content = await getContent();

  const publicProjects = content.projects.filter((p) => p.publicOk);
  const joinYear = content.profile?.joinedAt ? new Date(content.profile.joinedAt).getFullYear() : "";
  const aiToolCount = content.ai?.tools?.filter((t) => t.visible !== false).length ?? 0;

  const heroStats = [
    { label: "입사", value: String(joinYear) },
    { label: "생성형 AI 도구", value: `${aiToolCount}+` },
    { label: "주요 업무 분야", value: String(PROJECT_FIELD_COUNT) },
  ];

  const heroStackImages: MediaRef[] = [
    content.hero?.backgroundImage,
    ...publicProjects.slice(0, 2).map((p) => p.heroImage),
    ...(content.profile?.onSitePhotos ?? []),
  ].filter((m): m is MediaRef => Boolean(m)).slice(0, 3);

  return (
    <FullPageScroll>
      <PageIndicator />
      <main>
        <div data-fp-section data-fp-id="hero">
          <Hero hero={content.hero} stats={heroStats} stackImages={heroStackImages} />
        </div>
        <div data-fp-section data-fp-id="profile">
          <ProfileSection
            profile={content.profile}
            philosophy={content.philosophy}
            competencies={visibleSorted(content.competencies)}
          />
        </div>
        <div data-fp-section data-fp-id="growth">
          <Timeline entries={visibleSorted(content.timeline)} />
        </div>
        <div data-fp-section data-fp-id="projects">
          <SelectedWork projects={publicProjects} />
        </div>
        <div data-fp-section data-fp-id="future">
          <FuturePlans items={content.futurePlans} />
        </div>
        <div data-fp-section data-fp-id="closing">
          <Closing data={content.closing} />
        </div>
      </main>
    </FullPageScroll>
  );
}
