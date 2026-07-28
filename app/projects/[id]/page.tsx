import { notFound } from "next/navigation";
import { getContent } from "@/lib/data/repo";
import { Container } from "@/components/ui/Container";
import { MediaFrame } from "@/components/ui/MediaFrame";
import { GalleryGrid } from "@/components/ui/GalleryGrid";
import { ProjectCover } from "@/components/sections/ProjectCover";
import { ProjectNav } from "@/components/sections/ProjectNav";
import { BeforeAfterWithText } from "@/components/sections/BeforeAfterWithText";
import { RepresentativeMediaWithText } from "@/components/sections/RepresentativeMediaWithText";
import { FinalVideoBlock } from "@/components/sections/FinalVideoBlock";
import { ContentsCarousel } from "@/components/sections/ContentsCarousel";
import { isPlaceholder, optimizedImageSrc, stripPlaceholder } from "@/lib/utils";
import { Project, MediaRef } from "@/lib/types";
import { TOOL_ICON_MAP, sortByToolIconOrder } from "@/lib/tool-icons";

// §151 — 홈(app/page.tsx)과 동일한 이유로 force-dynamic을 제거했다.
// 렌더링 결과를 캐시해 방문자에게 즉시 응답하고, 관리자가 저장할 때만
// (lib/data/repo.ts의 saveContent → revalidatePath) 정확히 새로 그린다.
export const revalidate = 3600;

// §151 — generateStaticParams가 없으면 이 동적 라우트는 "처음 방문한
// 사람이 결과를 캐시에 채워 넣고, 그다음 방문자부터 빠른" 방식으로
// 동작한다(첫 방문자만 손해). 배포된 프로젝트 id 목록을 빌드 시점에
// 알려주면 홈처럼 모든 프로젝트 상세페이지를 빌드할 때 미리 다 만들어
// 둬서, 첫 방문자부터 예외 없이 즉시 응답을 받는다.
export async function generateStaticParams() {
  const content = await getContent();
  return content.projects.filter((p) => p.publicOk).map((p) => ({ id: p.id }));
}

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

  // §137 — Tools는 더 이상 자유 텍스트가 아니라 Skill 페이지에 등록된
  // 아이콘 중에서 고른 이름(project.tools)만 쓴다. 예전에 "보충 항목"으로
  // 등록됐던 tools 블록의 본문 텍스트는 더 이상 이름 목록으로 쓰지 않고,
  // TOOL_ICON_MAP에 실제 아이콘이 있는 이름만 걸러서 순서대로 보여준다
  // (다만 그 블록에 첨부된 이미지는 그대로 Tools 아이콘 아래에 보여준다).
  const toolsBlock = findBlock(project, "tools");
  const toolsList = sortByToolIconOrder((project.tools ?? []).filter((t) => TOOL_ICON_MAP[t]));

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
  // §131/§135 — 보정 전후 비교쌍이 하나도 없으면, 그 자리에 관리자가 따로
  // 지정한 대체 이미지/영상(beforeAfterFallbackMedia, 여러 장 가능)을
  // 쓰고, 그것도 없으면 대표 이미지(heroImage)로 자동 대체한다.
  // beforeAfterFallbackMedia가 배열로 바뀌기 전(§131) 저장된 데이터는
  // 단일 객체 형태일 수 있어, 배열이 아니면 배열로 감싸 하위 호환을
  // 맞춘다.
  const rawFallbackMedia = project.beforeAfterFallbackMedia as unknown;
  const fallbackMediaArr: MediaRef[] = Array.isArray(rawFallbackMedia)
    ? (rawFallbackMedia as MediaRef[])
    : rawFallbackMedia && typeof rawFallbackMedia === "object"
      ? [rawFallbackMedia as MediaRef]
      : [];
  const fallbackMediaList: MediaRef[] = !hasBeforeAfter
    ? (() => {
        const valid = fallbackMediaArr.filter((m) => m?.url);
        if (valid.length > 0) return valid;
        return project.heroImage?.url ? [project.heroImage] : [];
      })()
    : [];
  const hasFinalVideo = Boolean(project.finalVideo?.url && !isPlaceholder(project.finalVideo.url));
  const hasGallery = project.gallery?.length > 0;
  // §124 — "상세 이미지"와 별도인 영상 전용 Contents 영역.
  const hasContents = (project.contents?.length ?? 0) > 0;
  const hasAnyMedia = hasBeforeAfter || hasFinalVideo || hasGallery || hasContents;
  // §136 — "인물 프로필 상세페이지의 Tools 하단에 상세 이미지를 반영해달라
  // (모션은 동일하게, 가로로 자동으로 움직이도록)"는 요청. layout="half"
  // (좌우 50/50 분할)는 사진이 세로로 아주 길어질 수 있어서, 상세 이미지를
  // 기존처럼 사진+텍스트 줄 전체가 끝난 뒤(=사진 하단)에 두면 Tools와
  // 상세 이미지 사이에 사진 길이만큼 큰 빈 공간이 생긴다. layout이
  // "half"일 때는 상세 이미지(GalleryGrid, AutoScrollRow의 가로 자동
  // 스크롤 모션 그대로)를 텍스트 칸 안 Tools 바로 아래에 넣어 사진 길이와
  // 무관하게 항상 Tools 다음에 바로 이어지게 한다. 이때는 아래쪽 별도
  // Container에서 다시 렌더링하지 않는다(중복 방지).
  const showGalleryInline =
    !hasBeforeAfter && fallbackMediaList.length > 0 && project.beforeAfterFallbackLayout === "half" && hasGallery;

  // §103 — 보정 전/후 사진이 있는 프로젝트는 "왼쪽: 보정 전/후 사진(한 장씩
  // 이전/다음), 오른쪽: 프로젝트 개요/제작 의도/기여도/Tools" 2단 구성으로
  // 바뀌었다. 예전엔 이 텍스트 블록이 항상 페이지 맨 아래 별도 Container에
  // 있었는데, 보정 전/후가 있는 프로젝트는 그 블록을 통째로 위로 옮겨서
  // 오른쪽 칸에 채운다(중복 노출 방지 — 아래쪽엔 더 이상 렌더링하지 않는다).
  // 보정 전/후가 없는 프로젝트는 예전과 같은 세로 1단 구조를 그대로 쓴다.
  // §109 — 상세 페이지 대표 화면(ProjectCover)을 제외한 나머지 구간은
  // 스크롤에 따라 나타났다 사라지는 모션(Reveal)을 전부 뺐다.
  // §117 — 프로젝트 개요/제작 의도/기여도/Tools 사이 여백이 넓다는
  // 피드백으로 space-y-16(4rem) → space-y-10(2.5rem)으로 줄였다.
  //
  // §147 — "인물 프로필(half 레이아웃 + 인라인 상세 이미지) 상세페이지만
  // 우측 콘텐츠 세로 간격이 과도해서 좌측 메인 이미지 하단과 우측 하단
  // (Tools 다음 상세 이미지 끝)이 맞지 않는다"는 요청. showGalleryInline인
  // 경우에만(=이 프로젝트만) 섹션 간 간격을 25~35% 줄인 compact 값을 쓴다
  // — 다른 7개 프로젝트는 sectionsAndTools를 그대로 공유하며 이 값이
  // false이므로 예전과 동일하다. 상세 이미지 자체의 크기(GalleryGrid)는
  // 요청대로 건드리지 않고, 위쪽 간격이 줄어든 만큼 자연스럽게 위로
  // 올라오게만 한다.
  const compact = showGalleryInline;

  // space-y-10(2.5rem/40px) → space-y-7(1.75rem/28px): 섹션 사이 간격 30% 축소.
  const sectionSpaceClass = compact ? "space-y-7" : "space-y-10";
  // mb-4(16px) → mb-3(12px): 제목→본문 간격 25% 축소.
  const sectionHeadingClass = compact
    ? "text-2xl md:text-3xl font-semibold mb-3 text-korean"
    : "text-2xl md:text-3xl font-semibold mb-4 text-korean";
  // mb-6(24px) → mb-4(16px): 본문→다음 섹션 간격 33% 축소.
  const sectionBodyClass = compact
    ? "text-ink-muted leading-relaxed whitespace-pre-line text-korean mb-4"
    : "text-ink-muted leading-relaxed whitespace-pre-line text-korean mb-6";
  const sectionImagesClass = compact ? "grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4" : "grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6";
  // Tools는 보조 정보라 제목·아이콘 크기도 살짝 함께 줄인다.
  const toolsHeadingClass = compact
    ? "text-xl md:text-2xl font-semibold mb-3 text-korean"
    : "text-2xl md:text-3xl font-semibold mb-4 text-korean";
  const toolsRowClass = compact ? "flex flex-wrap gap-3" : "flex flex-wrap gap-4";
  const toolIconClass = compact
    ? "h-9 w-9 md:h-10 md:w-10 rounded-lg object-cover border border-line"
    : "h-11 w-11 md:h-12 md:w-12 rounded-lg object-cover border border-line";

  const sectionsAndTools = (
    <div className={sectionSpaceClass}>
      {sections.map((s) => (
        <div key={s.key}>
          <h2 className={sectionHeadingClass}>{s.title}</h2>
          <p className={sectionBodyClass}>{s.body}</p>
          {s.images.length > 0 && (
            <div className={sectionImagesClass}>
              {s.images.map((img, i) => (
                <MediaFrame key={i} media={img} className="aspect-[4/3] rounded-sm" fit="contain" />
              ))}
            </div>
          )}
        </div>
      ))}

      {/* §137 — "Tools는 자유 텍스트가 아니라 Skill 페이지에 등록된 아이콘을
          선택하는 방식으로, 상세 페이지엔 아이콘만(도구명 비표시) 노출하고
          hover 시 툴팁으로 이름을 보여달라"는 요청. 텍스트 알약(pill) 대신
          아이콘만 동일 크기·간격으로 나열하고, 커서를 올리면(순수 CSS
          group-hover라 이 서버 컴포넌트 안에서도 별도 자바스크립트 없이
          동작한다) 이름이 말풍선으로 뜬다. */}
      {toolsList.length > 0 && (
        <div>
          <h2 className={toolsHeadingClass}>Tools</h2>
          <div className={toolsRowClass}>
            {toolsList.map((t) => (
              <div key={t} className="group relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={TOOL_ICON_MAP[t]} alt={t} className={toolIconClass} loading="lazy" decoding="async" />
                <div
                  className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 whitespace-nowrap rounded-md bg-black/90 px-2.5 py-1.5 text-xs text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100"
                  role="tooltip"
                >
                  {t}
                </div>
              </div>
            ))}
          </div>
          {toolsBlock?.images && toolsBlock.images.length > 0 && (
            <div className={compact ? "grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4" : "grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6"}>
              {toolsBlock.images.map((img, i) => (
                <MediaFrame key={i} media={img} className="aspect-[4/3] rounded-sm" fit="contain" />
              ))}
            </div>
          )}
        </div>
      )}

      {/* §136 — layout="half"에서는 상세 이미지를 Tools 바로 아래(텍스트
          칸 안)에 넣는다. 모션은 다른 프로젝트와 동일한 GalleryGrid(가로로
          계속 흘러가는 자동 스크롤, AutoScrollRow)를 그대로 재사용한다.
          §147 — 크기는 그대로 두고(요청대로), 위 간격이 줄어든 만큼만
          자연스럽게 위로 올라온다. */}
      {showGalleryInline && (
        <div>
          <h2 className={sectionHeadingClass}>상세 이미지</h2>
          <GalleryGrid items={project.gallery} />
        </div>
      )}
    </div>
  );

  // §110 — "나머지 상세페이지도 proj-clothing 구조로 통일해달라"는 요청.
  // proj-clothing처럼 보정 전/후 사진이 있는 프로젝트는 그대로 "왼쪽 사진
  // + 오른쪽 텍스트" 2단을 쓰고, 보정 전/후 사진이 없는 프로젝트(대다수)는
  // 사용자 확인에 따라 "오른쪽에 있던 프로젝트 개요/제작 의도/기여도/
  // Tools를 왼쪽(=대표 화면 바로 아래, 첫 번째) 자리에 그대로 쓰고 상세
  // 이미지(영상/갤러리)는 그 아래에 배치"하는 구조로 바꿨다. 즉 두 경우
  // 모두 "대표 화면 → (사진+텍스트 또는 텍스트만) → 상세 이미지 → 다음
  // 프로젝트" 순서로 구조 자체는 항상 동일하다. 상세 이미지가 더 이상
  // "첫 번째" 블록으로 오는 경우가 없으므로(사진+텍스트 또는 텍스트만이
  // 항상 먼저 온다) 위쪽 여백은 항상 pt-10/12로 고정한다.
  const mediaTopPad = "pt-10 md:pt-12";
  // §136 — 상세 이미지가 Tools 아래로 이미 인라인 배치됐으면(showGalleryInline)
  // 더 이상 "사진+텍스트 블록 아래에 별도로 이어지는 미디어"가 아니므로
  // 여백 계산에서 제외한다.
  const hasMediaBelow = hasFinalVideo || (hasGallery && !showGalleryInline) || hasContents;

  return (
    <main className="bg-bg min-h-screen">
      <ProjectCover project={project} />

      {/* §103/§110 — 보정 전/후 사진(왼쪽, 한 장씩 이전/다음) + 프로젝트
          개요/제작 의도/기여도/Tools(오른쪽)를 나란히 배치한다. */}
      {hasBeforeAfter && (
        <Container className={`pt-24 md:pt-32 ${hasMediaBelow ? "pb-8 md:pb-10" : "pb-24 md:pb-32"}`}>
          {/* §104 — 제목을 flex 바깥(위)에 둬서, 아래 왼쪽(사진)과
              오른쪽(프로젝트 개요 등) 칸이 같은 지점(사진 윗변)에서
              나란히 시작하도록 했다. */}
          <h2 className="text-2xl md:text-3xl font-semibold mb-4 text-korean">보정 전·후</h2>
          {/* §106 — grid 2단(50/50)으로 나누면 사진이 max-w-md로 줄어든
              뒤에도 칸 자체는 50% 폭을 그대로 차지해, 사진 오른쪽과 텍스트
              칸 사이에 큰 빈 공간이 남았다. flex로 바꿔 사진은 실제
              폭만큼만 차지하고, 텍스트가 바로 그 옆에 붙도록 했다.
              §112 — 사진 높이를 텍스트 칸의 실제 렌더링 높이에 맞추기
              위해 BeforeAfterWithText(클라이언트 컴포넌트)가 텍스트 칸을
              ResizeObserver로 측정해 사진에 그대로 전달한다. */}
          <BeforeAfterWithText pairs={validBeforeAfter}>{sectionsAndTools}</BeforeAfterWithText>
        </Container>
      )}

      {/* §131/§135 — 보정 전후 비교쌍이 없는 프로젝트는 그 자리에 대체
          이미지/영상(여러 장이면 이전/다음, 없으면 대표 이미지)을 왼쪽에
          두고, 오른쪽엔 그대로 프로젝트 개요/제작 의도/기여도/Tools를
          배치한다. beforeAfterFallbackLayout이 "half"면 좌우 정확히
          50/50으로 나뉜다(§135, 예: 인물 프로필 프로젝트). */}
      {!hasBeforeAfter && fallbackMediaList.length > 0 && (
        <Container className={`pt-24 md:pt-32 ${hasMediaBelow ? "pb-8 md:pb-10" : "pb-24 md:pb-32"}`}>
          <RepresentativeMediaWithText
            media={fallbackMediaList}
            layout={project.beforeAfterFallbackLayout}
            retouchMarkers={project.retouchMarkers}
          >
            {sectionsAndTools}
          </RepresentativeMediaWithText>
        </Container>
      )}

      {/* §110 — 보정 전/후 사진도, 대체할 이미지/영상도 없는 프로젝트는
          오른쪽에 있던 텍스트(프로젝트 개요/제작 의도/기여도/Tools)를
          대표 화면 바로 아래 첫 번째 자리에 그대로 쓴다. */}
      {!hasBeforeAfter && fallbackMediaList.length === 0 && (
        <Container className={`pt-24 md:pt-32 ${hasMediaBelow ? "pb-8 md:pb-10" : "pb-24 md:pb-32"}`}>
          <div className="max-w-3xl">{sectionsAndTools}</div>
        </Container>
      )}

      {/* §97/§110 — 상세 이미지(영상) 리스트: 최종 영상(있으면 별도의 큰
          단일 블록) → 갤러리(있으면 그 아래에 이어서) 순서로, 위 텍스트/
          사진 블록 다음에 온다. */}
      {hasFinalVideo && project.finalVideo && (
        <Container className={`${mediaTopPad} ${hasGallery || hasContents ? "" : "pb-24 md:pb-32"}`}>
          <FinalVideoBlock
            video={project.finalVideo}
            posterFallback={project.heroImage ? optimizedImageSrc(project.heroImage.url, 1200) : undefined}
          />
        </Container>
      )}
      {/* §136 — layout="half"인 프로젝트는 상세 이미지를 위 sectionsAndTools
          안(Tools 바로 아래)에서 이미 보여줬으므로 여기서 중복으로 다시
          렌더링하지 않는다. */}
      {hasGallery && !showGalleryInline && (
        <Container className={`${mediaTopPad} ${hasContents ? "" : "pb-24 md:pb-32"}`}>
          <h2 className="text-2xl md:text-3xl font-semibold mb-4 text-korean">상세 이미지</h2>
          <GalleryGrid items={project.gallery} />
        </Container>
      )}

      {/* §124 — "상세 이미지"와 별도인 영상 전용 Contents 영역. 마우스로
          드래그해 한 편씩 넘겨본다(components/sections/ContentsCarousel.tsx). */}
      {hasContents && (
        <Container className={`${mediaTopPad} pb-24 md:pb-32`}>
          <h2 className="text-2xl md:text-3xl font-semibold mb-4 text-korean">Contents</h2>
          <ContentsCarousel items={project.contents} />
        </Container>
      )}

      <Container className="pb-24 md:pb-32">
        <ProjectNav prev={prevProject} next={nextProject} />
      </Container>
    </main>
  );
}
