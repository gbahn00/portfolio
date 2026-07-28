import { Project, MediaRef, SiteContent } from "./types";
import { isPlaceholder, stripPlaceholder } from "./utils";
import { TOOL_ICON_MAP, sortByToolIconOrder } from "./tool-icons";

// ============================================================================
// §153 — Admin PDF Export 기능.
//
// "PDF는 별도의 내용을 다시 작성하는 방식이 아니라, 현재 Admin 사이트에서
// 관리하는 포트폴리오 데이터를 그대로 사용하여 생성한다"는 요청에 맞춰,
// 프로젝트 상세페이지(app/projects/[id]/page.tsx)가 "무엇을 보여줄지"
// 판단하는 로직(고정 3섹션 본문 채우기, Tools 아이콘 목록, 보정 전후 유효성
// 판단 등)을 그대로 이 파일로 옮겨왔다 — 웹과 PDF가 서로 다른 판단 기준을
// 갖게 되는 걸 막기 위해서다. 다만 실제 화면 요소(캐러셀, 자동 스크롤,
// 드래그 슬라이더, 호버 상태)는 PDF에서 의미가 없으므로, 이 파일은 "무엇을
// 보여줄지"의 순수 데이터만 계산하고 화면에 어떻게 배치할지는
// components/print/*.tsx가 담당한다.
// ============================================================================

export type PrintSectionKey = "overview" | "purpose" | "role";

export const PRINT_SECTION_TITLES: Record<PrintSectionKey, string> = {
  overview: "프로젝트 개요",
  purpose: "제작 의도",
  role: "기여도",
};

export interface PrintSection {
  key: PrintSectionKey;
  title: string;
  body: string;
  images: MediaRef[];
}

export interface PrintProjectView {
  project: Project;
  sections: PrintSection[];
  toolsList: string[];
  heroImage?: MediaRef;
  beforeAfterPairs: { id: string; before: MediaRef; after: MediaRef; caption?: string }[];
  hasBeforeAfter: boolean;
  fallbackMediaList: MediaRef[];
  gallery: MediaRef[];
  contents: MediaRef[];
  finalVideo?: MediaRef;
}

function findBlock(project: Project, key: PrintSectionKey | "tools") {
  return project.detailBlocks.find((b) => b.key === key && b.visible !== false);
}

// app/projects/[id]/page.tsx의 동일 로직 그대로 — 관리자가 프로젝트
// 기본필드(설명/목적/역할)만 채워도, 예전에 블록으로 따로 채워둔 프로젝트도
// 항상 3개 섹션이 채워지도록 한다.
export function getProjectPrintView(project: Project): PrintProjectView {
  const fieldFallback: Record<PrintSectionKey, string> = {
    overview: project.description,
    purpose: project.purpose,
    role: project.role,
  };

  const sections: PrintSection[] = (["overview", "purpose", "role"] as PrintSectionKey[]).map((key) => {
    const block = findBlock(project, key);
    const blockBody = block?.body && !isPlaceholder(block.body) ? block.body : "";
    const body = blockBody || stripPlaceholder(fieldFallback[key]);
    return { key, title: PRINT_SECTION_TITLES[key], body, images: block?.images ?? [] };
  });

  const toolsList = sortByToolIconOrder((project.tools ?? []).filter((t) => TOOL_ICON_MAP[t]));

  const validBeforeAfter = (project.beforeAfter ?? [])
    .filter((p) => p.before?.url && p.after?.url)
    .sort((a, b) => a.order - b.order);
  const hasBeforeAfter = validBeforeAfter.length > 0;

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

  return {
    project,
    sections,
    toolsList,
    heroImage: project.heroImage,
    beforeAfterPairs: validBeforeAfter,
    hasBeforeAfter,
    fallbackMediaList,
    gallery: project.gallery ?? [],
    contents: project.contents ?? [],
    finalVideo: project.finalVideo?.url ? project.finalVideo : undefined,
  };
}

export function getPublicProjectsSorted(content: SiteContent): Project[] {
  return content.projects.filter((p) => p.publicOk).sort((a, b) => a.order - b.order);
}
