-- ============================================================================
-- 영상 크리에이터 특별진급 포트폴리오 - Supabase 스키마
-- 사용법: Supabase 프로젝트 생성 후 SQL Editor 에서 이 파일 전체를 실행하세요.
-- 실행 후 .env 의 DATA_MODE=supabase 로 변경하고 URL/키 값을 채우면
-- 관리자 화면과 공개 화면이 이 데이터베이스를 사용합니다.
-- ============================================================================

create extension if not exists "uuid-ossp";

-- 공개 여부 상태값: draft(작성중) review(검토중) published(공개) hidden(비공개)

-- ----------------------------------------------------------------------------
-- 1. 사이트 설정 (싱글턴)
-- ----------------------------------------------------------------------------
create table if not exists site_settings (
  id int primary key default 1 check (id = 1),
  site_title text not null default '이지은 영상 크리에이터 포트폴리오',
  accent_color text not null default 'orange',
  reduce_motion_respect boolean not null default true,
  section_visibility jsonb not null default '{}',
  section_order jsonb not null default '[]',
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 2. 프로필
-- ----------------------------------------------------------------------------
create table if not exists profile (
  id int primary key default 1 check (id = 1),
  name text not null,
  affiliation text not null,
  rank text not null,
  role text not null,
  joined_at date not null,
  intro_short text not null default '',
  intro_long text not null default '',
  profile_photo jsonb,
  on_site_photos jsonb not null default '[]',
  representative_phrase text not null default '',
  key_facts jsonb not null default '[]',
  tool_skills jsonb not null default '[]',
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 3. 시작 화면
-- ----------------------------------------------------------------------------
create table if not exists hero_section (
  id int primary key default 1 check (id = 1),
  headline text not null default '',
  subline text not null default '',
  name text not null default '',
  role text not null default '',
  department text not null default '',
  join_year text not null default '',
  badge text not null default '',
  background_video jsonb,
  background_image jsonb,
  highlight_clips jsonb not null default '[]',
  visible boolean not null default true,
  status text not null default 'draft'
);

-- ----------------------------------------------------------------------------
-- 4. 핵심 업무 철학
-- ----------------------------------------------------------------------------
create table if not exists philosophy_section (
  id int primary key default 1 check (id = 1),
  title text not null default '',
  paragraphs jsonb not null default '[]',
  keywords jsonb not null default '[]',
  visible boolean not null default true,
  status text not null default 'draft'
);

-- ----------------------------------------------------------------------------
-- 4.1 업무 성장과정 대표 제목 (§82 — 예전엔 컴포넌트에 하드코딩돼 있었다)
-- ----------------------------------------------------------------------------
create table if not exists growth_section (
  id int primary key default 1 check (id = 1),
  title text not null default '입사 이후, 역할은 이렇게 확장되었습니다.',
  status text not null default 'published'
);

-- ----------------------------------------------------------------------------
-- 5. 업무 확장 과정 (연도별)
-- ----------------------------------------------------------------------------
create table if not exists timeline_entries (
  id uuid primary key default uuid_generate_v4(),
  year text not null,
  title text not null,
  description text not null default '',
  experiences jsonb not null default '[]',
  message text not null default '',
  hero_image jsonb,
  hero_video jsonb,
  "order" int not null default 0,
  visible boolean not null default true,
  status text not null default 'draft'
);

-- ----------------------------------------------------------------------------
-- 6. 프로젝트 (대표 작업)
-- ----------------------------------------------------------------------------
create table if not exists projects (
  id uuid primary key default uuid_generate_v4(),
  number text not null default '',
  title text not null,
  brand text not null default '',
  brand_hidden boolean not null default false,
  year text not null default '',
  field text not null,
  purpose text not null default '',
  role text not null default '',
  tools jsonb not null default '[]',
  description text not null default '',
  hero_image jsonb,
  list_preview_media jsonb,
  preview_video jsonb,
  final_video jsonb,
  gallery jsonb not null default '[]',
  before_after jsonb not null default '[]',
  retouch_highlights jsonb not null default '[]',
  metrics jsonb not null default '[]',
  detail_blocks jsonb not null default '[]',
  is_featured boolean not null default false,
  is_detail_featured boolean not null default false,
  public_ok boolean not null default false,
  status text not null default 'draft',
  "order" int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 7. 주요 업무 역량
-- ----------------------------------------------------------------------------
create table if not exists competencies (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text not null default '',
  cases jsonb not null default '[]',
  media jsonb,
  "order" int not null default 0,
  visible boolean not null default true,
  status text not null default 'draft'
);

-- ----------------------------------------------------------------------------
-- 8. 생성형 인공지능 활용
-- ----------------------------------------------------------------------------
create table if not exists ai_section (
  id int primary key default 1 check (id = 1),
  title text not null default '',
  process_steps jsonb not null default '[]',
  status text not null default 'draft'
);

create table if not exists ai_tools (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  logo jsonb,
  purpose text not null default '',
  linked_project_ids jsonb not null default '[]',
  results jsonb not null default '[]',
  prompt_samples jsonb not null default '[]',
  failure_notes jsonb not null default '[]',
  "order" int not null default 0,
  visible boolean not null default true
);

-- ----------------------------------------------------------------------------
-- 9. 팀/조직 기여
-- ----------------------------------------------------------------------------
create table if not exists contribution_section (
  id int primary key default 1 check (id = 1),
  title text not null default '',
  status text not null default 'draft'
);

create table if not exists contribution_items (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text not null default '',
  before_image jsonb,
  after_image jsonb,
  screenshot jsonb,
  metrics jsonb not null default '[]',
  "order" int not null default 0,
  visible boolean not null default true
);

-- ----------------------------------------------------------------------------
-- 10. 주요 성과
-- ----------------------------------------------------------------------------
create table if not exists achievements (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  value text not null,
  unit text not null default '',
  description text not null default '',
  as_of_date date,
  source text not null default '',
  count_up_enabled boolean not null default true,
  "order" int not null default 0,
  visible boolean not null default true
);

-- ----------------------------------------------------------------------------
-- 11. 협업 방식 / 협업 평가
-- ----------------------------------------------------------------------------
create table if not exists collaborations (
  id uuid primary key default uuid_generate_v4(),
  partner text not null,
  process text not null default '',
  related_project_id uuid references projects(id) on delete set null,
  review text,
  author_name text,
  author_name_visible boolean not null default false,
  author_title text,
  author_title_visible boolean not null default false,
  "order" int not null default 0,
  visible boolean not null default true
);

-- ----------------------------------------------------------------------------
-- 12. 특별진급 적합성
-- ----------------------------------------------------------------------------
create table if not exists fitness_section (
  id int primary key default 1 check (id = 1),
  title text not null default '',
  points jsonb not null default '[]',
  related_project_ids jsonb not null default '[]',
  status text not null default 'draft'
);

-- ----------------------------------------------------------------------------
-- 13. 특별진급 이후 실행 계획
-- ----------------------------------------------------------------------------
create table if not exists future_plans (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  summary text not null default '',
  details jsonb not null default '[]',
  expected_effect text not null default '',
  progress text not null default '예정',
  "order" int not null default 0,
  visible boolean not null default true
);

-- ----------------------------------------------------------------------------
-- 14. 마무리 화면
-- ----------------------------------------------------------------------------
create table if not exists closing_section (
  id int primary key default 1 check (id = 1),
  message text not null default '',
  subline text default '',
  name text not null default '',
  role text not null default '',
  department text not null default '',
  badge text not null default '',
  background_image jsonb,
  background_video jsonb,
  external_links jsonb not null default '[]',
  status text not null default 'draft'
);

-- ----------------------------------------------------------------------------
-- 14-1. 자주 묻는 질문 (FAQ)
-- ----------------------------------------------------------------------------
create table if not exists faq_items (
  id uuid primary key default uuid_generate_v4(),
  question text not null,
  answer text not null default '',
  "order" int not null default 0,
  visible boolean not null default true
);

-- ----------------------------------------------------------------------------
-- 15. 수정 이력 / 휴지통
-- ----------------------------------------------------------------------------
create table if not exists revisions (
  id uuid primary key default uuid_generate_v4(),
  entity text not null,
  field text not null,
  before jsonb,
  after jsonb,
  editor text not null default 'admin',
  edited_at timestamptz not null default now()
);

create table if not exists trash (
  id uuid primary key default uuid_generate_v4(),
  entity text not null,
  original_id text not null,
  data jsonb not null,
  deleted_at timestamptz not null default now(),
  deleted_by text not null default 'admin'
);

-- ============================================================================
-- Row Level Security
-- 공개 화면: 누구나 status='published' (그리고 visible=true) 인 데이터만 조회 가능
-- 관리 화면: 인증된 사용자(Supabase Auth)만 전체 읽기/쓰기 가능
-- ============================================================================

alter table site_settings enable row level security;
alter table profile enable row level security;
alter table hero_section enable row level security;
alter table philosophy_section enable row level security;
alter table timeline_entries enable row level security;
alter table projects enable row level security;
alter table competencies enable row level security;
alter table ai_section enable row level security;
alter table ai_tools enable row level security;
alter table contribution_section enable row level security;
alter table contribution_items enable row level security;
alter table achievements enable row level security;
alter table collaborations enable row level security;
alter table fitness_section enable row level security;
alter table future_plans enable row level security;
alter table closing_section enable row level security;
alter table faq_items enable row level security;
alter table revisions enable row level security;
alter table trash enable row level security;

-- 공개 읽기 정책 (published 상태만)
-- create policy에는 IF NOT EXISTS가 없어서, 이 파일을 두 번째 실행하면
-- "policy already exists" 오류가 난다. 매번 먼저 지우고 다시 만들어
-- 이 스크립트를 몇 번 다시 실행해도 안전하게(idempotent) 했다.
drop policy if exists "public read published hero" on hero_section;
create policy "public read published hero" on hero_section for select using (status = 'published' and visible = true);
drop policy if exists "public read published philosophy" on philosophy_section;
create policy "public read published philosophy" on philosophy_section for select using (status = 'published' and visible = true);
drop policy if exists "public read published timeline" on timeline_entries;
create policy "public read published timeline" on timeline_entries for select using (status = 'published' and visible = true);
drop policy if exists "public read published projects" on projects;
create policy "public read published projects" on projects for select using (status = 'published' and public_ok = true);
drop policy if exists "public read published competencies" on competencies;
create policy "public read published competencies" on competencies for select using (status = 'published' and visible = true);
drop policy if exists "public read ai_section" on ai_section;
create policy "public read ai_section" on ai_section for select using (status = 'published');
drop policy if exists "public read ai_tools" on ai_tools;
create policy "public read ai_tools" on ai_tools for select using (visible = true);
drop policy if exists "public read contribution_section" on contribution_section;
create policy "public read contribution_section" on contribution_section for select using (status = 'published');
drop policy if exists "public read contribution_items" on contribution_items;
create policy "public read contribution_items" on contribution_items for select using (visible = true);
drop policy if exists "public read achievements" on achievements;
create policy "public read achievements" on achievements for select using (visible = true);
drop policy if exists "public read collaborations" on collaborations;
create policy "public read collaborations" on collaborations for select using (visible = true);
drop policy if exists "public read fitness_section" on fitness_section;
create policy "public read fitness_section" on fitness_section for select using (status = 'published');
drop policy if exists "public read future_plans" on future_plans;
create policy "public read future_plans" on future_plans for select using (visible = true);
drop policy if exists "public read closing_section" on closing_section;
create policy "public read closing_section" on closing_section for select using (status = 'published');
drop policy if exists "public read faq_items" on faq_items;
create policy "public read faq_items" on faq_items for select using (visible = true);
drop policy if exists "public read profile" on profile;
create policy "public read profile" on profile for select using (true);
drop policy if exists "public read settings" on site_settings;
create policy "public read settings" on site_settings for select using (true);

-- 관리자 전체 권한 (로그인 사용자)
drop policy if exists "admin all hero" on hero_section;
create policy "admin all hero" on hero_section for all using (auth.role() = 'authenticated');
drop policy if exists "admin all philosophy" on philosophy_section;
create policy "admin all philosophy" on philosophy_section for all using (auth.role() = 'authenticated');
drop policy if exists "admin all timeline" on timeline_entries;
create policy "admin all timeline" on timeline_entries for all using (auth.role() = 'authenticated');
drop policy if exists "admin all projects" on projects;
create policy "admin all projects" on projects for all using (auth.role() = 'authenticated');
drop policy if exists "admin all competencies" on competencies;
create policy "admin all competencies" on competencies for all using (auth.role() = 'authenticated');
drop policy if exists "admin all ai_section" on ai_section;
create policy "admin all ai_section" on ai_section for all using (auth.role() = 'authenticated');
drop policy if exists "admin all ai_tools" on ai_tools;
create policy "admin all ai_tools" on ai_tools for all using (auth.role() = 'authenticated');
drop policy if exists "admin all contribution_section" on contribution_section;
create policy "admin all contribution_section" on contribution_section for all using (auth.role() = 'authenticated');
drop policy if exists "admin all contribution_items" on contribution_items;
create policy "admin all contribution_items" on contribution_items for all using (auth.role() = 'authenticated');
drop policy if exists "admin all achievements" on achievements;
create policy "admin all achievements" on achievements for all using (auth.role() = 'authenticated');
drop policy if exists "admin all collaborations" on collaborations;
create policy "admin all collaborations" on collaborations for all using (auth.role() = 'authenticated');
drop policy if exists "admin all fitness_section" on fitness_section;
create policy "admin all fitness_section" on fitness_section for all using (auth.role() = 'authenticated');
drop policy if exists "admin all future_plans" on future_plans;
create policy "admin all future_plans" on future_plans for all using (auth.role() = 'authenticated');
drop policy if exists "admin all closing_section" on closing_section;
create policy "admin all closing_section" on closing_section for all using (auth.role() = 'authenticated');
drop policy if exists "admin all faq_items" on faq_items;
create policy "admin all faq_items" on faq_items for all using (auth.role() = 'authenticated');
drop policy if exists "admin all profile" on profile;
create policy "admin all profile" on profile for all using (auth.role() = 'authenticated');
drop policy if exists "admin all settings" on site_settings;
create policy "admin all settings" on site_settings for all using (auth.role() = 'authenticated');
drop policy if exists "admin all revisions" on revisions;
create policy "admin all revisions" on revisions for all using (auth.role() = 'authenticated');
drop policy if exists "admin all trash" on trash;
create policy "admin all trash" on trash for all using (auth.role() = 'authenticated');

-- 초기 싱글턴 행 생성
insert into site_settings (id) values (1) on conflict (id) do nothing;
insert into hero_section (id) values (1) on conflict (id) do nothing;
insert into philosophy_section (id) values (1) on conflict (id) do nothing;
insert into ai_section (id) values (1) on conflict (id) do nothing;
insert into contribution_section (id) values (1) on conflict (id) do nothing;
insert into fitness_section (id) values (1) on conflict (id) do nothing;
insert into closing_section (id) values (1) on conflict (id) do nothing;

-- ============================================================================
-- Storage 버킷 (Supabase 대시보드 > Storage 에서 생성, 또는 아래 함수 사용)
-- portfolio-media : 이미지/영상 업로드용 공개 버킷 (public read, authenticated write)
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('portfolio-media', 'portfolio-media', true)
on conflict (id) do nothing;

drop policy if exists "public read media" on storage.objects;
create policy "public read media" on storage.objects for select using (bucket_id = 'portfolio-media');
drop policy if exists "admin upload media" on storage.objects;
create policy "admin upload media" on storage.objects for insert with check (bucket_id = 'portfolio-media' and auth.role() = 'authenticated');
drop policy if exists "admin update media" on storage.objects;
create policy "admin update media" on storage.objects for update using (bucket_id = 'portfolio-media' and auth.role() = 'authenticated');
drop policy if exists "admin delete media" on storage.objects;
create policy "admin delete media" on storage.objects for delete using (bucket_id = 'portfolio-media' and auth.role() = 'authenticated');

-- ============================================================================
-- 마이그레이션 보정 (실제 DB에 처음 연결했을 때 드러난 문제 수정)
--
-- 1) closing_section에 subline 컬럼이 빠져 있었다(위 CREATE TABLE 정의에는
--    이미 추가했지만, 이미 테이블을 만든 프로젝트에는 반영되지 않으므로
--    ALTER로 보정한다).
-- 2) 목록형 엔티티(timeline_entries/projects/competencies/ai_tools/
--    contribution_items/achievements/collaborations/future_plans/faq_items)
--    의 id를 uuid로 선언했었는데, 지금까지 로컬 모드에서 실제로 쓰던 id는
--    "tl-2024", "proj-clothing", "c1" 처럼 진짜 UUID 형식이 아닌 문자열이다.
--    그대로 옮기면 "invalid input syntax for type uuid" 오류가 난다.
--    앱 코드(lib/data/repo.ts)는 항상 자기가 만든 id 문자열을 그대로 쓰므로,
--    컬럼 타입을 uuid 대신 text로 바꿔 어떤 문자열 id도 저장할 수 있게 한다.
--    이 블록은 몇 번을 다시 실행해도 안전하다(text -> text는 그대로 통과됨).
-- ============================================================================
alter table closing_section add column if not exists subline text default '';

-- projects.id를 바꾸기 전에, 그 컬럼을 참조하는 FK부터 먼저 끊어야 한다.
-- (참조가 살아있는 상태로 부모 컬럼(projects.id) 타입을 바꾸면 Postgres가
--  그 자리에서 기존 FK의 타입 정합성을 검사하다가 "uuid and text incompatible"
--  오류를 낸다. 그래서 drop constraint를 가장 먼저 실행한다.)
alter table collaborations drop constraint if exists collaborations_related_project_id_fkey;

alter table timeline_entries alter column id type text;
alter table timeline_entries alter column id set default uuid_generate_v4()::text;

alter table projects alter column id type text;
alter table projects alter column id set default uuid_generate_v4()::text;

alter table competencies alter column id type text;
alter table competencies alter column id set default uuid_generate_v4()::text;

alter table ai_tools alter column id type text;
alter table ai_tools alter column id set default uuid_generate_v4()::text;

alter table contribution_items alter column id type text;
alter table contribution_items alter column id set default uuid_generate_v4()::text;

alter table achievements alter column id type text;
alter table achievements alter column id set default uuid_generate_v4()::text;

alter table collaborations alter column id type text;
alter table collaborations alter column id set default uuid_generate_v4()::text;
alter table collaborations alter column related_project_id type text;
alter table collaborations add constraint collaborations_related_project_id_fkey
  foreign key (related_project_id) references projects(id) on delete set null;

alter table future_plans alter column id type text;
alter table future_plans alter column id set default uuid_generate_v4()::text;

alter table faq_items alter column id type text;
alter table faq_items alter column id set default uuid_generate_v4()::text;

-- projects에 "목록 미리보기 전용 미디어" 컬럼을 추가한다(위 CREATE TABLE
-- 정의에는 이미 추가했지만, 이미 만들어진 테이블에는 반영되지 않으므로
-- ALTER로 보정한다). 비워두면 앱이 hero_image로 대신 보여준다.
alter table projects add column if not exists list_preview_media jsonb;

-- profile에 "생성형 활용 도구" 숙련도 목록 컬럼을 추가한다(위 CREATE TABLE
-- 정의에는 이미 추가했지만, 이미 만들어진 테이블에는 반영되지 않으므로
-- ALTER로 보정한다).
alter table profile add column if not exists tool_skills jsonb not null default '[]';

-- projects에 "보정 포인트"(원본 없이 보정 후 사진만 있을 때, 사진 위 특정
-- 위치에 점을 찍어 설명하는 방식) 컬럼을 추가한다.
alter table projects add column if not exists retouch_highlights jsonb not null default '[]';

-- §82 — "업무 성장과정" 대표 제목을 관리자 화면에서 편집할 수 있게 새 테이블을
-- 추가한다(위 CREATE TABLE 구문에 이미 포함되어 있지만, 이미 스키마를 실행해
-- 둔 기존 프로젝트에는 반영되지 않으므로 아래 구문만 다시 실행해도 된다).
create table if not exists growth_section (
  id int primary key default 1 check (id = 1),
  title text not null default '입사 이후, 역할은 이렇게 확장되었습니다.',
  status text not null default 'published'
);
alter table growth_section enable row level security;
drop policy if exists "public read published growth" on growth_section;
create policy "public read published growth" on growth_section for select using (status = 'published');
drop policy if exists "admin all growth" on growth_section;
create policy "admin all growth" on growth_section for all using (auth.role() = 'authenticated');
insert into growth_section (id) values (1) on conflict (id) do nothing;

-- ============================================================================
-- 참고: 마이그레이션 스크립트를 SUPABASE_SERVICE_ROLE_KEY로 실행했는데도
-- "new row violates row-level security policy" 오류가 난다면, 대부분
-- Project Settings > API 화면에서 "anon public" 키를 잘못 복사한 경우다.
-- service_role 키는 "secret"이라고 표시된 키이며, 이 키를 쓰면 RLS를 아예
-- 우회하므로 위 정책들과 무관하게 항상 통과해야 한다.
-- ============================================================================
