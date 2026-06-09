import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["Syne", "sans-serif"],
        body: ["DM Sans", "sans-serif"],
      },
      colors: {
        bg: "#04060f",
        surface: "rgba(255,255,255,0.03)",
        accent: "#3b82f6",
        cyan: "#06b6d4",
        violet: "#8b5cf6",
        emerald: "#10b981",
        amber: "#f59e0b",
        rose: "#f43f5e",
      },
    },
  },
  plugins: [],
};
export default config;
