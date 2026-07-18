import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17211b",
        parchment: "#f4efe3",
        moss: "#315b45",
        gold: "#d6a84b",
      },
      boxShadow: {
        panel: "0 24px 80px rgb(16 33 24 / 0.25)",
      },
    },
  },
  plugins: [],
} satisfies Config;
