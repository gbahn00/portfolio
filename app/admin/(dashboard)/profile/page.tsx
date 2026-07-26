import { getContent } from "@/lib/data/repo";
import { ProfileEditor } from "./editor";

export const dynamic = "force-dynamic";

export default async function ProfileAdminPage() {
  const content = await getContent();
  return <ProfileEditor initial={content.profile} initialPhilosophy={content.philosophy} />;
}
