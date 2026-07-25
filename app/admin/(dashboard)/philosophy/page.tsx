import { getContent } from "@/lib/data/repo";
import { PhilosophyEditor } from "./editor";

export const dynamic = "force-dynamic";

export default async function PhilosophyAdminPage() {
  const content = await getContent();
  return <PhilosophyEditor initial={content.philosophy} />;
}
