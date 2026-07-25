import { getContent } from "@/lib/data/repo";
import { AchievementsManager } from "./editor";

export const dynamic = "force-dynamic";

export default async function AchievementsAdminPage() {
  const content = await getContent();
  return <AchievementsManager initial={content.achievements} />;
}
