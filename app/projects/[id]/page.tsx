import { notFound } from "next/navigation";
import { getContent } from "@/lib/data/repo";
import { Container } from "@/components/ui/Container";
import { MediaFrame } from "@/components/ui/MediaFrame";
import { GalleryGrid } from "@/components/ui/GalleryGrid";
import { Reveal } from "@/components/motion/Reveal";
import { ProjectCover } from "@/components/sections/ProjectCover";
import { ProjectNav } from "@/components/sections/ProjectNav";
import { BeforeAfterSlider } from "@/components/sections/BeforeAfterSlider";
import { FinalVideoBlock } from "@/components/sections/FinalVideoBlock";
import { isPlaceholder, optimizedImageSrc, stripPlaceholder } from "@/lib/utils";
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

  // §71 — 프로젝트 개요/제작 의도/기여도는 "고정" 섹션이라 모든 상세
  // 페이지에 항상 노출되어야 한다. 이전에는 본문 전체가 비어 있거나
  // isPlaceholder() 판정을 받으면(대괄호 메모가 한 글자라도 섞여 있어도)
  // 섹션 자체를 통째로 걸러냈는데, 그 탓에 실제로 내용이 채워진 프로젝트
  // (예: 치과 상세페이지의 "기여도")까지 화면에서 사라지는 경우가 있었다.
  // 이제는 대괄호 메모만 제거(stripPlaceholder)하고 남은 실제 문장은
  // 항상 보여주며, 3개 섹션 자체를 필터링해서 빼지 않는다.
  const sections = (["overview", "purpose", "role"] as SectionKey[]).map((key) => {
    const block = findBlock(project, key);
    // detailBlocks 본문은 "[자료 필요] ..." 형태의 안내용 템플릿 문장을
    // 그대로 담고 있는 경우가 있어 여기서는 원래대로 통째로 걸러낸다
    // (isPlaceholder). 반면 프로젝트 기본 필드(설명/목적/역할)는 실제
    // 작성된 문장 뒤에 짧은 대괄호 메모만 덧붙은 경우가 있어, 그 메모만
    // 제거(stripPlaceholder)하고 실제 문장은 살려서 사용한다.
    const blockBody = block?.body && !isPlaceholder(block.body) ? block.body : "";
    const body = blockBody || stripPlaceholder(fieldFallback[key]);
    return { key, title: SECTION_TITLES[key], body, images: block?.images ?? [] };
  });

  const toolsBlock = findBlock(project, "tools");
  const toolsList = (toolsBlock?.body && !isPlaceholder(toolsBlock.body) ? toolsBlock.body.split("\n") : project.tools)
    .map((t) => t.trim())
    .filter((t) => t && !isPlaceholder(t));

  // §97 — 대표 프로젝트 전체 상세페이지의 구조 순서를 다음으로 통일한다:
  //   1) 상세페이지 대표 화면 (ProjectCover)
  //   2) 보정 전/후 사진 리스트 (첨부돼 있을 때만)
  //   3) 상세 이미지(영상) 리스트 — 최종 영상은 별도의 큰 단일 블록으로,
  //      갤러리는 그 아래에 이어서 (각각 첨부돼 있을 때만)
  //   4) 프로젝트 개요
  //   5) 제작 의도
  //   6) 기여도 (+ Tools)
  // 예전에는 보정 전/후·최종 영상·갤러리가 서로 배타적인 "한 자리"를
  // 두고 우선순위로 경쟁해서 하나만 보였는데(§66), 이제는 셋 다 독립적으로
  // — 각자 첨부된 게 있으면 전부 이 순서대로 나온다.
  // 보정 전(before) 사진 없이 보정 후(after) 사진만 등록된 짝은 반쪽짜리라
  // 슬라이더로 보여줄 수 없으므로 개수에서 제외한다.
  const validBeforeAfter = (project.beforeAfter ?? []).filter((p) => p.before?.url && p.after?.url);
  const hasBeforeAfter = validBeforeAfter.length > 0;
  const hasFinalVideo = Boolean(project.finalVideo?.url && !isPlaceholder(project.finalVideo.url));
  const hasGallery = project.gallery?.length > 0;
  const hasAnyMedia = hasBeforeAfter || hasFinalVideo || hasGallery;

  // 셋 중 실제로 맨 처음 나오는 항목만 대표 화면과 이어지는 넉넉한
  // 여백(pt-24/pt-32)을 쓰고, 그다음부터는 좀 더 좁은 여백(pt-16/pt-20)을
  // 쓴다 — 위아래로 다닥다닥 붙지 않으면서도 서로 다른 섹션임이 자연스럽게
  // 구분되도록.
  const firstMedia = hasBeforeAfter ? "beforeAfter" : hasFinalVideo ? "video" : hasGallery ? "gallery" : null;
  function mediaTopPad(kind: "beforeAfter" | "video" | "gallery") {
    return firstMedia === kind ? "pt-24 md:pt-32" : "pt-16 md:pt-20";
  }

  return (
    <main className="bg-bg min-h-screen">
      <ProjectCover project={project} />

      {/* §97 — 2) 보정 전/후 사진 리스트. §89 — max-w-3xl(본문 읽기 폭)로
          감싸면 가운데 정렬된 Container 안에서 사진이 왼쪽 절반쯤까지만
          나타나 보였다. 이미지/영상 영역은 본문 텍스트와 달리 넓게
          보여주는 게 자연스러워, Container 전체 폭까지 채운다. */}
      {hasBeforeAfter && (
        <Container className={mediaTopPad("beforeAfter")}>
          <BeforeAfterSlider pairs={validBeforeAfter} />
        </Container>
      )}

      {/* §97 — 3) 상세 이미지(영상) 리스트: 최종 영상(있으면 별도의 큰
          단일 블록) → 갤러리(있으면 그 아래에 이어서) 순서로, 각각
          독립적으로 노출된다. */}
      {hasFinalVideo && project.finalVideo && (
        <Container className={mediaTopPad("video")}>
          <FinalVideoBlock
            video={project.finalVideo}
            posterFallback={project.heroImage ? optimizedImageSrc(project.heroImage.url, 1200) : undefined}
          />
        </Container>
      )}
      {hasGallery && (
        <Container className={mediaTopPad("gallery")}>
          <Reveal>
            <h2 className="text-2xl md:text-3xl font-semibold mb-4 text-korean">상세 이미지</h2>
            <GalleryGrid items={project.gallery} />
          </Reveal>
        </Container>
      )}

      {/* §97 — 4~6) 프로젝트 개요 / 제작 의도 / 기여도 (+ Tools) */}
      <Container className={`${hasAnyMedia ? "pt-16 md:pt-20" : "pt-24 md:pt-32"} pb-24 md:pb-32`}>
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

        </div>
      </Container>

      <Container className="pb-24 md:pb-32">
        <ProjectNav prev={prevProject} next={nextProject} />
      </Container>
    </main>
  );
}
