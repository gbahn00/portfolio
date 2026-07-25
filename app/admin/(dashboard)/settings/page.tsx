import { getContent } from "@/lib/data/repo";
import { SettingsEditor } from "./editor";

export const dynamic = "force-dynamic";

export default async function SettingsAdminPage() {
  const content = await getContent();
  return <SettingsEditor initial={content.settings} />;
}
