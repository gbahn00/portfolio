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
  preview_video jsonb,
  final_video jsonb,
  gallery jsonb not null default '[]',
  before_after jsonb not null default '[]',
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
create policy "public read published hero" on hero_section for select using (status = 'published' and visible = true);
create policy "public read published philosophy" on philosophy_section for select using (status = 'published' and visible = true);
create policy "public read published timeline" on timeline_entries for select using (status = 'published' and visible = true);
create policy "public read published projects" on projects for select using (status = 'published' and public_ok = true);
create policy "public read published competencies" on competencies for select using (status = 'published' and visible = true);
create policy "public read ai_section" on ai_section for select using (status = 'published');
create policy "public read ai_tools" on ai_tools for select using (visible = true);
create policy "public read contribution_section" on contribution_section for select using (status = 'published');
create policy "public read contribution_items" on contribution_items for select using (visible = true);
create policy "public read achievements" on achievements for select using (visible = true);
create policy "public read collaborations" on collaborations for select using (visible = true);
create policy "public read fitness_section" on fitness_section for select using (status = 'published');
create policy "public read future_plans" on future_plans for select using (visible = true);
create policy "public read closing_section" on closing_section for select using (status = 'published');
create policy "public read faq_items" on faq_items for select using (visible = true);
create policy "public read profile" on profile for select using (true);
create policy "public read settings" on site_settings for select using (true);

-- 관리자 전체 권한 (로그인 사용자)
create policy "admin all hero" on hero_section for all using (auth.role() = 'authenticated');
create policy "admin all philosophy" on philosophy_section for all using (auth.role() = 'authenticated');
create policy "admin all timeline" on timeline_entries for all using (auth.role() = 'authenticated');
create policy "admin all projects" on projects for all using (auth.role() = 'authenticated');
create policy "admin all competencies" on competencies for all using (auth.role() = 'authenticated');
create policy "admin all ai_section" on ai_section for all using (auth.role() = 'authenticated');
create policy "admin all ai_tools" on ai_tools for all using (auth.role() = 'authenticated');
create policy "admin all contribution_section" on contribution_section for all using (auth.role() = 'authenticated');
create policy "admin all contribution_items" on contribution_items for all using (auth.role() = 'authenticated');
create policy "admin all achievements" on achievements for all using (auth.role() = 'authenticated');
create policy "admin all collaborations" on collaborations for all using (auth.role() = 'authenticated');
create policy "admin all fitness_section" on fitness_section for all using (auth.role() = 'authenticated');
create policy "admin all future_plans" on future_plans for all using (auth.role() = 'authenticated');
create policy "admin all closing_section" on closing_section for all using (auth.role() = 'authenticated');
create policy "admin all faq_items" on faq_items for all using (auth.role() = 'authenticated');
create policy "admin all profile" on profile for all using (auth.role() = 'authenticated');
create policy "admin all settings" on site_settings for all using (auth.role() = 'authenticated');
create policy "admin all revisions" on revisions for all using (auth.role() = 'authenticated');
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

create policy "public read media" on storage.objects for select using (bucket_id = 'portfolio-media');
create policy "admin upload media" on storage.objects for insert with check (bucket_id = 'portfolio-media' and auth.role() = 'authenticated');
create policy "admin update media" on storage.objects for update using (bucket_id = 'portfolio-media' and auth.role() = 'authenticated');
create policy "admin delete media" on storage.objects for delete using (bucket_id = 'portfolio-media' and auth.role() = 'authenticated');
