import { getContent } from "@/lib/data/repo";
import { FaqManager } from "./editor";

export const dynamic = "force-dynamic";

export default async function FaqAdminPage() {
  const content = await getContent();
  return <FaqManager initial={content.faq} />;
}
