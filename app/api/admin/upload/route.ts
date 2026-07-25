import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import fs from "node:fs/promises";
import path from "node:path";
import { v4 as uuid } from "uuid";

// ============================================================================
// 이미지/영상 업로드
// local 모드: public/uploads 에 저장하고 "/uploads/파일명" 형태의 경로를 반환합니다.
// supabase 모드로 전환하면 이 라우트를 Supabase Storage 업로드로 교체하세요.
// (Storage 버킷은 supabase/schema.sql 에 이미 정의되어 있습니다: portfolio-media)
// ============================================================================

const ALLOWED_IMAGE = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/svg+xml"];
const ALLOWED_VIDEO = ["video/mp4", "video/webm", "video/quicktime"];
const MAX_IMAGE_BYTES = 20 * 1024 * 1024; // 20MB
const MAX_VIDEO_BYTES = 300 * 1024 * 1024; // 300MB

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });

  const isImage = ALLOWED_IMAGE.includes(file.type);
  const isVideo = ALLOWED_VIDEO.includes(file.type);

  if (!isImage && !isVideo) {
    return NextResponse.json(
      { error: "지원하지 않는 파일 형식입니다. (JPG, PNG, WebP, AVIF, MP4, WebM, MOV만 가능)" },
      { status: 400 }
    );
  }

  const maxBytes = isImage ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
  if (file.size > maxBytes) {
    return NextResponse.json(
      { error: `파일 용량이 너무 큽니다. (최대 ${Math.round(maxBytes / 1024 / 1024)}MB)` },
      { status: 400 }
    );
  }

  const ext = path.extname(file.name) || (isImage ? ".jpg" : ".mp4");
  const safeExt = ext.replace(/[^a-zA-Z0-9.]/g, "");
  const filename = `${uuid()}${safeExt}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });

  const bytes = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(uploadDir, filename), bytes);

  return NextResponse.json({
    url: `/uploads/${filename}`,
    kind: isVideo ? "video-file" : "image",
    alt: "",
  });
}
