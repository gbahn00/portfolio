import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { exportBackup } from "@/lib/data/repo";

export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard;
  const backup = await exportBackup();
  const filename = `portfolio-backup-${new Date().toISOString().slice(0, 10)}.json`;
  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
