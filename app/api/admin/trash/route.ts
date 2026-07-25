import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { getTrash } from "@/lib/data/repo";

export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard;
  return NextResponse.json(await getTrash());
}
