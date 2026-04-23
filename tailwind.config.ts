import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Ops console palette — matches the PDF (dark slate + teal accent)
        bg: {
          base: "#0a1014",
          panel: "#111a21",
          card: "#17232c",
          elevated: "#1d2c37",
        },
        line: "#233543",
        ink: {
          primary: "#e8f0f3",
          secondary: "#9eb0bc",
          muted: "#5f7684",
        },
        accent: {
          DEFAULT: "#3ec1a6", // teal
          soft: "#2a8a78",
          glow: "rgba(62,193,166,0.18)",
        },
        danger: "#ef5e5e",
        warn: "#f5a524",
        good: "#3ec1a6",
        info: "#5aa9e6",
        vip: "#d4af37",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
        serif: ["ui-serif", "Georgia", "Cambria", "Times New Roman", "serif"],
      },
      boxShadow: {
        panel: "0 1px 0 rgba(255,255,255,0.03) inset, 0 0 0 1px rgba(255,255,255,0.02)",
        glow: "0 0 0 1px rgba(62,193,166,0.35), 0 0 20px rgba(62,193,166,0.12)",
      },
      animation: {
        "pulse-slow": "pulse 2.2s cubic-bezier(0.4,0,0.6,1) infinite",
        "dash": "dash 1.2s linear infinite",
        "rise": "rise 0.35s ease-out",
        "blink": "blink 1.2s ease-in-out infinite",
      },
      keyframes: {
        dash: {
          "0%": { strokeDashoffset: "40" },
          "100%": { strokeDashoffset: "0" },
        },
        rise: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        blink: {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
