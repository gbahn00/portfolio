import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { listDuplicate } from "@/lib/data/repo";

const ALLOWED = ["timeline", "projects", "competencies", "achievements", "collaborations", "futurePlans", "faq"] as const;
type Key = (typeof ALLOWED)[number];
function assertKey(key: string): key is Key {
  return (ALLOWED as readonly string[]).includes(key);
}

export async function POST(_req: NextRequest, { params }: { params: { key: string; id: string } }) {
  const guard = await requireAdmin();
  if (guard) return guard;
  if (!assertKey(params.key)) return NextResponse.json({ error: "알 수 없는 목록입니다." }, { status: 400 });
  const copy = await listDuplicate(params.key, params.id);
  if (!copy) return NextResponse.json({ error: "대상을 찾을 수 없습니다." }, { status: 404 });
  return NextResponse.json(copy);
}
