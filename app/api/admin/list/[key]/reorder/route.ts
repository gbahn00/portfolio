import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { listReorder } from "@/lib/data/repo";

const ALLOWED = ["timeline", "projects", "competencies", "achievements", "collaborations", "futurePlans", "faq"] as const;
type Key = (typeof ALLOWED)[number];
function assertKey(key: string): key is Key {
  return (ALLOWED as readonly string[]).includes(key);
}

export async function POST(req: NextRequest, { params }: { params: { key: string } }) {
  const guard = await requireAdmin();
  if (guard) return guard;
  if (!assertKey(params.key)) return NextResponse.json({ error: "알 수 없는 목록입니다." }, { status: 400 });
  const { orderedIds } = await req.json();
  await listReorder(params.key, orderedIds);
  return NextResponse.json({ ok: true });
}
