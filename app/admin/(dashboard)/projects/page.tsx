import { getContent } from "@/lib/data/repo";
import { ProjectsList } from "./list";

export const dynamic = "force-dynamic";

export default async function ProjectsAdminPage() {
  const content = await getContent();
  return <ProjectsList initial={content.projects} />;
}
