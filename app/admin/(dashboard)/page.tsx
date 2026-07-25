import Link from "next/link";
import { getContent, getRevisions } from "@/lib/data/repo";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const content = await getContent();
  const revisions = (await getRevisions()).slice(0, 8);

  const publishedProjects = content.projects.filter((p) => p.status === "published").length;
  const draftProjects = content.projects.filter((p) => p.status !== "published").length;
  const hiddenAchievements = content.achievements.filter((a) => !a.visible).length;

  const cards = [
    { label: "전체 프로젝트", value: content.projects.length, href: "/admin/projects" },
    { label: "공개된 프로젝트", value: publishedProjects, href: "/admin/projects" },
    { label: "작성 중인 프로젝트", value: draftProjects, href: "/admin/projects" },
    { label: "성장과정 항목", value: content.timeline.length, href: "/admin/timeline" },
    { label: "역량 항목", value: content.competencies.length, href: "/admin/competencies" },
    { label: "채울 필요가 있는 성과 수치", value: hiddenAchievements, href: "/admin/achievements" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">대시보드</h1>
      <p className="text-sm text-neutral-500 mb-8">현재 콘텐츠 현황을 한눈에 확인합니다.</p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="rounded-lg border border-neutral-800 p-5 hover:border-orange-500/60 transition-colors">
            <p className="text-3xl font-bold">{c.value}</p>
            <p className="text-sm text-neutral-500 mt-1">{c.label}</p>
          </Link>
        ))}
      </div>

      <h2 className="text-lg font-semibold mb-3">최근 수정 이력</h2>
      <div className="rounded-lg border border-neutral-800 divide-y divide-neutral-800">
        {revisions.length === 0 && <p className="p-4 text-sm text-neutral-500">아직 수정 이력이 없습니다.</p>}
        {revisions.map((r) => (
          <div key={r.id} className="p-4 text-sm flex items-center justify-between">
            <div>
              <p className="text-neutral-200">{r.entity} · {r.field}</p>
              <p className="text-xs text-neutral-500 mt-0.5">{r.editor}</p>
            </div>
            <p className="text-xs text-neutral-500">{new Date(r.editedAt).toLocaleString("ko-KR")}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
