# Vercel 배포 가이드

포트폴리오 사이트를 공개 URL로 배포하는 방법입니다. Vercel 계정이 없다면 [vercel.com](https://vercel.com)에서 GitHub 계정으로 무료 가입할 수 있습니다.

## 1. GitHub에 프로젝트 올리기

로컬(내 컴퓨터)에서 포트폴리오 폴더로 이동한 뒤:

```bash
cd 포트폴리오_폴더_경로
git init
git add .
git commit -m "portfolio initial commit"
```

GitHub에서 새 저장소(private 추천)를 만든 다음:

```bash
git remote add origin https://github.com/내계정/저장소이름.git
git branch -M main
git push -u origin main
```

`.env`, `.env.local`, `node_modules`, `.next`는 `.gitignore`에 이미 포함되어 있어야 합니다(있는지 확인).

## 2. Vercel에서 프로젝트 가져오기

1. vercel.com 로그인 → **Add New → Project**
2. 방금 올린 GitHub 저장소 선택 → **Import**
3. Framework는 Next.js로 자동 인식됨 (별도 설정 불필요)

## 3. 환경 변수 설정

**Import 화면(또는 이후 Settings → Environment Variables)**에서 아래 값을 등록합니다.

| 이름 | 값 | 설명 |
|---|---|---|
| `DATA_MODE` | `local` | 지금 구조 그대로 배포할 경우 |
| `ADMIN_PASSWORD` | (직접 정할 새 비밀번호) | 관리자 로그인 비밀번호. `.env.example`의 기본값을 그대로 쓰지 말 것 |
| `SESSION_SECRET` | (임의의 긴 랜덤 문자열, 32자 이상 권장) | 세션 암호화 키 |
| `SESSION_TIMEOUT_MINUTES` | `30` | 자동 로그아웃 시간(분), 필요시 조정 |

랜덤 문자열은 터미널에서 `openssl rand -base64 32` 로 생성 가능합니다.

## 4. 배포

**Deploy** 버튼 클릭 → 1~2분 후 `https://프로젝트이름.vercel.app` 형태의 공개 URL이 발급됩니다. 이후 `main` 브랜치에 새로 push할 때마다 자동으로 재배포됩니다.

---

## 중요: local 모드의 데이터 저장 한계

**꼭 확인해야 하는 부분입니다.**

현재 관리자 CMS는 `content/site-content.json` 같은 로컬 JSON 파일에 콘텐츠를 씁니다. 로컬 컴퓨터에서는 이 파일이 디스크에 그대로 남아있지만, Vercel은 서버리스 환경이라 **요청마다 새 컨테이너에서 실행되고 파일시스템이 read-only에 가깝게 취급되며, 재배포/콜드스타트 시 초기화**됩니다.

즉, **배포된 사이트의 관리자 페이지에서 글이나 프로젝트를 수정해도 그 변경사항이 저장되지 않거나, 다음 배포 때 사라집니다.** 배포 전 로컬에서 콘텐츠를 최종 확정한 뒤 push하는 방식(콘텐츠 = 코드처럼 관리)으로 쓰는 것은 문제없지만, **운영 중 관리자 페이지로 실시간 편집하는 용도로는 local 모드가 Vercel에서 동작하지 않습니다.**

### 해결 방법: Supabase 모드로 전환

이 프로젝트는 처음부터 `DATA_MODE=supabase`로 전환 가능하도록 설계되어 있습니다 (`supabase/schema.sql` 포함).

1. [supabase.com](https://supabase.com)에서 무료 프로젝트 생성
2. Supabase 대시보드 → SQL Editor에서 `supabase/schema.sql` 실행
3. Supabase 프로젝트의 URL / anon key / service role key를 Vercel 환경 변수에 추가:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. `DATA_MODE`를 `local`에서 `supabase`로 변경
5. 관리자 로그인은 `ADMIN_PASSWORD` 대신 Supabase Auth 이메일/비밀번호 계정을 사용하게 됩니다 (별도 계정 생성 필요)

이 전환 이후에는 배포된 사이트에서 관리자 페이지로 실시간 편집한 내용이 정상적으로 영구 저장됩니다.

### 지금 당장은?

포트폴리오를 "완성된 상태로 공개"하는 목적이라면 local 모드 그대로 배포해도 무방합니다 — 콘텐츠는 이미 확정되어 있고, 이후 수정이 필요하면 로컬에서 편집 후 다시 push하면 됩니다. 다만 "취업/평가 담당자가 보는 도중에도 실시간으로 내용을 고치고 싶다" 같은 운영 시나리오라면 Supabase 전환을 먼저 진행하는 것을 권장합니다.
