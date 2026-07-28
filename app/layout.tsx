import type { Metadata } from "next";
import "./globals.css";
import { getContent } from "@/lib/data/repo";
import { GsapProvider } from "@/components/motion/GsapProvider";
import { DownloadGuard } from "@/components/motion/DownloadGuard";
import { Header } from "@/components/motion/Header";
import { getActiveFontConfig } from "@/lib/fonts";

// §148 — "Lighthouse Best Practices/SEO 점수를 높여달라"는 요청.
// metadataBase가 없으면 상대 경로 OG 이미지 등을 Next가 절대 URL로
// 만들지 못해 경고가 뜬다. 실제 배포 도메인은 Vercel 환경변수
// NEXT_PUBLIC_SITE_URL로 설정하면 되고, 아직 없으면 안전한 기본값으로
// 대체한다(빌드가 깨지지 않게).
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getContent();
  return {
    metadataBase: new URL(SITE_URL),
    title: content.settings?.siteTitle || "영상 크리에이터 포트폴리오",
    description: content.profile?.introShort || "",
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const content = await getContent();
  const accent = content.settings?.accentColor === "blue" ? "blue" : "orange";
  // 전체 구조 개편 명세서 §8 — 폰트를 lib/fonts.ts 한 곳에서만 관리한다.
  // ACTIVE_TITLE_FONT/ACTIVE_BODY_FONT/ACTIVE_POINT_FONT 값을 바꾸면
  // --font-title/--font-body/--font-point CSS 변수가 함께 바뀌어 사이트
  // 전체에 즉시 반영된다. --font-main은 이전 코드와의 호환을 위해 본문
  // 폰트와 같은 값으로 유지한다.
  // §133 — 이제 관리자 화면(사이트 설정 > 타이포그래피)에서 고른 값이
  // 있으면 그 값을 우선 쓴다(getActiveFontConfig 안에서 유효성 검사 후
  // 없으면 기존 코드 기본값으로 안전하게 되돌아간다).
  const typography = content.settings?.typography;
  const { title: titleFont, body: bodyFont, point: pointFont, cssUrls } = getActiveFontConfig(
    typography?.titleFont,
    typography?.bodyFont
  );
  const fontStyleVars: Record<string, string> = {
    "--font-main": bodyFont.family,
    "--font-title": titleFont.family,
    "--font-body": bodyFont.family,
    "--font-point": pointFont.family,
  };
  // §133 — 자간/행간/줄바꿈은 관리자가 실제로 값을 넣었을 때만 CSS
  // 변수를 주입한다. 아예 값이 없으면 변수 자체를 넣지 않아, globals.css
  // 각 클래스(.hero-title, .body 등)에 이미 있던 고유 기본값이 그대로
  // 유지된다(제목 크기별로 미세하게 다르게 잡아둔 자간·행간이 관리자가
  // 손대기 전까지는 그대로 보존된다는 뜻).
  if (typography?.titleLetterSpacing !== undefined) fontStyleVars["--title-letter-spacing"] = `${typography.titleLetterSpacing}em`;
  if (typography?.titleLineHeight !== undefined) fontStyleVars["--title-line-height"] = `${typography.titleLineHeight}`;
  if (typography?.titleWordBreak) fontStyleVars["--title-word-break"] = typography.titleWordBreak;
  if (typography?.bodyLetterSpacing !== undefined) fontStyleVars["--body-letter-spacing"] = `${typography.bodyLetterSpacing}em`;
  if (typography?.bodyLineHeight !== undefined) fontStyleVars["--body-line-height"] = `${typography.bodyLineHeight}`;
  if (typography?.bodyWordBreak) fontStyleVars["--body-word-break"] = typography.bodyWordBreak;

  return (
    <html lang="ko" data-accent={accent} style={fontStyleVars as React.CSSProperties}>
      <head>
        {/* §148 — 폰트 CSS를 cdn.jsdelivr.net에서 불러오는데, 브라우저가
            <link rel="stylesheet">를 발견한 뒤에야 그 도메인에 연결(DNS
            조회+TLS 핸드셰이크)을 시작한다. preconnect로 미리 연결을 열어
            두면 실제 요청이 그만큼 더 빨리 끝난다 — 폰트가 적용되기까지의
            지연(그리고 그동안의 텍스트 깜빡임/레이아웃 흔들림)이 줄어든다. */}
        {cssUrls.length > 0 && (
          <>
            <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
            <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />
          </>
        )}
        {cssUrls.map((url) => (
          <link key={url} rel="stylesheet" href={url} />
        ))}
      </head>
      <body className="font-kr antialiased">
        <GsapProvider />
        <DownloadGuard />
        <Header />
        {children}
      </body>
    </html>
  );
}
