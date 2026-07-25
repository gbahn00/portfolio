import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { getContent, listAdd } from "@/lib/data/repo";

const ALLOWED = ["timeline", "projects", "competencies", "achievements", "collaborations", "futurePlans", "faq"] as const;
type Key = (typeof ALLOWED)[number];

function assertKey(key: string): key is Key {
  return (ALLOWED as readonly string[]).includes(key);
}

export async function GET(_req: NextRequest, { params }: { params: { key: string } }) {
  const guard = await requireAdmin();
  if (guard) return guard;
  if (!assertKey(params.key)) return NextResponse.json({ error: "알 수 없는 목록입니다." }, { status: 400 });
  const content = await getContent();
  return NextResponse.json((content as any)[params.key]);
}

export async function POST(req: NextRequest, { params }: { params: { key: string } }) {
  const guard = await requireAdmin();
  if (guard) return guard;
  if (!assertKey(params.key)) return NextResponse.json({ error: "알 수 없는 목록입니다." }, { status: 400 });
  const body = await req.json();
  const created = await listAdd(params.key, body);
  return NextResponse.json(created);
}
