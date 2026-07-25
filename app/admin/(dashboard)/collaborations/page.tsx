import { getContent } from "@/lib/data/repo";
import { CollaborationsManager } from "./editor";

export const dynamic = "force-dynamic";

export default async function CollaborationsAdminPage() {
  const content = await getContent();
  return <CollaborationsManager initial={content.collaborations} projects={content.projects} />;
}
