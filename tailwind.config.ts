import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      // 색상 최종 수정 요청서 §2-3 — 색상값을 여기 직접 적지 않고 전부
      // globals.css의 CSS 변수를 참조한다. 실제 색상 교체는 globals.css의
      // :root 변수 값만 바꾸면 전체 사이트에 반영된다.
      colors: {
        bg: {
          DEFAULT: "var(--color-bg-primary)", // #0A0A0A
          soft: "var(--color-bg-secondary)", // #161616
          surface: "var(--color-bg-secondary)",
        },
        ink: {
          DEFAULT: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          body: "var(--color-text-body)",
          muted: "var(--color-text-muted)",
          disabled: "var(--color-text-disabled)",
        },
        accent: {
          orange: "var(--accent)", // #EB613B
          hover: "var(--color-accent-hover)",
          dark: "var(--color-accent-dark)",
          soft: "var(--color-accent-soft)",
          blue: "var(--color-accent-blue)",
        },
        line: {
          DEFAULT: "var(--color-border)",
          strong: "var(--color-border-strong)",
        },
      },
      fontFamily: {
        // 전체 구조 개편 명세서 §8 — 폰트 이름을 여기 직접 적지 않고 CSS
        // 변수를 참조한다. 실제 폰트 교체는 lib/fonts.ts의 ACTIVE_TITLE_FONT/
        // ACTIVE_BODY_FONT/ACTIVE_POINT_FONT 값만 바꾸면 된다(app/layout.tsx가
        // 그 값을 --font-title/--font-body/--font-point로 주입).
        kr: ["var(--font-body)", "sans-serif"],
        title: ["var(--font-title)", "sans-serif"],
        point: ["var(--font-point)", "sans-serif"],
        en: ["Inter", "Manrope", "sans-serif"],
      },
      maxWidth: {
        content: "1440px",
        page: "1600px",
      },
    },
  },
  plugins: [],
};

export default config;
