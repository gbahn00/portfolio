import { createClient } from "@supabase/supabase-js";
import { SiteContent } from "../types";
import { MEDIA_BUCKET } from "../media-constants";

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
    // §151 — "첫 방문자에게 이미지/영상이 늦게 나온다"는 성능 문제를 조사한
    // 결과, 진짜 원인은 이미지/영상 자체보다 이 부분이었다: 이전에는 모든
    // 조회를 cache: "no-store"로 강제해서 next.config의 캐싱이나 페이지
    // 캐싱과 무관하게 방문할 때마다 이 함수 하나에서만 18개의 Supabase
    // 요청을 매번 새로 다시 보냈다(app/page.tsx·app/projects/[id]/page.tsx의
    // force-dynamic과 맞물려, 방문자가 이미지 태그를 담은 HTML을 받기도
    // 전에 이 왕복이 먼저 끝나야 했다). "저장은 됐는데 반영이 안 되는"
    // 원래 문제를 캐시를 아예 끄는 대신, 태그 기반으로 정확히 저장 시점에
    // 만 무효화(lib/data/repo.ts의 saveContent → revalidateTag)하는 방식으로
    // 바꿔, 방문자는 캐시된 빠른 응답을 받고 관리자가 저장하는 즉시 그
    // 캐시만 정확히 비워지도록 한다.
    global: {
      fetch: (input, init) => fetch(input, { ...init, next: { revalidate: 3600, tags: ["site-content"] } }),
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
    growth,
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
    sb.from("growth_section").select("*").eq("id", 1).single(),
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
    growth: growth.data
      ? camel(growth.data)
      : ({ title: "입사 이후, 역할은 이렇게 확장되었습니다.", status: "published" } as any),
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
    sb.from("growth_section").upsert({ id: 1, ...snake(content.growth) }),
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

/**
 * 이미지/영상 업로드(Supabase Storage 버전).
 * app/api/admin/upload/route.ts가 로컬 파일시스템 대신 이 함수를 쓰면,
 * Vercel의 읽기 전용 파일시스템과 무관하게 실제로 파일이 남는다.
 * supabase/schema.sql의 portfolio-media 버킷(공개 읽기)에 업로드하고
 * 공개 URL을 돌려준다.
 *
 * §77 — 이 함수는 "서버가 파일 전체를 대신 받아서 올리는" 예전 경로
 * (브라우저 → Vercel 서버리스 함수 → Supabase Storage)에서만 쓰인다.
 * DATA_MODE=supabase일 때 새 업로드는 아래 createSignedUploadUrlSupabase로
 * 브라우저가 Storage에 직접 올리므로 이 함수를 거치지 않는다 — 로컬
 * 모드 호환을 위해 계속 남겨둔다(현재는 실제로 호출되지 않음).
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

/**
 * §77 — 브라우저가 Supabase Storage에 "직접" 업로드할 수 있도록 서명된
 * 업로드 URL/토큰을 발급한다. service role 키는 이 서버 함수 안에서만
 * 쓰이고 브라우저에는 노출되지 않는다(발급된 토큰은 이 경로 하나에만,
 * 짧은 시간 동안만 유효하다). 브라우저는 이 토큰으로
 * `storage.from(bucket).uploadToSignedUrl(path, token, file)`을 호출해
 * Vercel 서버리스 함수를 거치지 않고 파일을 바로 올린다 — 특히 용량이
 * 큰 영상에서 중간 홉 하나가 사라져 체감 속도가 빨라진다.
 */
export async function createSignedUploadUrlSupabase(objectPath: string) {
  const sb = client();
  const { data, error } = await sb.storage.from(MEDIA_BUCKET).createSignedUploadUrl(objectPath);
  if (error) throw error;
  const { data: pub } = sb.storage.from(MEDIA_BUCKET).getPublicUrl(objectPath);
  return { signedUrl: data.signedUrl, token: data.token, path: objectPath, publicUrl: pub.publicUrl };
}
