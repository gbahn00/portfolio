import { createClient } from "@supabase/supabase-js";
import { SiteContent } from "../types";

// ============================================================================
// Supabase 저장소 (DATA_MODE=supabase)
// supabase/schema.sql 을 실행한 프로젝트를 기준으로 작성되었습니다.
// 계정이 준비되지 않아 실제 데이터베이스로 검증하지 못한 상태이므로,
// 연결 직후 관리자 화면에서 각 섹션을 한 번씩 저장해보며 정상 동작을 확인하세요.
// ============================================================================

export function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase 환경변수가 설정되지 않았습니다. .env 의 NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 를 확인하세요."
    );
  }
  return createClient(url, key, {
    // supabase-js는 내부적으로 fetch()를 사용하는데, Next.js는 프로덕션
    // 빌드에서 fetch 요청을 기본적으로 캐싱한다. 그대로 두면 관리자에서
    // 저장(삭제 포함)해도 다음 조회가 캐시된 이전 데이터를 계속 돌려줘서
    // "저장은 됐는데 반영이 안 되는" 것처럼 보인다. 항상 최신 데이터를
    // 가져오도록 캐시를 명시적으로 끈다.
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
}

function camel<T = any>(row: Record<string, any> | null): T {
  if (!row) return row as T;
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(row)) {
    const camelKey = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    out[camelKey] = v;
  }
  return out as T;
}

function snake(obj: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    const snakeKey = k.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
    out[snakeKey] = v;
  }
  return out;
}

export async function getContentSupabase(): Promise<SiteContent> {
  const sb = client();

  const [
    settings,
    profile,
    hero,
    philosophy,
    timeline,
    projects,
    competencies,
    aiSection,
    aiTools,
    contributionSection,
    contributionItems,
    achievements,
    collaborations,
    fitness,
    futurePlans,
    closing,
    faqItems,
  ] = await Promise.all([
    sb.from("site_settings").select("*").eq("id", 1).single(),
    sb.from("profile").select("*").eq("id", 1).single(),
    sb.from("hero_section").select("*").eq("id", 1).single(),
    sb.from("philosophy_section").select("*").eq("id", 1).single(),
    sb.from("timeline_entries").select("*").order("order"),
    sb.from("projects").select("*").order("order"),
    sb.from("competencies").select("*").order("order"),
    sb.from("ai_section").select("*").eq("id", 1).single(),
    sb.from("ai_tools").select("*").order("order"),
    sb.from("contribution_section").select("*").eq("id", 1).single(),
    sb.from("contribution_items").select("*").order("order"),
    sb.from("achievements").select("*").order("order"),
    sb.from("collaborations").select("*").order("order"),
    sb.from("fitness_section").select("*").eq("id", 1).single(),
    sb.from("future_plans").select("*").order("order"),
    sb.from("closing_section").select("*").eq("id", 1).single(),
    sb.from("faq_items").select("*").order("order"),
  ]);

  return {
    settings: camel(settings.data),
    profile: camel(profile.data),
    hero: camel(hero.data),
    philosophy: camel(philosophy.data),
    timeline: (timeline.data ?? []).map(camel),
    projects: (projects.data ?? []).map(camel),
    competencies: (competencies.data ?? []).map(camel),
    ai: { ...camel(aiSection.data), tools: (aiTools.data ?? []).map(camel) } as any,
    contributions: { ...camel(contributionSection.data), items: (contributionItems.data ?? []).map(camel) } as any,
    achievements: (achievements.data ?? []).map(camel),
    collaborations: (collaborations.data ?? []).map(camel),
    fitness: camel(fitness.data),
    futurePlans: (futurePlans.data ?? []).map(camel),
    closing: camel(closing.data),
    faq: (faqItems.data ?? []).map(camel),
  };
}

/**
 * SiteContent 전체를 Supabase 테이블에 반영합니다.
 * 싱글턴 테이블은 upsert(id=1), 목록 테이블은 전체 upsert 방식을 사용합니다.
 * 대량 데이터에서는 비효율적일 수 있어, 실제 운영 전환 시에는
 * 섹션별로 세분화된 upsert 함수로 교체하는 것을 권장합니다.
 */
export async function saveContentSupabase(content: SiteContent): Promise<void> {
  const sb = client();

  await Promise.all([
    sb.from("site_settings").upsert({ id: 1, ...snake(content.settings) }),
    sb.from("profile").upsert({ id: 1, ...snake(content.profile) }),
    sb.from("hero_section").upsert({ id: 1, ...snake(content.hero) }),
    sb.from("philosophy_section").upsert({ id: 1, ...snake(content.philosophy) }),
    sb.from("ai_section").upsert({ id: 1, title: content.ai.title, process_steps: content.ai.processSteps, status: content.ai.status }),
    sb.from("contribution_section").upsert({ id: 1, title: content.contributions.title, status: content.contributions.status }),
    sb.from("fitness_section").upsert({ id: 1, ...snake(content.fitness) }),
    sb.from("closing_section").upsert({ id: 1, ...snake(content.closing) }),
  ]);

  if (content.timeline.length) await sb.from("timeline_entries").upsert(content.timeline.map(snake));
  if (content.projects.length) await sb.from("projects").upsert(content.projects.map(snake));
  if (content.competencies.length) await sb.from("competencies").upsert(content.competencies.map(snake));
  if (content.ai.tools?.length) await sb.from("ai_tools").upsert(content.ai.tools.map(snake));
  if (content.contributions.items?.length) await sb.from("contribution_items").upsert(content.contributions.items.map(snake));
  if (content.achievements.length) await sb.from("achievements").upsert(content.achievements.map(snake));
  if (content.collaborations.length) await sb.from("collaborations").upsert(content.collaborations.map(snake));
  if (content.futurePlans.length) await sb.from("future_plans").upsert(content.futurePlans.map(snake));
  if (content.faq?.length) await sb.from("faq_items").upsert(content.faq.map(snake));
}

const MEDIA_BUCKET = "portfolio-media";

/**
 * 이미지/영상 업로드(Supabase Storage 버전).
 * app/api/admin/upload/route.ts가 로컬 파일시스템 대신 이 함수를 쓰면,
 * Vercel의 읽기 전용 파일시스템과 무관하게 실제로 파일이 남는다.
 * supabase/schema.sql의 portfolio-media 버킷(공개 읽기)에 업로드하고
 * 공개 URL을 돌려준다.
 */
export async function uploadMediaSupabase(
  filename: string,
  bytes: Buffer,
  contentType: string
): Promise<string> {
  const sb = client();
  const path = `uploads/${filename}`;
  const { error } = await sb.storage.from(MEDIA_BUCKET).upload(path, bytes, {
    contentType,
    upsert: false,
  });
  if (error) throw error;
  const { data } = sb.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
