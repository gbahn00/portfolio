import { getContent } from "@/lib/data/repo";
import { ClosingEditor } from "./editor";

export const dynamic = "force-dynamic";

export default async function ClosingAdminPage() {
  const content = await getContent();
  return <ClosingEditor initial={content.closing} />;
}
