import { getContent } from "@/lib/data/repo";
import { ProjectsList } from "./list";

export const dynamic = "force-dynamic";

// §160 — "대표 프로젝트" 섹션 제목도 timeline/page.tsx의 initialGrowth와
// 동일하게, site-content.json에 아직 필드가 없는(마이그레이션 전) 경우를
// 대비한 기본값을 둔다.
const DEFAULT_PROJECTS_SECTION = { title: "촬영부터 영상, 생성형 AI와 업무 체계까지.", status: "published" as const };

export default async function ProjectsAdminPage() {
  const content = await getContent();
  return (
    <ProjectsList
      initial={content.projects}
      initialProjectsSection={content.projectsSection ?? DEFAULT_PROJECTS_SECTION}
    />
  );
}
