import { getContent } from "@/lib/data/repo";
import { TimelineManager } from "./editor";

export const dynamic = "force-dynamic";

export default async function TimelineAdminPage() {
  const content = await getContent();
  return <TimelineManager initial={content.timeline} />;
}
