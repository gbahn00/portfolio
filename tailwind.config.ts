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
        kr: ["Pretendard", "SUIT", "sans-serif"],
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
