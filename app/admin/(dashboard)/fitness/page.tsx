import { getContent } from "@/lib/data/repo";
import { FitnessEditor } from "./editor";

export const dynamic = "force-dynamic";

export default async function FitnessAdminPage() {
  const content = await getContent();
  return <FitnessEditor initial={content.fitness} />;
}
