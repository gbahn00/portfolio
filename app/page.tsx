import { getContent } from "@/lib/data/repo";
import { visibleSorted } from "@/lib/publish";
import { MediaRef } from "@/lib/types";
import { Hero } from "@/components/sections/Hero";
import { ProfileSection } from "@/components/sections/ProfileSection";
import { Timeline } from "@/components/sections/Timeline";
import { SelectedWork } from "@/components/sections/SelectedWork";
import { FuturePlans } from "@/components/sections/FuturePlans";
import { Faq } from "@/components/sections/Faq";
import { Closing } from "@/components/sections/Closing";
import { FullPageScroll } from "@/components/motion/FullPageScroll";
import { PageIndicator } from "@/components/motion/PageIndicator";

// §151 — "첫 방문자에게 이미지/영상이 늦게 나온다"는 문제의 실제 원인은
// force-dynamic이었다: 이 값이 있으면 방문할 때마다 이 페이지 전체를
// 서버에서 처음부터 다시 렌더링(=Supabase 조회 18개 왕복 포함)한 뒤에야
// 이미지/영상 주소가 담긴 HTML을 보낼 수 있었다. 이제 렌더링 결과를
// 캐시해 방문자는 그 캐시를 즉시 받고, 관리자가 저장하는 순간
// (lib/data/repo.ts의 saveContent → revalidatePath)에만 정확히 새로
// 그린다. revalidate는 그 무효화 호출이 어떤 이유로 누락되더라도 오래된
// 내용이 무한정 남아있지 않도록 하는 안전망이다.
export const revalidate = 3600;

// 전체 구조 개편 명세서 §1~§7 + 인터랙션 수정 요청서(3차) — 메인 페이지를
// 정확히 7개 섹션으로 고정한다. 01.대표 페이지 → 02.프로필 → 03.업무
// 성장과정 → 04.대표 프로젝트 → 05.향후 추진 계획 → 06.FAQ → 07.마지막
// 페이지. 예전의 개별 About/Profile Key Numbers/업무역량/Working Process/
// Collaboration/Contributions 섹션은 물리적으로 제거했다(About·KeyNumbers·
// 역량은 02.프로필 안의 탭으로 통합됨). FAQ는 06번으로 다시 도입했다.
// 순서는 더 이상 관리자 화면에서 바꿀 수 없는 고정 구조다.
//
// §42 — Hero의 입사/생성형 AI 도구/주요 업무 분야 통계(heroStats)는
// 없앴다. 그 계산에만 쓰이던 joinYear/aiToolCount/PROJECT_FIELD_COUNT도
// 함께 정리했다.
export default async function HomePage() {
  const content = await getContent();

  const publicProjects = content.projects.filter((p) => p.publicOk);

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
          <Hero hero={content.hero} stackImages={heroStackImages} />
        </div>
        <div data-fp-section data-fp-id="profile">
          <ProfileSection
            profile={content.profile}
            philosophy={content.philosophy}
            competencies={visibleSorted(content.competencies)}
          />
        </div>
        <div data-fp-section data-fp-id="growth">
          <Timeline entries={visibleSorted(content.timeline)} title={content.growth?.title} />
        </div>
        <div data-fp-section data-fp-id="projects">
          <SelectedWork projects={publicProjects} />
        </div>
        <div data-fp-section data-fp-id="future">
          <FuturePlans items={content.futurePlans} />
        </div>
        <div data-fp-section data-fp-id="faq">
          <Faq items={content.faq ?? []} />
        </div>
        <div data-fp-section data-fp-id="closing">
          <Closing data={content.closing} />
        </div>
      </main>
    </FullPageScroll>
  );
}
