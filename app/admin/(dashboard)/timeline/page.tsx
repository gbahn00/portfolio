import { getContent } from "@/lib/data/repo";
import { TimelineManager } from "./editor";

export const dynamic = "force-dynamic";

const DEFAULT_GROWTH = { title: "입사 이후, 역할은 이렇게 확장되었습니다.", status: "published" as const };

export default async function TimelineAdminPage() {
  const content = await getContent();
  return <TimelineManager initial={content.timeline} initialGrowth={content.growth ?? DEFAULT_GROWTH} />;
}
