import { getContent } from "@/lib/data/repo";
import { FuturePlansManager } from "./editor";

export const dynamic = "force-dynamic";

export default async function FuturePlansAdminPage() {
  const content = await getContent();
  return <FuturePlansManager initial={content.futurePlans} />;
}
