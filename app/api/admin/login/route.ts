import { NextRequest, NextResponse } from "next/server";
import { checkPassword, createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: "서버에 ADMIN_PASSWORD 환경변수가 설정되어 있지 않습니다. .env 파일을 확인하세요." },
      { status: 500 }
    );
  }

  if (typeof password !== "string" || !checkPassword(password)) {
    return NextResponse.json({ error: "비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  const token = await createSessionToken();
  const timeoutMinutes = Number(process.env.SESSION_TIMEOUT_MINUTES ?? 30);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: timeoutMinutes * 60,
    path: "/",
  });
  return res;
}
