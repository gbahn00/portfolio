import { getContent } from "@/lib/data/repo";
import { CompetenciesManager } from "./editor";

export const dynamic = "force-dynamic";

export default async function CompetenciesAdminPage() {
  const content = await getContent();
  return <CompetenciesManager initial={content.competencies} />;
}
