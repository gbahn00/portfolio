import { getTrash } from "@/lib/data/repo";
import { TrashManager } from "./editor";

export const dynamic = "force-dynamic";

export default async function TrashAdminPage() {
  const items = await getTrash();
  return <TrashManager initial={items} />;
}
