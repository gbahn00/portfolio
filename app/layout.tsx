import type { Metadata } from "next";
import "./globals.css";
import { getContent } from "@/lib/data/repo";
import { GsapProvider } from "@/components/motion/GsapProvider";
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
  // 10라운드 명세서 §3 — 폰트를 lib/fonts.ts 한 곳에서만 관리한다.
  // ACTIVE_FONT 값을 바꾸면 이 stylesheet 링크와 --font-main/--font-title
  // CSS 변수가 함께 바뀌어 사이트 전체에 즉시 반영된다.
  const { main: mainFont, title: titleFont } = getActiveFontConfig();
  const fontStyleVars = { "--font-main": mainFont.family, "--font-title": titleFont.family } as React.CSSProperties;

  return (
    <html lang="ko" data-accent={accent} style={fontStyleVars}>
      <head>
        <link rel="stylesheet" href={mainFont.cssUrl} />
        {titleFont.cssUrl !== mainFont.cssUrl && <link rel="stylesheet" href={titleFont.cssUrl} />}
      </head>
      <body className="font-kr antialiased">
        <GsapProvider />
        <Header name={content.profile?.name || content.settings?.siteTitle || "Portfolio"} />
        {children}
      </body>
    </html>
  );
}
