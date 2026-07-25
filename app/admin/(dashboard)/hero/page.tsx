import { getContent } from "@/lib/data/repo";
import { HeroEditor } from "./editor";

export const dynamic = "force-dynamic";

export default async function HeroAdminPage() {
  const content = await getContent();
  return <HeroEditor initial={content.hero} />;
}
