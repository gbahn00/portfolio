import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import fs from "node:fs/promises";
import path from "node:path";
import { v4 as uuid } from "uuid";
import { ALLOWED_IMAGE_TYPES, ALLOWED_VIDEO_TYPES, MAX_IMAGE_BYTES, MAX_VIDEO_BYTES } from "@/lib/media-constants";

// ============================================================================
// 이미지/영상 업로드
// local 모드: public/uploads 에 저장하고 "/uploads/파일명" 형태의 경로를 반환합니다.
//
// DATA_MODE=supabase 일 때는 Supabase Storage(portfolio-media 버킷)에 업로드한다.
// Vercel의 프로덕션 파일시스템은 읽기 전용이라 public/uploads에 fs.writeFile을
// 하면 그 자리에서 실패한다 — 그래서 사진/영상을 새로 첨부하거나 교체하면
// 배포된 사이트에서는 반영되지 않았다(로컬 개발 서버는 파일시스템이 쓰기
// 가능해서 정상 동작하는 것처럼 보였다). DATA_MODE로 분기해 실제 저장소가
// 어디인지에 맞게 업로드 경로를 바꾼다.
// ============================================================================

function isSupabaseMode() {
  return process.env.DATA_MODE === "supabase";
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });

  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

  if (!isImage && !isVideo) {
    return NextResponse.json(
      { error: "지원하지 않는 파일 형식입니다. (JPG, PNG, WebP, AVIF, GIF, MP4, WebM, MOV만 가능)" },
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
  const bytes = Buffer.from(await file.arrayBuffer());

  let url: string;
  if (isSupabaseMode()) {
    const { uploadMediaSupabase } = await import("@/lib/data/supabase-store");
    try {
      url = await uploadMediaSupabase(filename, bytes, file.type);
    } catch (e: any) {
      return NextResponse.json(
        { error: `업로드에 실패했습니다. (Supabase Storage: ${e?.message || "알 수 없는 오류"})` },
        { status: 500 }
      );
    }
  } else {
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(path.join(uploadDir, filename), bytes);
    url = `/uploads/${filename}`;
  }

  return NextResponse.json({
    url,
    kind: isVideo ? "video-file" : "image",
    alt: "",
  });
}
