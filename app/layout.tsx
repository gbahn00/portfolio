import type { Metadata } from "next";
import "./globals.css";
import { getContent } from "@/lib/data/repo";
import { GsapProvider } from "@/components/motion/GsapProvider";
import { Header } from "@/components/motion/Header";

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

  return (
    <html lang="ko" data-accent={accent}>
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css" />
      </head>
      <body className="font-kr antialiased">
        <GsapProvider />
        <Header name={content.profile?.name || content.settings?.siteTitle || "Portfolio"} />
        {children}
      </body>
    </html>
  );
}
