import { getContent } from "@/lib/data/repo";
import { PrintDocument } from "@/components/print/PrintDocument";
import { PrintControls } from "@/components/print/PrintControls";
import { getProjectPrintView, getPublicProjectsSorted } from "@/lib/print-content";

// §153 — Admin PDF Export. /admin 하위 경로라 middleware.ts가 이미
// 로그인 세션을 요구한다(공개 화면에는 절대 노출되지 않는다 — 스펙 1번).
// admin/(dashboard) 레이아웃(사이드바 등 관리자 UI 뼈대) 밖에 따로 둬서,
// 이 페이지는 실제 인쇄될 콘텐츠만 순수하게 담는다.
export const dynamic = "force-dynamic";

export default async function AdminPrintPage() {
  const content = await getContent();

  // §156-25 — "PDF 생성 전 검증"의 축소판. 전체 자동 검증 게이트(10개
  // 항목)는 별도 UI/상태 작업이 커서 이번 패스에서는 만들지 않았지만,
  // 그중 가장 눈에 띄는 문제 — 대표 이미지가 하나도 없어서 대표페이지가
  // 텅 빈 배경으로 나오는 경우 — 만큼은 화면(인쇄 시엔 숨김)에서 미리
  // 알려준다.
  const publicProjects = getPublicProjectsSorted(content);
  const missingImageProjects = publicProjects
    .map((p) => ({ project: p, view: getProjectPrintView(p) }))
    .filter((x) => x.view.hasUsableContent && !x.view.primaryImage && !x.view.beforeAfterPair && !x.view.videoThumb)
    .map((x) => x.project.title);

  return (
    <>
      <PrintControls />
      {missingImageProjects.length > 0 && (
        <div className="no-print fixed left-4 top-20 z-40 max-w-xs rounded-md border border-amber-500/40 bg-amber-950/90 p-4 text-xs text-amber-200 shadow-lg">
          <p className="mb-1.5 font-semibold text-amber-300">대표 이미지가 없는 프로젝트</p>
          <p className="mb-2 text-amber-200/80">
            아래 프로젝트는 PDF 대표페이지에 넣을 이미지가 없어 본문만 출력됩니다. Admin에서 대표 이미지를 등록해 주세요.
          </p>
          <ul className="space-y-0.5">
            {missingImageProjects.map((title) => (
              <li key={title}>· {title}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="pt-16 print:pt-0">
        <PrintDocument content={content} />
      </div>
    </>
  );
}
