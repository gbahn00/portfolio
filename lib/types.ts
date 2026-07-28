// ============================================================================
// 콘텐츠 타입 정의
// 이 파일의 타입들은 supabase/schema.sql 의 테이블 구조와 1:1로 대응합니다.
// 관리자 화면과 공개 화면은 모두 이 타입을 기준으로 동작합니다.
// ============================================================================

export type PublishStatus = "draft" | "review" | "published" | "hidden";

export interface MediaRef {
  /** local 모드: /uploads/xxx.jpg 형태 경로, supabase 모드: Storage 공개 URL */
  url: string;
  /** youtube | vimeo | file | external */
  kind: "image" | "video-file" | "youtube" | "vimeo" | "external-video";
  alt?: string;
  caption?: string;
  poster?: string; // 영상 대표 이미지
  // §138 — "좌측 이미지/우측 콘텐츠 높이를 항상 맞추고 object-fit: cover를
  // 적용하되, 얼굴 등 주요 피사체가 잘리지 않도록 object-position을 조절할
  // 수 있게 해달라"는 요청으로 추가. 0~100 퍼센트(CSS object-position과
  // 동일한 값 범위), 비워두면 50(중앙)으로 취급한다. 현재는
  // RepresentativeMediaColumn(보정 전후 없을 때 대체 이미지)에서만
  // 관리자가 조절할 수 있게 연결돼 있다.
  focusX?: number;
  focusY?: number;
}

// §133 — "전체 페이지 글자들의 폰트·자간·행간·줄바꿈을 설정 가능하게
// 해달라"는 요청으로 추가. 제목용/본문용을 따로 둔다. 값을 비워두면
// (undefined) globals.css에 원래 있던 클래스별 기본값이 그대로 유지되고,
// 값을 넣으면 그 값이 해당 역할(제목 전체 또는 본문 전체)에 일괄
// 적용된다. FontKey는 lib/fonts.ts의 FONTS에 등록된 키와 반드시 같아야
// 한다(관리자 화면에서 그 목록 중에서만 고르게 되어 있어 항상 맞다).
export type TypographyFontKey = "pretendard" | "suit" | "wantedSans" | "paperlogy";
export type WordBreakMode = "keep-all" | "normal" | "break-all";

export interface TypographySettings {
  titleFont?: TypographyFontKey;
  titleLetterSpacing?: number; // em 단위, 예: -0.05
  titleLineHeight?: number; // 배수, 예: 1.1
  titleWordBreak?: WordBreakMode;
  bodyFont?: TypographyFontKey;
  bodyLetterSpacing?: number;
  bodyLineHeight?: number;
  bodyWordBreak?: WordBreakMode;
}

export interface SiteSettings {
  siteTitle: string;
  accentColor: "orange" | "blue";
  reduceMotionRespect: boolean;
  sectionVisibility: Record<string, boolean>; // 화면 영역별 노출 여부
  sectionOrder: string[]; // 화면 영역 표시 순서
  typography?: TypographySettings;
  updatedAt: string;
}

export interface Profile {
  name: string;
  affiliation: string;
  rank: string;
  role: string;
  joinedAt: string; // ISO date
  introShort: string;
  introLong: string;
  profilePhoto?: MediaRef;
  onSitePhotos: MediaRef[];
  representativePhrase: string;
  keyFacts: { label: string; value: string; order: number }[];
  // "핵심 수치" 탭 하단의 "생성형 활용 도구" — 아이콘은 알려진 툴 이름으로
  // 코드에서 매칭해서 보여주고(components/sections/ProfileSection.tsx의
  // TOOL_ICON_MAP), 여기서는 이름/숙련도(%)/순서만 관리한다.
  toolSkills: { id: string; name: string; percentage: number; order: number }[];
  updatedAt: string;
}

export interface HeroSection {
  headline: string; // 큰 글자 핵심 문구
  subline: string; // 보조 문구
  name: string;
  role: string;
  department: string;
  joinYear: string;
  badge: string; // "2026년 특별진급 포트폴리오"
  backgroundVideo?: MediaRef;
  backgroundImage?: MediaRef; // 영상 재생 불가 시 대체 이미지
  highlightClips: MediaRef[]; // 대표 작업 연결 영상 모음
  visible: boolean;
  status: PublishStatus;
}

export interface PhilosophySection {
  title: string;
  paragraphs: { id: string; text: string; order: number }[];
  keywords: { id: string; text: string; order: number }[];
  visible: boolean;
  status: PublishStatus;
}

// §82 — "업무 성장과정" 섹션의 대표 제목("입사 이후, 역할은 이렇게
// 확장되었습니다.")이 예전에는 컴포넌트에 하드코딩돼 있어 관리자 화면
// 어디에서도 수정할 수 없었다. Hero/Philosophy/Closing처럼 이 섹션도
// 자체 싱글턴 레코드를 두어 제목을 편집 가능하게 만들었다.
export interface GrowthSection {
  title: string;
  status: PublishStatus;
}

export interface TimelineEntry {
  id: string;
  year: string;
  title: string;
  description: string;
  experiences: { id: string; text: string; order: number }[];
  message: string; // 전달 메시지
  heroImage?: MediaRef;
  heroVideo?: MediaRef;
  order: number;
  visible: boolean;
  status: PublishStatus;
}

export type ProjectField =
  | "의류"
  | "카페 및 음식"
  | "인테리어"
  | "인물 프로필"
  | "치과 및 병원 광고"
  | "유튜브"
  | "생성형 인공지능 콘텐츠";

// §135 — "대체 이미지/영상을 여러 개 첨부하고, 보정 전후와 같은 방식으로
// 화살표를 눌러 다음/이전을 볼 수 있게 해달라"는 요청으로
// beforeAfterFallbackMedia가 단일 MediaRef에서 배열로 바뀐다(아래
// Project.beforeAfterFallbackMedia 참고). 기존에 단일 객체로 저장된 데이터도
// 있을 수 있어, 읽는 쪽(app/projects/[id]/page.tsx)에서 배열이 아니면
// 배열로 감싸는 방식으로 하위 호환을 맞춘다.
//
// §135 — "인물 프로필 프로젝트의 대체 이미지에는 내가 보정한 위치를
// 표시해서, 그 위치에 커서를 올리면 무엇을 수정했는지 보이게 해달라"는
// 요청으로 추가한 좌표 기반 주석(annotation) 타입. x/y는 이미지 표시 영역
// 기준 퍼센트(0~100)로 저장해서, 실제 화면에 보이는 사진 크기가 얼마든
// (반응형으로 커지거나 작아져도) 항상 같은 상대 위치를 가리킨다.
// mediaIndex는 beforeAfterFallbackMedia 배열에서 이 마커가 속한 사진의
// 인덱스(0부터) — 여러 장 중 특정 사진에만 마커를 표시할 수 있다.
export interface RetouchMarker {
  id: string;
  mediaIndex: number;
  x: number; // 0~100 (%)
  y: number; // 0~100 (%)
  label: string;
  order: number;
}

export interface BeforeAfterPair {
  id: string;
  before: MediaRef;
  after: MediaRef;
  caption?: string;
  order: number;
  // §89에서 "1단 디테일컷/2단 모델컷"을 구분하려고 만들었던 category
  // 필드는 §103에서 구분 자체를 없애면서(하나의 순번 리스트로 통합) 더
  // 이상 화면 렌더링에 쓰이지 않게 됐다가, §108에서 아예 타입에서
  // 제거했었다.
  //
  // §129 — "디테일컷 | 모델컷 | 프로젝트 개요~Tools" 3단 구조로 다시
  // 나눠달라는 요청으로 category 필드를 되살렸다. 이번엔 구분 이름을
  // "detail"(디테일컷)/"model"(모델컷)로 명확히 하고, 사진 넘기기
  // (이전/다음)도 두 그룹이 서로 독립적으로 동작하게 만든다. 값이
  // 없으면(undefined, 기존에 저장된 데이터 대부분이 이 상태) 기존처럼
  // 구분 없는 단일 슬라이더로 보여준다 — 이 프로젝트를 제외한 다른
  // 프로젝트들은 화면이 그대로 유지된다.
  category?: "detail" | "model";
}

export interface ProjectDetailBlock {
  id: string;
  key:
    | "overview"
    | "before"
    | "purpose"
    | "role"
    | "process"
    | "decisions"
    | "tools"
    | "result"
    | "impact"
    | "future-use";
  title: string;
  body: string;
  order: number;
  visible: boolean;
  images: MediaRef[];
  videos: MediaRef[];
  compareImages: BeforeAfterPair[];
  links: { id: string; label: string; url: string }[];
  metrics: { id: string; label: string; value: string }[];
}

export interface Project {
  id: string;
  number: string;
  title: string;
  brand: string;
  brandHidden: boolean; // 브랜드명 비공개 처리
  year: string;
  field: ProjectField;
  purpose: string;
  role: string; // 담당 역할 (촬영/보조촬영/보정/기획/편집 등 명확히 구분)
  // §157 — "상세페이지 기여도 제목에 퍼센트를 작성할 수 있도록" 요청으로
  // 추가. 예: 70을 입력하면 상세 페이지 "기여도" 제목 옆에 "70%"가
  // 표시된다. 비워두면(undefined) 예전처럼 퍼센트 없이 제목만 나온다.
  contributionPercentage?: number;
  tools: string[];
  description: string;
  heroImage?: MediaRef;
  // 대표 프로젝트 "목록"에서 커서를 올렸을 때 보이는 미리보기 전용 미디어.
  // 비워두면 상세 페이지 대표 이미지(heroImage)를 그대로 재사용한다 —
  // 두 화면에 서로 다른 사진/영상을 쓰고 싶을 때만 따로 지정하면 된다.
  listPreviewMedia?: MediaRef;
  previewVideo?: MediaRef;
  finalVideo?: MediaRef;
  gallery: MediaRef[];
  // §124 — "상세 이미지(갤러리)"와는 별도로, 영상만 모아서 마우스 드래그로
  // 한 편씩 넘겨보는 전용 "Contents" 영역을 위한 필드. 비워두면 해당
  // 영역 자체가 보이지 않는다.
  contents: MediaRef[];
  beforeAfter: BeforeAfterPair[];
  // §131/§135 — 보정 전후 비교쌍(beforeAfter)이 하나도 없는 프로젝트는
  // 상세 페이지의 그 자리가 텍스트만으로 채워지는데, 대신 넣고 싶은 대표
  // 이미지·영상을 여기에 직접 지정할 수 있다(이미지/영상 모두 가능,
  // 여러 장 첨부 가능 — 보정 전후 슬라이더와 같은 방식으로 이전/다음
  // 버튼으로 넘겨본다). 비워두면 heroImage(대표 이미지)로 자동 대체된다.
  // 보정 전후 비교쌍이 하나라도 있으면 이 필드는 무시된다(그쪽이 우선).
  beforeAfterFallbackMedia?: MediaRef[];
  // §135 — "인물 프로필" 같은 프로젝트에서 사진을 화면 좌측 절반부터
  // 중앙까지 꽉 채우고, 우측 절반(중앙~우측)에 프로젝트 개요/제작 의도/
  // 기여도를 배치해달라는 요청. 기본값(auto, 미지정 포함)은 기존처럼
  // 사진 원본 비율을 유지하며 텍스트 칸 높이에 맞추는 방식이고, "half"로
  // 지정하면 사진·텍스트가 정확히 50/50으로 나뉘고 사진은 그 영역을
  // 꽉 채운다(object-cover, 필요시 잘림).
  beforeAfterFallbackLayout?: "auto" | "half";
  // §135 — 위 beforeAfterFallbackMedia 중 특정 사진에 "보정한 위치"
  // 마커를 등록해두면, 상세 페이지에서 그 위치에 커서를 올렸을 때 설명이
  // 나타난다(RetouchMarker 정의 참고).
  retouchMarkers?: RetouchMarker[];
  metrics: { id: string; label: string; value: string; unit?: string }[];
  detailBlocks: ProjectDetailBlock[];
  isFeatured: boolean; // 대표 작업 여부
  isDetailFeatured: boolean; // 4대 대표 상세 사례 여부
  publicOk: boolean; // 공개 가능 여부(클라이언트 승인)
  status: PublishStatus;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CompetencyCase {
  id: string;
  projectId?: string;
  text: string;
  order: number;
}

export interface Competency {
  id: string;
  title: string;
  description: string;
  cases: CompetencyCase[];
  media?: MediaRef;
  order: number;
  visible: boolean;
  status: PublishStatus;
}

export interface AiTool {
  id: string;
  name: string; // 고유명사 원문 유지 (Flow AI, Higgsfield AI 등)
  logo?: MediaRef;
  purpose: string;
  linkedProjectIds: string[];
  results: MediaRef[];
  promptSamples: { id: string; text: string }[];
  failureNotes: { id: string; text: string }[];
  order: number;
  visible: boolean;
}

export interface AiProcessStep {
  id: string;
  order: number;
  title: string;
}

export interface AiSection {
  title: string;
  processSteps: AiProcessStep[];
  tools: AiTool[];
  status: PublishStatus;
}

export interface ContributionItem {
  id: string;
  title: string;
  description: string;
  beforeImage?: MediaRef;
  afterImage?: MediaRef;
  screenshot?: MediaRef; // 민감정보 가림 처리된 캡처
  metrics: { id: string; label: string; value: string }[];
  order: number;
  visible: boolean;
}

export interface ContributionSection {
  title: string;
  items: ContributionItem[];
  status: PublishStatus;
}

export interface Achievement {
  id: string;
  name: string;
  value: string;
  unit: string;
  description: string;
  asOfDate: string;
  source: string;
  countUpEnabled: boolean;
  order: number;
  visible: boolean;
}

export interface Collaboration {
  id: string;
  partner: string; // 협업 대상
  process: string; // 협업 과정
  relatedProjectId?: string;
  review?: string;
  authorName?: string;
  authorNameVisible: boolean;
  authorTitle?: string;
  authorTitleVisible: boolean;
  order: number;
  visible: boolean;
}

export interface FitnessSection {
  title: string;
  points: { id: string; title: string; body: string; order: number }[];
  relatedProjectIds: string[];
  status: PublishStatus;
}

export interface FuturePlan {
  id: string;
  title: string;
  summary: string;
  details: { id: string; text: string; order: number }[];
  expectedEffect: string;
  progress: "예정" | "준비중" | "진행중" | "완료";
  order: number;
  visible: boolean;
}

export interface ClosingSection {
  message: string;
  subline?: string;
  name: string;
  role: string;
  department: string;
  badge: string;
  backgroundImage?: MediaRef;
  backgroundVideo?: MediaRef;
  externalLinks: { id: string; label: string; url: string }[];
  status: PublishStatus;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  order: number;
  visible: boolean;
}

export interface RevisionEntry {
  id: string;
  entity: string; // 예: "project:proj_01"
  field: string;
  before: unknown;
  after: unknown;
  editor: string;
  editedAt: string;
}

export interface TrashEntry {
  id: string;
  entity: string; // "project" | "timeline" | ...
  originalId: string;
  data: unknown;
  deletedAt: string;
  deletedBy: string;
}

export interface SiteContent {
  settings: SiteSettings;
  profile: Profile;
  hero: HeroSection;
  philosophy: PhilosophySection;
  growth: GrowthSection;
  timeline: TimelineEntry[];
  projects: Project[];
  competencies: Competency[];
  ai: AiSection;
  contributions: ContributionSection;
  achievements: Achievement[];
  collaborations: Collaboration[];
  fitness: FitnessSection;
  futurePlans: FuturePlan[];
  closing: ClosingSection;
  faq: FaqItem[];
}
