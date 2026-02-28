import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        district: {
          red: "#C8102E",
          dark: "#1F2937",
          light: "#F9FAFB",
          border: "#E5E7EB"
        }
      },
      boxShadow: {
        card: "0 8px 24px rgba(15, 23, 42, 0.08)"
      },
      borderRadius: {
        mdx: "0.75rem"
      }
    }
  },
  plugins: []
};

export default config;
