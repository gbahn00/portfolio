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
}

export interface SiteSettings {
  siteTitle: string;
  accentColor: "orange" | "blue";
  reduceMotionRespect: boolean;
  sectionVisibility: Record<string, boolean>; // 화면 영역별 노출 여부
  sectionOrder: string[]; // 화면 영역 표시 순서
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

export interface BeforeAfterPair {
  id: string;
  before: MediaRef;
  after: MediaRef;
  caption?: string;
  order: number;
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
  tools: string[];
  description: string;
  heroImage?: MediaRef;
  previewVideo?: MediaRef;
  finalVideo?: MediaRef;
  gallery: MediaRef[];
  beforeAfter: BeforeAfterPair[];
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
