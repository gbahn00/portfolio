import { notFound } from "next/navigation";
import { getContent } from "@/lib/data/repo";
import { Container } from "@/components/ui/Container";
import { MediaFrame } from "@/components/ui/MediaFrame";
import { GalleryGrid } from "@/components/ui/GalleryGrid";
import { Reveal } from "@/components/motion/Reveal";
import { ProjectCover } from "@/components/sections/ProjectCover";
import { ProjectNav } from "@/components/sections/ProjectNav";
import { BeforeAfterSlider } from "@/components/sections/BeforeAfterSlider";
import { isPlaceholder, mediaSrc, stripPlaceholder } from "@/lib/utils";
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

  // §87 — 대표 프로젝트 목록의 "01번"(순서상 첫 프로젝트)만 상세페이지의
  // 이미지/보정 전후 슬라이드를 2단(한 슬라이드에 2개씩)으로 보여주고,
  // 나머지 프로젝트는 전부 1단(한 슬라이드에 1개)으로 보여달라는 요청.
  const gallerySlideColumns: 1 | 2 = currentIndex === 0 ? 2 : 1;

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

  // §66 — 보정 포인트 기능은 제거했다(사용자가 별도 보정 작업을 하지
  // 않아도 되도록). 대표 화면 바로 아래 자리의 우선순위는 이제:
  //   1) 보정 전/후 사진 (원본이 있는 프로젝트 — 의류)
  //   2) 최종 영상 (영상 중심 프로젝트. 관리자 화면에 "최종 영상" 업로드
  //      항목은 예전부터 있었지만 공개 화면 어디에도 표시되지 않던
  //      필드였다.)
  //   3) 작업 이미지 갤러리 (그 외 사진 기반 프로젝트)
  //   4) 없으면 이 자리 자체를 생략
  // 상단에서 이미 보여준 항목(갤러리)은 하단에서 중복으로 다시 보여주지
  // 않는다.
  // 보정 전(before) 사진 없이 보정 후(after) 사진만 등록된 짝은 반쪽짜리라
  // 슬라이더로 보여줄 수 없으므로 개수에서 제외한다 — 이런 경우엔 관리자가
  // "보정 전·후 비교" 대신 "상세 이미지(갤러리)"를 써야 한다.
  const validBeforeAfter = (project.beforeAfter ?? []).filter((p) => p.before?.url && p.after?.url);
  const hasBeforeAfter = validBeforeAfter.length > 0;
  const hasFinalVideo = Boolean(project.finalVideo?.url && !isPlaceholder(project.finalVideo.url));
  const hasGallery = project.gallery?.length > 0;

  const topSlot: "beforeAfter" | "video" | "gallery" | "none" = hasBeforeAfter
    ? "beforeAfter"
    : hasFinalVideo
    ? "video"
    : hasGallery
    ? "gallery"
    : "none";
  const hasTopSlot = topSlot !== "none";

  return (
    <main className="bg-bg min-h-screen">
      <ProjectCover project={project} />

      {/* §58-60 — 대표 화면 바로 아래: 위 우선순위(보정 전/후 → 최종 영상 →
          갤러리 → 없음)에 따라 정확히 하나만 렌더링한다. */}
      {topSlot === "beforeAfter" && (
        <Container className="pt-24 md:pt-32">
          <div className="max-w-3xl">
            <BeforeAfterSlider pairs={validBeforeAfter} columns={gallerySlideColumns} />
          </div>
        </Container>
      )}
      {topSlot === "video" && project.finalVideo && (
        <Container className="pt-24 md:pt-32">
          <div className="max-w-3xl">
            <Reveal>
              <h2 className="text-2xl md:text-3xl font-semibold mb-4 text-korean">결과물 영상</h2>
              {/* §68 — 여기는 영상이 하나뿐이라(격자로 나란히 놓고 비교할
                  필요가 없음) 고정 박스로 강제로 자르거나 레터박스를 두지
                  않고, 영상 자체의 원본 비율대로 크게 보여준다(가로 영상은
                  넓게, 세로 영상은 높게). 세로 영상이 화면을 너무 많이
                  차지하지 않도록 최대 높이만 넉넉하게 잡아뒀다. */}
              <video
                src={mediaSrc(project.finalVideo.url)}
                poster={project.finalVideo.poster || (project.heroImage ? mediaSrc(project.heroImage.url) : undefined)}
                controls
                playsInline
                className="w-full h-auto max-h-[75vh] mx-auto block rounded-sm bg-bg-soft"
              />
            </Reveal>
          </div>
        </Container>
      )}
      {/* §87 — 예전엔(§70) 자유 스크롤이라 max-w-3xl 안에 넣으면 슬라이드가
          화면 절반쯤에서 잘려 보여 폭 제한을 없앴었다. SlideCarousel로
          바뀐 지금은 슬라이드가 컨테이너 폭에 맞춰 채워지므로 본문과 같은
          읽기 폭(max-w-3xl)으로 다시 맞췄다. */}
      {topSlot === "gallery" && (
        <Container className="pt-24 md:pt-32">
          <Reveal>
            <h2 className="text-2xl md:text-3xl font-semibold mb-4 text-korean">작업 이미지</h2>
            <div className="max-w-3xl">
              <GalleryGrid items={project.gallery} columns={gallerySlideColumns} />
            </div>
          </Reveal>
        </Container>
      )}

      <Container className={`${hasTopSlot ? "pt-16 md:pt-20" : "pt-24 md:pt-32"} pb-24 md:pb-32`}>
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

        {/* §87 — 예전엔(§70) 자유 스크롤 방식이라 슬라이드가 화면 절반에서
            잘려 보이지 않도록 이 블록을 max-w-3xl 밖으로 뺐었다. 이제는
            SlideCarousel이 컨테이너 폭에 맞춰 슬라이드를 채우는 방식이라
            그 문제가 없어졌고, 다른 본문 섹션과 같은 읽기 폭(max-w-3xl)에
            맞추는 편이 더 자연스러워 다시 안쪽 폭으로 맞췄다. */}
        {hasGallery && topSlot !== "gallery" && (
          <Reveal className="mt-16 max-w-3xl">
            <h2 className="text-xl md:text-2xl font-semibold mb-4">상세 이미지</h2>
            <GalleryGrid items={project.gallery} columns={gallerySlideColumns} />
          </Reveal>
        )}
      </Container>

      <Container className="pb-24 md:pb-32">
        <ProjectNav prev={prevProject} next={nextProject} />
      </Container>
    </main>
  );
}
