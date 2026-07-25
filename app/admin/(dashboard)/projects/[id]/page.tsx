import { notFound } from "next/navigation";
import { getContent } from "@/lib/data/repo";
import { ProjectEditor } from "./editor";

export const dynamic = "force-dynamic";

export default async function ProjectEditPage({ params }: { params: { id: string } }) {
  const content = await getContent();
  const project = content.projects.find((p) => p.id === params.id);
  if (!project) notFound();
  return <ProjectEditor initial={project} />;
}
