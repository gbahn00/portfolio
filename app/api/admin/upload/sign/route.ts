import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { v4 as uuid } from "uuid";
import path from "node:path";
import { ALLOWED_IMAGE_TYPES, ALLOWED_VIDEO_TYPES } from "@/lib/media-constants";

// ============================================================================
// §77 — 업로드 속도 개선.
// 예전에는 admin/upload/route.ts가 파일 전체를 받아서(브라우저 → Vercel
// 서버리스 함수) 다시 Supabase Storage로 올렸다(서버리스 함수 → Storage).
// 큰 영상일수록 이 "두 번 전송" + Vercel 서버리스 함수의 실행 시간/본문
// 크기 제한이 병목이 됐다.
//
// 이 엔드포인트는 파일 자체를 받지 않는다 — 파일명/타입만 받아서 "이 경로에
// 한 번 업로드할 수 있는" 서명된 URL/토큰만 발급한다(용량이 작고 즉시
// 응답). DATA_MODE=supabase가 아니면(로컬 개발) mode: "local"을 돌려줘서
// 브라우저가 예전 방식(POST /api/admin/upload)으로 그대로 동작하게 한다.
// ============================================================================

function isSupabaseMode() {
  return process.env.DATA_MODE === "supabase";
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard) return guard;

  if (!isSupabaseMode()) {
    return NextResponse.json({ mode: "local" });
  }

  const { filename, contentType } = await req.json().catch(() => ({}));
  const isImage = ALLOWED_IMAGE_TYPES.includes(contentType);
  const isVideo = ALLOWED_VIDEO_TYPES.includes(contentType);

  if (!isImage && !isVideo) {
    return NextResponse.json(
      { error: "지원하지 않는 파일 형식입니다. (JPG, PNG, WebP, AVIF, GIF, MP4, WebM, MOV만 가능)" },
      { status: 400 }
    );
  }

  const ext = path.extname(filename || "") || (isImage ? ".jpg" : ".mp4");
  const safeExt = ext.replace(/[^a-zA-Z0-9.]/g, "");
  const objectPath = `uploads/${uuid()}${safeExt}`;

  try {
    const { createSignedUploadUrlSupabase } = await import("@/lib/data/supabase-store");
    const { signedUrl, token, path: finalPath, publicUrl } = await createSignedUploadUrlSupabase(objectPath);
    return NextResponse.json({
      mode: "supabase",
      signedUrl,
      token,
      path: finalPath,
      publicUrl,
      kind: isVideo ? "video-file" : "image",
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: `업로드 URL 발급에 실패했습니다. (Supabase Storage: ${e?.message || "알 수 없는 오류"})` },
      { status: 500 }
    );
  }
}
