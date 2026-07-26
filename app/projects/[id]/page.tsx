import { notFound } from "next/navigation";
import { getContent } from "@/lib/data/repo";
import { Container } from "@/components/ui/Container";
import { MediaFrame } from "@/components/ui/MediaFrame";
import { Reveal } from "@/components/motion/Reveal";
import { ProjectCover } from "@/components/sections/ProjectCover";
import { ProjectNav } from "@/components/sections/ProjectNav";
import { isPlaceholder } from "@/lib/utils";
import { Project } from "@/lib/types";

export const dynamic = "force-dynamic";

// ============================================================================
// §55 — 대표 프로젝트 상세 페이지(1~8번 전부)를 "프로젝트 개요 / 제작 의도 /
// 기여도 / Tools" 정확히 4개 섹션으로 고정했다.
//
// 예전에는 10개짜리 자유 블록 체계(overview/before/purpose/role/process/
// decisions/tools/result/impact/future-use)를 프로젝트마다 관리자가 직접
// 채워야 노출됐다. 그런데 1~4번 프로젝트는 이 블록이 하나도 채워져 있지
// 않아 상세 페이지 본문이 텅 비어 보이는 문제가 있었다(반면 5~8번은
// 예전에 다 채워둬서 10개 섹션이 그대로 나왔다).
//
// 이제는 항상 값이 있는 프로젝트 기본 정보(상세 설명/제작 목적/담당 역할/
// 사용 도구 — 관리자 화면 상단에서 모든 프로젝트가 공통으로 입력하는
// 필드)를 기본값으로 삼고, 예전에 입력해 둔 블록 데이터가 해당 키
// (overview/purpose/role/tools)에 남아 있으면 그 본문·이미지를 우선
// 사용한다. 그 결과 1~8번 전부 항상 이 4개 섹션이 채워진 상태로 보이고,
// 5~8번은 예전에 공들여 넣어둔 이미지도 그대로 유지된다.
// ============================================================================

type SectionKey = "overview" | "purpose" | "role";

const SECTION_TITLES: Record<SectionKey, string> = {
  overview: "프로젝트 개요",
  purpose: "제작 의도",
  role: "기여도",
};

function findBlock(project: Project, key: SectionKey | "tools") {
  return project.detailBlocks.find((b) => b.key === key && b.visible !== false);
}

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const content = await getContent();
  const project = content.projects.find((p) => p.id === params.id);

  if (!project || !project.publicOk) notFound();

  // Selected Works와 동일한 정렬 기준(order)으로 이전/다음 프로젝트를 찾는다.
  const orderedPublic = content.projects.filter((p) => p.publicOk).sort((a, b) => a.order - b.order);
  const currentIndex = orderedPublic.findIndex((p) => p.id === project.id);
  const prevProject = currentIndex > 0 ? orderedPublic[currentIndex - 1] : null;
  const nextProject = currentIndex >= 0 && currentIndex < orderedPublic.length - 1 ? orderedPublic[currentIndex + 1] : null;

  const fieldFallback: Record<SectionKey, string> = {
    overview: project.description,
    purpose: project.purpose,
    role: project.role,
  };

  const sections = (["overview", "purpose", "role"] as SectionKey[])
    .map((key) => {
      const block = findBlock(project, key);
      const body = block?.body && !isPlaceholder(block.body) ? block.body : fieldFallback[key];
      return { key, title: SECTION_TITLES[key], body, images: block?.images ?? [] };
    })
    .filter((s) => s.body && !isPlaceholder(s.body));

  const toolsBlock = findBlock(project, "tools");
  const toolsList = (toolsBlock?.body && !isPlaceholder(toolsBlock.body) ? toolsBlock.body.split("\n") : project.tools)
    .map((t) => t.trim())
    .filter((t) => t && !isPlaceholder(t));

  return (
    <main className="bg-bg min-h-screen">
      <ProjectCover project={project} />

      <Container className="pt-24 md:pt-32 pb-24 md:pb-32">
        <div className="max-w-3xl space-y-16">
          {sections.map((s) => (
            <Reveal key={s.key}>
              <h2 className="text-2xl md:text-3xl font-semibold mb-4 text-korean">{s.title}</h2>
              <p className="text-ink-muted leading-relaxed whitespace-pre-line text-korean mb-6">{s.body}</p>
              {s.images.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {s.images.map((img, i) => (
                    <MediaFrame key={i} media={img} className="aspect-[4/3] rounded-sm" />
                  ))}
                </div>
              )}
            </Reveal>
          ))}

          {toolsList.length > 0 && (
            <Reveal>
              <h2 className="text-2xl md:text-3xl font-semibold mb-4 text-korean">Tools</h2>
              <div className="flex flex-wrap gap-2">
                {toolsList.map((t, i) => (
                  <span
                    key={i}
                    className="text-sm rounded-full border border-line px-4 py-1.5 text-ink-secondary text-korean"
                  >
                    {t}
                  </span>
                ))}
              </div>
              {toolsBlock?.images && toolsBlock.images.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                  {toolsBlock.images.map((img, i) => (
                    <MediaFrame key={i} media={img} className="aspect-[4/3] rounded-sm" />
                  ))}
                </div>
              )}
            </Reveal>
          )}

          {project.gallery?.length > 0 && (
            <Reveal>
              <h2 className="text-xl md:text-2xl font-semibold mb-4">상세 이미지</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {project.gallery.map((img, i) => (
                  <MediaFrame key={i} media={img} className="aspect-square rounded-sm" />
                ))}
              </div>
            </Reveal>
          )}
        </div>
      </Container>

      <Container className="pb-24 md:pb-32">
        <ProjectNav prev={prevProject} next={nextProject} />
      </Container>
    </main>
  );
}
