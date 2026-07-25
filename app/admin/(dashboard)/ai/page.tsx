import { getContent } from "@/lib/data/repo";
import { AiEditor } from "./editor";

export const dynamic = "force-dynamic";

export default async function AiAdminPage() {
  const content = await getContent();
  return <AiEditor initial={content.ai} />;
}
