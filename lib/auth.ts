// ============================================================================
// 관리자 인증
// local 모드: ADMIN_PASSWORD 와 대조 후, 서명된 세션 쿠키 발급
// supabase 모드: Supabase Auth(email/password)로 대체 가능 (lib/supabase 참고)
// 쿠키는 SESSION_TIMEOUT_MINUTES 이후 자동 만료됩니다.
//
// middleware.ts(Edge 런타임)에서도 사용하므로 Node.js 전용 crypto 모듈 대신
// 표준 Web Crypto API(globalThis.crypto.subtle)를 사용합니다.
// ============================================================================

const COOKIE_NAME = "portfolio_admin_session";

function secret() {
  return process.env.SESSION_SECRET ?? "insecure-default-secret-change-me";
}

function toBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const bin = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/").padEnd(str.length + ((4 - (str.length % 4)) % 4), "=");
  const bin = atob(padded);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function hmacKey() {
  const enc = new TextEncoder();
  return crypto.subtle.importKey("raw", enc.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

async function sign(payload: string): Promise<string> {
  const key = await hmacKey();
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return toBase64Url(sig);
}

export async function createSessionToken(): Promise<string> {
  const timeoutMinutes = Number(process.env.SESSION_TIMEOUT_MINUTES ?? 30);
  const exp = Date.now() + timeoutMinutes * 60 * 1000;
  const payload = JSON.stringify({ exp });
  const encoded = toBase64Url(new TextEncoder().encode(payload));
  const sig = await sign(encoded);
  return `${encoded}.${sig}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const [encoded, sig] = token.split(".");
  if (!encoded || !sig) return false;
  const expectedSig = await sign(encoded);
  if (sig.length !== expectedSig.length || sig !== expectedSig) return false;
  try {
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(encoded)));
    return typeof payload.exp === "number" && Date.now() < payload.exp;
  } catch {
    return false;
  }
}

export function checkPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD ?? "";
  if (!expected) return false;
  return input === expected;
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
