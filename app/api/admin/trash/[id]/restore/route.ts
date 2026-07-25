import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { restoreTrashItem } from "@/lib/data/repo";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin();
  if (guard) return guard;
  const ok = await restoreTrashItem(params.id);
  if (!ok) return NextResponse.json({ error: "복구할 항목을 찾을 수 없습니다." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
