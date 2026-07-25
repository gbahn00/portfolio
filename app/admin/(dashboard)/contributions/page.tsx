import { getContent } from "@/lib/data/repo";
import { ContributionsEditor } from "./editor";

export const dynamic = "force-dynamic";

export default async function ContributionsAdminPage() {
  const content = await getContent();
  return <ContributionsEditor initial={content.contributions} />;
}
