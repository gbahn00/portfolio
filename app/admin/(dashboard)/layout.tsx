import Link from "next/link";
import { LogoutButton } from "./LogoutButton";

// §133 — "수정 홈페이지내의 탭 순서를 현재 포트폴리오 페이지 순서에 맞게
// 수정해줘"라는 요청. 기존엔 메뉴가 실제 홈페이지 노출 순서와 무관하게
// 뒤섞여 있었다(예: "프로필 관리"가 "시작 화면 관리"보다 위에 있었지만,
// 실제 홈페이지에선 시작 화면이 먼저 나온다). docs/관리자_메뉴별_반영위치_
// 가이드.md에서 확인한 실제 홈페이지 순서(대표 화면 → 프로필[자기소개/
// 핵심 철학/역량] → 성장과정 → 프로젝트 → 향후 계획 → FAQ → 마무리 화면)
// 그대로 메뉴를 다시 배열하고, 소제목(구분선)을 넣어 그룹을 눈에 띄게
// 나눴다. "인공지능 활용/조직 기여/성과/협업 평가/특별진급 적합성" 5개는
// 같은 가이드에서 확인했듯 현재 어느 화면에도 반영되지 않는 메뉴라
// 헷갈리지 않도록 별도 그룹("아직 사이트에 반영되지 않음")으로 명확히
// 분리했다.
const NAV_GROUPS: { title: string | null; items: { href: string; label: string }[] }[] = [
  {
    title: null,
    items: [{ href: "/admin", label: "대시보드" }],
  },
  {
    title: "홈페이지 순서대로",
    items: [
      { href: "/admin/hero", label: "① 시작 화면 관리" },
      { href: "/admin/profile", label: "② 프로필 관리" },
      { href: "/admin/philosophy", label: "② 핵심 철학 관리" },
      { href: "/admin/competencies", label: "② 역량 관리" },
      { href: "/admin/timeline", label: "③ 성장과정 관리" },
      { href: "/admin/projects", label: "④ 프로젝트 관리" },
      { href: "/admin/future-plans", label: "⑤ 향후 계획 관리" },
      { href: "/admin/faq", label: "⑥ FAQ 관리" },
      { href: "/admin/closing", label: "⑦ 마무리 화면 관리" },
    ],
  },
  {
    title: "아직 사이트에 반영되지 않음",
    items: [
      { href: "/admin/ai", label: "인공지능 활용 관리" },
      { href: "/admin/contributions", label: "조직 기여 관리" },
      { href: "/admin/achievements", label: "성과 관리" },
      { href: "/admin/collaborations", label: "협업 평가 관리" },
      { href: "/admin/fitness", label: "특별진급 적합성 관리" },
    ],
  },
  {
    title: "설정 및 관리",
    items: [
      { href: "/admin/settings", label: "사이트 설정" },
      { href: "/admin/trash", label: "휴지통" },
      { href: "/admin/backup", label: "백업" },
    ],
  },
];

// §153 — "PDF Export" 기능은 일반 방문자에게는 노출하지 않는 관리자 전용
// 기능이라(스펙 1번), 사이드바 메뉴 목록과 분리된 별도 링크로 둔다.
// 새 탭으로 열어서, 인쇄 미리보기/저장을 마친 뒤 관리자 화면으로 돌아와도
// 원래 작업하던 화면이 그대로 남아있게 했다.

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex">
      <aside className="w-60 shrink-0 border-r border-neutral-800 h-screen sticky top-0 overflow-y-auto">
        <div className="px-5 py-5 border-b border-neutral-800">
          <p className="text-xs text-neutral-500">관리자 화면</p>
          <p className="text-sm font-semibold">이지은 포트폴리오</p>
        </div>
        <nav className="py-3">
          {NAV_GROUPS.map((group, gi) => (
            <div key={gi} className={gi > 0 ? "mt-3 pt-3 border-t border-neutral-800" : ""}>
              {group.title && (
                <p className="px-5 pb-1 text-[10px] font-medium uppercase tracking-wide text-neutral-600">
                  {group.title}
                </p>
              )}
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-5 py-2 text-sm text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-neutral-800">
          <Link href="/" target="_blank" className="block text-xs text-neutral-500 hover:text-neutral-300 mb-3">
            공개 화면 보기 ↗
          </Link>
          <Link href="/admin/print" target="_blank" className="block text-xs text-neutral-500 hover:text-neutral-300 mb-3">
            PDF Export ↗
          </Link>
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 px-6 py-8 max-w-4xl">{children}</main>
    </div>
  );
}
