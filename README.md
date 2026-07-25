# 이지은 영상 크리에이터 특별진급 포트폴리오

촬영·보정에서 시작해 영상 제작, 광고, 유튜브, 생성형 인공지능 활용과 제작 관리체계 구축까지
역할을 확장해 온 과정을 보여주는 모션 기반 웹 포트폴리오입니다.

모든 문구, 사진, 영상, 프로젝트 정보는 코드가 아니라 **관리자 화면(`/admin`)** 에서 관리합니다.
개발자 없이도 글자 수정, 사진·영상 교체, 프로젝트 추가/삭제, 공개 여부 설정을 직접 할 수 있습니다.

자세한 사용법은 [`docs/관리자_사용설명서.md`](./docs/관리자_사용설명서.md) 를 참고하세요.

---

## 1. 빠른 시작 (지금 바로 로컬에서 실행하기)

Supabase나 Vercel 계정이 없어도 아래 절차만으로 컴퓨터에서 바로 확인할 수 있습니다.
(Node.js 18 이상 필요)

```bash
npm install
cp .env.example .env
npm run dev
```

- 공개 화면: http://localhost:3000
- 관리자 화면: http://localhost:3000/admin (초기 비밀번호는 `.env` 의 `ADMIN_PASSWORD` 값, 기본값 `change-me-before-deploy`)

`.env` 파일에서 `ADMIN_PASSWORD` 를 반드시 원하는 값으로 바꾸세요.

이 상태(`DATA_MODE=local`)에서는 모든 콘텐츠가 프로젝트 폴더 안의
`content/site-content.json` 파일에 저장됩니다. 별도 데이터베이스 없이도
관리자 화면의 모든 기능(글자 수정, 사진/영상 업로드, 프로젝트 추가/삭제, 공개 설정 등)이 정상 동작합니다.

콘텐츠를 처음 상태(시드 데이터)로 되돌리고 싶다면:

```bash
npm run seed:reset
```

---

## 2. 실제 서비스로 배포하기 (Supabase + Vercel)

지금은 계정이 없는 상태로 제작되어 `DATA_MODE=local` 로 동작하지만,
다음 절차를 따르면 실제 데이터베이스와 공개 주소를 가진 서비스로 전환할 수 있습니다.

### 2-1. Supabase 프로젝트 만들기

1. https://supabase.com 에서 새 프로젝트를 만듭니다.
2. 프로젝트의 SQL Editor 에서 `supabase/schema.sql` 파일 전체 내용을 실행합니다.
   (테이블, 보안 정책, 이미지/영상 저장용 Storage 버킷이 함께 생성됩니다.)
3. Supabase 프로젝트의 **Settings → API** 에서 `Project URL`, `anon public key`, `service_role key` 를 확인합니다.
4. Supabase의 **Authentication → Users** 에서 관리자로 사용할 이메일/비밀번호 계정을 하나 만듭니다.

### 2-2. 환경변수 설정

`.env` 파일(또는 Vercel 프로젝트 환경변수)에 다음을 채웁니다.

```
DATA_MODE=supabase
NEXT_PUBLIC_SUPABASE_URL=발급받은 Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=발급받은 anon public key
SUPABASE_SERVICE_ROLE_KEY=발급받은 service_role key
SESSION_SECRET=무작위의 긴 문자열로 변경
```

> 참고: `lib/data/supabase-store.ts` 에 Supabase 연동 코드가 준비되어 있습니다.
> 계정이 없는 상태로 작성되어 실제 데이터베이스로 검증하지 못했으므로,
> 연결 직후 관리자 화면에서 각 메뉴를 한 번씩 저장해보며 정상 동작을 확인하세요.
> 문제가 있다면 해당 파일의 쿼리 부분을 프로젝트 상황에 맞게 조정하면 됩니다.

### 2-3. Vercel 배포

1. 이 프로젝트 저장소를 GitHub 등에 올립니다.
2. https://vercel.com 에서 새 프로젝트로 가져옵니다.
3. 위 환경변수를 Vercel 프로젝트의 Environment Variables 에 동일하게 입력합니다.
4. 배포하면 공개 주소가 발급됩니다. `https://your-domain.vercel.app/admin` 으로 관리자 화면에 접속합니다.

### 2-4. 자체 서버에 배포하는 경우

```bash
npm run build
npm run start
```

---

## 3. 폴더 구조

```
app/                      화면 라우트 (공개 화면 + /admin 관리자 화면 + API)
  page.tsx                공개 화면 메인 (14개 화면 영역을 순서대로 조립)
  projects/[id]/page.tsx  프로젝트 상세 화면
  admin/                  관리자 화면 (로그인, 대시보드, 각 콘텐츠 관리 메뉴)
  api/admin/              관리자 전용 API (콘텐츠 저장, 업로드, 인증)
components/
  sections/                공개 화면을 구성하는 14개 섹션 컴포넌트
  admin/                   관리자 화면 공통 입력 컴포넌트(텍스트, 업로드, 순서변경 등)
  motion/                  스크롤 등장 애니메이션 공통 컴포넌트
lib/
  types.ts                 전체 콘텐츠 데이터 구조 정의
  data/                    콘텐츠 저장소 (local 파일 기반 / Supabase 전환 코드)
  auth.ts, admin-guard.ts  관리자 인증
content/
  seed.json                최초 시드 콘텐츠 ([자료 필요]로 표시된 항목 포함)
  site-content.json        실제 운영 중인 콘텐츠 (local 모드에서 자동 생성됨)
supabase/schema.sql        Supabase 전환 시 사용할 전체 데이터베이스 스키마
public/placeholders/       실제 자료가 준비되기 전 사용하는 자리표시자 이미지
docs/                       관리자 사용설명서
```

---

## 4. 자료 준비 안내 ([자료 필요] 표시)

지침서 원칙에 따라 확인되지 않은 사진, 영상, 성과 수치는 임의로 채우지 않고
`[자료 필요]` 로 표시해 두었습니다. 실제 자료가 준비되면 관리자 화면에서 하나씩 교체·입력하세요.

- 프로젝트의 브랜드명, 실제 촬영/보정 사진, 광고 성과 수치 등 → `/admin/projects`
- 시작 화면 대표 영상 → `/admin/hero`
- 주요 성과 수치 → `/admin/achievements` (값을 입력하고 "공개 화면에 노출"을 켜야 실제로 보입니다)
- 협업 평가/후기 → `/admin/collaborations`

모든 프로젝트는 **"공개 가능 여부"** 를 켜야만 공개 화면에 노출됩니다.
브랜드나 병원, 고객사의 공개 승인을 받은 뒤에 켜는 것을 권장합니다.

---

## 5. 기술 스택

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- GSAP + ScrollTrigger (스크롤 연동 모션 — 화면 고정, 가로 스크롤, 양방향 재생 등)
- Supabase (Postgres + Storage + Auth) — 선택적, 준비 시 전환
- 기본 상태(local 모드)에서는 별도 데이터베이스 없이 파일 기반으로 동작

## 6. 백업 및 장애 복구

- 관리자 화면의 **백업** 메뉴에서 전체 콘텐츠를 JSON 파일로 내려받을 수 있습니다.
- 복원하려면 내려받은 파일의 `content` 항목을 `content/site-content.json` 에 그대로 붙여넣고 서버를 재시작하면 됩니다.
- 콘텐츠를 삭제해도 즉시 완전히 사라지지 않고 관리자 화면의 **휴지통** 메뉴에서 복구할 수 있습니다.
