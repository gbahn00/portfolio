import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { purgeTrashItem } from "@/lib/data/repo";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin();
  if (guard) return guard;
  await purgeTrashItem(params.id);
  return NextResponse.json({ ok: true });
}
