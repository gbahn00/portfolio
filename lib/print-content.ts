import { Project, MediaRef, SiteContent } from "./types";
import { isPlaceholder, stripPlaceholder } from "./utils";
import { TOOL_ICON_MAP, sortByToolIconOrder } from "./tool-icons";

// ============================================================================
// §155 — "PDF 출력 구조 전면 개선" 요청. 이전(§153/§154) 버전은 웹 상세페이지
// 데이터를 그대로 전부(상세 이미지 전체, Contents 전체, Before/After
// 전체 쌍) 옮겨 담아서 프로젝트 하나가 여러 페이지로 늘어지고, 같은
// 사진이 여러 자리에 중복 출력되는 문제가 있었다. 이제는 "제출·검토용
// 문서"에 맞게 프로젝트당 딱 1페이지(정보가 유난히 많으면 자연스럽게
// 2페이지로 흘러넘칠 뿐, 강제로 나누지 않는다)로 압축한다:
//   - 대표 이미지 1장, 있으면 보정 전/후 1쌍만(그 이상은 출력하지 않음)
//   - 본문 3섹션은 각각 최대 2~3줄로 자른다(line-clamp)
//   - "자료 필요"류 미완성 문구는 본문뿐 아니라 훨씬 넓은 패턴으로 걸러낸다
//   - 이미지도 텍스트도 전혀 없는(=아직 채워지지 않은) 프로젝트는 기본값
//     그대로 PDF에서 제외한다(§155-12 "기본값은 PDF에서 제외")
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
}

export interface PrintProjectView {
  project: Project;
  sections: PrintSection[];
  toolsList: string[];
  primaryImage?: MediaRef;
  secondaryImage?: MediaRef;
  beforeAfterPair?: { id: string; before: MediaRef; after: MediaRef; caption?: string };
  videoThumb?: { poster: string; isVideo: boolean };
  hasUsableContent: boolean;
}

// §155-12 — "자료 필요" 외에도 "세부 역할 구분 필요/임시 문구/테스트
// 텍스트/의미 없는 입력값"처럼 아직 다듬지 않은 문구 패턴을 폭넓게 걸러낸다.
const JUNK_PATTERNS = [
  /자료\s*필요/,
  /세부\s*역할\s*구분/,
  /임시\s*문구/,
  /테스트\s*텍스트/,
  /^lorem ipsum/i,
  /^(테스트|test|temp|todo|미정|더미|dummy)$/i,
];

function isJunkText(text?: string | null): boolean {
  if (!text) return true;
  const trimmed = text.trim();
  if (trimmed.length === 0) return true;
  return JUNK_PATTERNS.some((re) => re.test(trimmed));
}

function cleanText(text?: string | null): string {
  const stripped = stripPlaceholder(text ?? "");
  return isJunkText(stripped) ? "" : stripped;
}

// 헤더의 필드/브랜드/역할처럼 섹션 본문이 아닌 짧은 메타 텍스트에도 같은
// 미완성 문구 필터를 적용하기 위해 공개한다(§155-12 누락 수정 — 이전엔
// 본문 섹션에만 필터가 적용돼 "[자료 필요]"류 문구가 상단 메타 줄에는
// 그대로 남아 있었다).
export function cleanMetaText(text?: string | null): string {
  return cleanText(text);
}

function findBlock(project: Project, key: PrintSectionKey | "tools") {
  return project.detailBlocks.find((b) => b.key === key && b.visible !== false);
}

function validMedia(m?: MediaRef | null): m is MediaRef {
  return Boolean(m && m.url && m.url.trim().length > 0);
}

export function getProjectPrintView(project: Project): PrintProjectView {
  const fieldFallback: Record<PrintSectionKey, string> = {
    overview: project.description,
    purpose: project.purpose,
    role: project.role,
  };

  // §155-14 "제목만 있는 빈 섹션 금지" — 본문이 비어 있으면(미완성 문구
  // 제거 후에도 빈 채면) 그 섹션 자체를 목록에서 뺀다.
  const sections: PrintSection[] = (["overview", "purpose", "role"] as PrintSectionKey[])
    .map((key) => {
      const block = findBlock(project, key);
      const blockBody = block?.body && !isPlaceholder(block.body) ? block.body : "";
      const body = cleanText(blockBody || fieldFallback[key]);
      return { key, title: PRINT_SECTION_TITLES[key], body };
    })
    .filter((s) => s.body.length > 0);

  const toolsList = sortByToolIconOrder((project.tools ?? []).filter((t) => TOOL_ICON_MAP[t]));

  // §155-8 — Before/After는 프로젝트당 "가장 효과가 잘 드러나는 1세트만".
  // 관리자가 아직 어느 게 대표작인지 고를 수 있는 화면이 없으므로, 순번
  // (order) 기준 첫 번째 쌍을 자동으로 쓴다.
  const validBeforeAfter = (project.beforeAfter ?? [])
    .filter((p) => validMedia(p.before) && validMedia(p.after))
    .sort((a, b) => a.order - b.order);
  const hasBeforeAfter = validBeforeAfter.length > 0;
  const beforeAfterPair = hasBeforeAfter ? validBeforeAfter[0] : undefined;

  // §155-7 — "프로젝트별 대표 이미지 1~2장만". 관리자가 직접 지정하는
  // 화면은 아직 없어(향후 과제로 남겨둠), 기존 데이터 중 가장 신뢰할 수
  // 있는 순서로 자동 선택한다: 대표 이미지(heroImage) → 대체 이미지
  // (beforeAfterFallbackMedia) → 상세 이미지(gallery) 순.
  const candidatePool = [
    project.heroImage,
    ...(project.beforeAfterFallbackMedia ?? []),
    ...(project.gallery ?? []),
  ].filter(validMedia);
  // 같은 사진이 대표/보조 이미지에 중복으로 뽑히지 않도록 URL 기준으로 중복 제거.
  const seenUrls = new Set<string>();
  const uniqueCandidates = candidatePool.filter((m) => {
    if (seenUrls.has(m.url)) return false;
    seenUrls.add(m.url);
    return true;
  });

  const primaryImage = uniqueCandidates[0];
  // Before/After가 있으면 그게 이미지 영역을 대표하므로 보조 이미지는
  // 따로 두지 않는다(같은 사진이 두 번 나오는 것을 막기 위함, §155-3).
  const secondaryImage = !hasBeforeAfter ? uniqueCandidates[1] : undefined;

  // §155-10 — 영상은 절대 그대로 삽입하지 않고 썸네일만. poster가 없으면
  // 대표 이미지를 대신 쓰고, 그것도 없으면 영상 자리 자체를 만들지 않는다
  // (검은 빈 화면 방지).
  const finalVideoUrl = project.finalVideo?.url && !isPlaceholder(project.finalVideo.url) ? project.finalVideo : undefined;
  const videoPosterSrc = finalVideoUrl?.poster || primaryImage?.url;
  const videoThumb = finalVideoUrl && videoPosterSrc ? { poster: videoPosterSrc, isVideo: true } : undefined;

  const hasUsableContent = Boolean(primaryImage || beforeAfterPair || videoThumb || sections.length > 0);

  return {
    project,
    sections,
    toolsList,
    primaryImage,
    secondaryImage,
    beforeAfterPair,
    videoThumb,
    hasUsableContent,
  };
}

export function getPublicProjectsSorted(content: SiteContent): Project[] {
  return content.projects.filter((p) => p.publicOk).sort((a, b) => a.order - b.order);
}
