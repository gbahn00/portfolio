import { getContent } from "@/lib/data/repo";
import { visibleSorted } from "@/lib/publish";
import { MediaRef } from "@/lib/types";
import { Hero } from "@/components/sections/Hero";
import { AboutIdentity } from "@/components/sections/AboutIdentity";
import { ProfileKeyNumbers } from "@/components/sections/ProfileKeyNumbers";
import { Timeline } from "@/components/sections/Timeline";
import { SelectedWork } from "@/components/sections/SelectedWork";
import { Competencies } from "@/components/sections/Competencies";
import { WorkingProcess } from "@/components/sections/WorkingProcess";
import { Contributions } from "@/components/sections/Contributions";
import { FuturePlans } from "@/components/sections/FuturePlans";
import { Collaboration } from "@/components/sections/Collaboration";
import { Faq } from "@/components/sections/Faq";
import { Closing } from "@/components/sections/Closing";

export const dynamic = "force-dynamic";

const PROJECT_FIELD_COUNT = 7; // 의류·카페및음식·인테리어·인물프로필·치과및병원광고·유튜브·생성형AI콘텐츠

export default async function HomePage() {
  const content = await getContent();
  const vis = content.settings?.sectionVisibility || {};
  const order = content.settings?.sectionOrder?.length
    ? content.settings.sectionOrder
    : ["hero", "profileNumbers", "about", "timeline", "work", "competencies", "workingProcess", "contributions", "futurePlans", "collaboration", "faq", "closing"];

  const publicProjects = content.projects.filter((p) => p.publicOk);
  const joinYear = content.profile?.joinedAt ? new Date(content.profile.joinedAt).getFullYear() : "";
  const aiToolCount = content.ai?.tools?.filter((t) => t.visible !== false).length ?? 0;

  const heroStats = [
    { label: "입사", value: String(joinYear) },
    { label: "생성형 AI 도구", value: `${aiToolCount}+` },
    { label: "주요 업무 분야", value: String(PROJECT_FIELD_COUNT) },
  ];

  // Hero 우측 이미지 스택 — 대표 프로젝트 이미지 우선, 없으면 현장 사진으로 대체
  const heroStackImages: MediaRef[] = [
    content.hero?.backgroundImage,
    ...publicProjects.slice(0, 2).map((p) => p.heroImage),
    ...(content.profile?.onSitePhotos ?? []),
  ].filter((m): m is MediaRef => Boolean(m)).slice(0, 3);

  const sectionMap: Record<string, React.ReactNode> = {
    hero: vis.hero !== false && <Hero key="hero" hero={content.hero} stats={heroStats} stackImages={heroStackImages} />,
    profileNumbers: vis.profileNumbers !== false && <ProfileKeyNumbers key="profileNumbers" profile={content.profile} />,
    about: vis.about !== false && <AboutIdentity key="about" profile={content.profile} philosophy={content.philosophy} />,
    timeline: vis.timeline !== false && <Timeline key="timeline" entries={visibleSorted(content.timeline)} />,
    work: vis.work !== false && <SelectedWork key="work" projects={publicProjects} />,
    competencies: vis.competencies !== false && <Competencies key="competencies" items={visibleSorted(content.competencies)} />,
    workingProcess: vis.workingProcess !== false && <WorkingProcess key="workingProcess" />,
    contributions: vis.contributions !== false && <Contributions key="contributions" data={content.contributions} />,
    futurePlans: vis.futurePlans !== false && <FuturePlans key="futurePlans" items={content.futurePlans} />,
    collaboration: vis.collaboration !== false && (
      <Collaboration key="collaboration" items={content.collaborations} projects={content.projects} />
    ),
    faq: vis.faq !== false && <Faq key="faq" items={content.faq ?? []} />,
    closing: vis.closing !== false && <Closing key="closing" data={content.closing} />,
  };

  // 10라운드 명세서 §1 — 완전한 Full Page Scroll(스크롤 1회=화면 전환, 강제 스냅)은
  // 기존 About/Journey/업무역량의 핀+스크럽 모션과 정면으로 충돌해서 적용하지
  // 않았다. 대신 CSS scroll-snap을 "proximity"(자연스럽게 멈추는 지점 근처일
  // 때만 부드럽게 정렬, mandatory처럼 스크롤을 강제로 가로채지 않음)로 가볍게
  // 적용해, 각 섹션 경계 근처에서 대략 한 화면씩 멈추는 듯한 느낌만 준다.
  return (
    <main className="snap-page">
      {order.map((key: string) => (
        <div key={key} className="snap-section">
          {sectionMap[key] || null}
        </div>
      ))}
    </main>
  );
}
