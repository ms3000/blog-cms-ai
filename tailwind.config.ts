import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0f1115",
          soft: "#3a3f47",
          muted: "#6b7280",
          faint: "#9aa1ab",
        },
        accent: {
          DEFAULT: "#5b53f0",
          soft: "#eceafd",
        },
        line: "#ececf0",
        surface: "#fafafb",
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "Roboto",
          "Helvetica Neue",
          "Segoe UI",
          "Apple SD Gothic Neo",
          "Noto Sans KR",
          "Malgun Gothic",
          "sans-serif",
        ],
      },
      maxWidth: {
        content: "1180px",
        prose: "720px",
      },
    },
  },
  plugins: [],
};

export default config;
