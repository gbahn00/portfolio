import type { Metadata } from "next";
import "./globals.css";
import { getContent } from "@/lib/data/repo";
import { GsapProvider } from "@/components/motion/GsapProvider";
import { DownloadGuard } from "@/components/motion/DownloadGuard";
import { Header } from "@/components/motion/Header";
import { getActiveFontConfig } from "@/lib/fonts";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getContent();
  return {
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
  const { title: titleFont, body: bodyFont, point: pointFont, cssUrls } = getActiveFontConfig();
  const fontStyleVars = {
    "--font-main": bodyFont.family,
    "--font-title": titleFont.family,
    "--font-body": bodyFont.family,
    "--font-point": pointFont.family,
  } as React.CSSProperties;

  return (
    <html lang="ko" data-accent={accent} style={fontStyleVars}>
      <head>
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
