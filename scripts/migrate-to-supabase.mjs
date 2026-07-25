// ============================================================================
// content/site-content.json에 있는 지금까지의 실제 콘텐츠를 새로 만든
// Supabase 프로젝트로 옮기는 1회용 스크립트.
//
// 사용법:
//   1) supabase/schema.sql을 새 Supabase 프로젝트의 SQL Editor에서 먼저 실행
//   2) 터미널에서 이 프로젝트 루트 기준으로 아래처럼 실행:
//        NEXT_PUBLIC_SUPABASE_URL="https://xxxx.supabase.co" \
//        SUPABASE_SERVICE_ROLE_KEY="eyJ..." \
//        node scripts/migrate-to-supabase.mjs
//      (URL/키는 Supabase 대시보드 > Project Settings > API 에서 확인)
//   3) "완료" 메시지가 뜨면 Vercel 프로젝트 환경변수에도 동일한 값 +
//      DATA_MODE=supabase 를 추가하고 재배포하면 된다.
//
// 이 스크립트는 이 컴퓨터/터미널 안에서만 키를 사용하며, 다른 곳으로
// 전송하지 않는다.
// ============================================================================

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_PATH = path.join(__dirname, "..", "content", "site-content.json");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL 과 SUPABASE_SERVICE_ROLE_KEY 환경변수를 먼저 설정하세요.");
  process.exit(1);
}

const sb = createClient(url, key);
const content = JSON.parse(readFileSync(CONTENT_PATH, "utf-8"));

function snake(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`)] = v;
  }
  return out;
}

async function upsert(table, rows, label) {
  if (!rows || (Array.isArray(rows) && rows.length === 0)) {
    console.log(`- ${label}: 데이터 없음, 건너뜀`);
    return;
  }
  const { error } = await sb.from(table).upsert(rows);
  if (error) {
    console.error(`✗ ${label} 실패:`, error.message);
  } else {
    console.log(`✓ ${label} 완료 (${Array.isArray(rows) ? rows.length : 1}건)`);
  }
}

async function main() {
  console.log("Supabase로 콘텐츠 이전을 시작합니다...\n");

  await upsert("site_settings", { id: 1, ...snake(content.settings) }, "site_settings");
  await upsert("profile", { id: 1, ...snake(content.profile) }, "profile");
  await upsert("hero_section", { id: 1, ...snake(content.hero) }, "hero_section");
  await upsert("philosophy_section", { id: 1, ...snake(content.philosophy) }, "philosophy_section");
  await upsert(
    "ai_section",
    { id: 1, title: content.ai?.title ?? "", process_steps: content.ai?.processSteps ?? [], status: content.ai?.status ?? "draft" },
    "ai_section"
  );
  await upsert(
    "contribution_section",
    { id: 1, title: content.contributions?.title ?? "", status: content.contributions?.status ?? "draft" },
    "contribution_section"
  );
  await upsert("fitness_section", { id: 1, ...snake(content.fitness) }, "fitness_section");
  await upsert("closing_section", { id: 1, ...snake(content.closing) }, "closing_section");

  await upsert("timeline_entries", content.timeline?.map(snake), "timeline_entries");
  await upsert("projects", content.projects?.map(snake), "projects");
  await upsert("competencies", content.competencies?.map(snake), "competencies");
  await upsert("ai_tools", content.ai?.tools?.map(snake), "ai_tools");
  await upsert("contribution_items", content.contributions?.items?.map(snake), "contribution_items");
  await upsert("achievements", content.achievements?.map(snake), "achievements");
  await upsert("collaborations", content.collaborations?.map(snake), "collaborations");
  await upsert("future_plans", content.futurePlans?.map(snake), "future_plans");
  await upsert("faq_items", content.faq?.map(snake), "faq_items");

  console.log("\n이전 완료. 관리자 화면(/admin)에서 각 섹션이 제대로 보이는지 확인하세요.");
}

main().catch((e) => {
  console.error("마이그레이션 중 오류:", e);
  process.exit(1);
});
