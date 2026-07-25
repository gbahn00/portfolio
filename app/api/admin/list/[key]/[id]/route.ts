import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { listUpdate, listRemove } from "@/lib/data/repo";

const ALLOWED = ["timeline", "projects", "competencies", "achievements", "collaborations", "futurePlans", "faq"] as const;
type Key = (typeof ALLOWED)[number];
function assertKey(key: string): key is Key {
  return (ALLOWED as readonly string[]).includes(key);
}

export async function PATCH(req: NextRequest, { params }: { params: { key: string; id: string } }) {
  const guard = await requireAdmin();
  if (guard) return guard;
  if (!assertKey(params.key)) return NextResponse.json({ error: "알 수 없는 목록입니다." }, { status: 400 });
  const patch = await req.json();
  const updated = await listUpdate(params.key, params.id, patch);
  if (!updated) return NextResponse.json({ error: "대상을 찾을 수 없습니다." }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { key: string; id: string } }) {
  const guard = await requireAdmin();
  if (guard) return guard;
  if (!assertKey(params.key)) return NextResponse.json({ error: "알 수 없는 목록입니다." }, { status: 400 });
  const ok = await listRemove(params.key, params.id);
  if (!ok) return NextResponse.json({ error: "대상을 찾을 수 없습니다." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
