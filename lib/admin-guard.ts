import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "./auth";

/**
 * API 라우트 핸들러 내부에서 로그인 여부를 확인합니다.
 * middleware.ts 가 1차로 화면 접근을 막지만, API 요청은 여기서 한 번 더 확인합니다.
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  const valid = await verifySessionToken(token);
  if (!valid) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  return null;
}
