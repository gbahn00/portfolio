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

  // §103 — 보정 전/후 사진이 있는 프로젝트는 "왼쪽: 보정 전/후 사진(한 장씩
  // 이전/다음), 오른쪽: 프로젝트 개요/제작 의도/기여도/Tools" 2단 구성으로
  // 바뀌었다. 예전엔 이 텍스트 블록이 항상 페이지 맨 아래 별도 Container에
  // 있었는데, 보정 전/후가 있는 프로젝트는 그 블록을 통째로 위로 옮겨서
  // 오른쪽 칸에 채운다(중복 노출 방지 — 아래쪽엔 더 이상 렌더링하지 않는다).
  // 보정 전/후가 없는 프로젝트는 예전과 같은 세로 1단 구조를 그대로 쓴다.
  const sectionsAndTools = (
    <div className="space-y-16">
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
  );

  // 보정 전/후 다음으로 실제 처음 나오는 미디어(영상/갤러리)만 대표
  // 화면과 이어지는 넉넉한 여백(pt-24/pt-32)을 쓰고, 그다음부터는 좀 더
  // 좁은 여백을 쓴다. §106 — "보정 전후 사진과 상세 이미지 사이 공간이
  // 너무 넓다"는 피드백으로, 보정 전/후 섹션의 하단 여백(아래)과 다음
  // 미디어 섹션의 상단 여백(pt-16/20 → pt-10/12)을 함께 줄였다.
  const firstMedia = hasBeforeAfter ? "beforeAfter" : hasFinalVideo ? "video" : hasGallery ? "gallery" : null;
  function mediaTopPad(kind: "video" | "gallery") {
    return firstMedia === kind ? "pt-24 md:pt-32" : "pt-10 md:pt-12";
  }

  return (
    <main className="bg-bg min-h-screen">
      <ProjectCover project={project} />

      {/* §103 — 보정 전/후 사진(왼쪽, 한 장씩 이전/다음) + 프로젝트 개요/
          제작 의도/기여도/Tools(오른쪽)를 나란히 배치한다. */}
      {hasBeforeAfter && (
        <Container className="pt-24 md:pt-32 pb-8 md:pb-10">
          {/* §104 — 제목을 flex 바깥(위)에 둬서, 아래 왼쪽(사진)과
              오른쪽(프로젝트 개요 등) 칸이 같은 지점(사진 윗변)에서
              나란히 시작하도록 했다. */}
          <Reveal>
            <h2 className="text-2xl md:text-3xl font-semibold mb-4 text-korean">보정 전·후</h2>
          </Reveal>
          {/* §106 — grid 2단(50/50)으로 나누면 사진이 max-w-md로 줄어든
              뒤에도 칸 자체는 50% 폭을 그대로 차지해, 사진 오른쪽과 텍스트
              칸 사이에 큰 빈 공간이 남았다. flex로 바꿔 사진은 실제
              폭(max-w-md)만큼만 차지하고, 텍스트가 바로 그 옆에 붙도록
              했다. */}
          <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">
            <div className="w-full md:w-auto md:flex-shrink-0">
              <BeforeAfterSlider pairs={validBeforeAfter} />
            </div>
            <div className="flex-1 min-w-0">{sectionsAndTools}</div>
          </div>
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

      {/* §97/§103 — 보정 전/후가 없는 프로젝트에서만 프로젝트 개요/제작
          의도/기여도(+Tools)를 여기 세로 1단으로 보여준다. 보정 전/후가
          있는 프로젝트는 이미 위 2단 구성 오른쪽 칸에 렌더링했으므로
          여기서는 렌더링하지 않는다(중복 방지). */}
      {!hasBeforeAfter && (
        <Container className={`${hasAnyMedia ? "pt-16 md:pt-20" : "pt-24 md:pt-32"} pb-24 md:pb-32`}>
          <div className="max-w-3xl">{sectionsAndTools}</div>
        </Container>
      )}

      <Container className="pb-24 md:pb-32">
        <ProjectNav prev={prevProject} next={nextProject} />
      </Container>
    </main>
  );
}
