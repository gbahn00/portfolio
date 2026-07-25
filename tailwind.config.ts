import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0A0A0A",
          soft: "#11100F",
          surface: "#191715",
        },
        ink: {
          DEFAULT: "#F3F0EB",
          secondary: "#C7C1BA",
          body: "#AAA39B",
          muted: "#847D76",
          disabled: "#5D5853",
        },
        accent: {
          orange: "#EB613B",
          hover: "#F27A59",
          dark: "#B8462B",
          soft: "rgba(235, 97, 59, 0.12)",
          blue: "#5B7CFF",
        },
        line: {
          DEFAULT: "#292623",
          strong: "#51423B",
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
