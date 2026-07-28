import { getContent } from "@/lib/data/repo";
import { PrintDocument } from "@/components/print/PrintDocument";
import { PrintControls } from "@/components/print/PrintControls";

// §153 — Admin PDF Export. /admin 하위 경로라 middleware.ts가 이미
// 로그인 세션을 요구한다(공개 화면에는 절대 노출되지 않는다 — 스펙 1번).
// admin/(dashboard) 레이아웃(사이드바 등 관리자 UI 뼈대) 밖에 따로 둬서,
// 이 페이지는 실제 인쇄될 콘텐츠만 순수하게 담는다.
export const dynamic = "force-dynamic";

export default async function AdminPrintPage() {
  const content = await getContent();

  return (
    <>
      <PrintControls />
      <div className="pt-16 print:pt-0">
        <PrintDocument content={content} />
      </div>
    </>
  );
}
