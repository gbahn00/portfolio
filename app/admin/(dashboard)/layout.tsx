import Link from "next/link";
import { LogoutButton } from "./LogoutButton";

const NAV = [
  { href: "/admin", label: "대시보드" },
  { href: "/admin/profile", label: "프로필 관리" },
  { href: "/admin/hero", label: "시작 화면 관리" },
  { href: "/admin/philosophy", label: "핵심 철학 관리" },
  { href: "/admin/timeline", label: "성장과정 관리" },
  { href: "/admin/projects", label: "프로젝트 관리" },
  { href: "/admin/competencies", label: "역량 관리" },
  { href: "/admin/ai", label: "인공지능 활용 관리" },
  { href: "/admin/contributions", label: "조직 기여 관리" },
  { href: "/admin/achievements", label: "성과 관리" },
  { href: "/admin/collaborations", label: "협업 평가 관리" },
  { href: "/admin/fitness", label: "특별진급 적합성 관리" },
  { href: "/admin/future-plans", label: "향후 계획 관리" },
  { href: "/admin/faq", label: "FAQ 관리" },
  { href: "/admin/closing", label: "마무리 화면 관리" },
  { href: "/admin/settings", label: "사이트 설정" },
  { href: "/admin/trash", label: "휴지통" },
  { href: "/admin/backup", label: "백업" },
];

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex">
      <aside className="w-60 shrink-0 border-r border-neutral-800 h-screen sticky top-0 overflow-y-auto">
        <div className="px-5 py-5 border-b border-neutral-800">
          <p className="text-xs text-neutral-500">관리자 화면</p>
          <p className="text-sm font-semibold">이지은 포트폴리오</p>
        </div>
        <nav className="py-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-5 py-2 text-sm text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-neutral-800">
          <Link href="/" target="_blank" className="block text-xs text-neutral-500 hover:text-neutral-300 mb-3">
            공개 화면 보기 ↗
          </Link>
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 px-6 py-8 max-w-4xl">{children}</main>
    </div>
  );
}
