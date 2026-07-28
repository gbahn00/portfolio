import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { getContent, updateSection } from "@/lib/data/repo";
import { SiteContent } from "@/lib/types";

const ALLOWED = [
  "settings", "profile", "hero", "philosophy", "growth", "projectsSection", "ai", "contributions", "fitness", "closing",
] as const;

export async function GET(_req: NextRequest, { params }: { params: { key: string } }) {
  const guard = await requireAdmin();
  if (guard) return guard;
  const content = await getContent();
  const key = params.key as keyof SiteContent;
  if (!ALLOWED.includes(key as any)) return NextResponse.json({ error: "알 수 없는 섹션입니다." }, { status: 400 });
  return NextResponse.json(content[key]);
}

export async function PATCH(req: NextRequest, { params }: { params: { key: string } }) {
  const guard = await requireAdmin();
  if (guard) return guard;
  const key = params.key as keyof SiteContent;
  if (!ALLOWED.includes(key as any)) return NextResponse.json({ error: "알 수 없는 섹션입니다." }, { status: 400 });
  const patch = await req.json();
  const updated = await updateSection(key, patch);
  return NextResponse.json(updated);
}
