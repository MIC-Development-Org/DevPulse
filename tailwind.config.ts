import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./content/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "rgb(var(--background-rgb) / <alpha-value>)",
        foreground: "rgb(var(--foreground-rgb) / <alpha-value>)",
        ink: {
          950: "#06070A",
          900: "#0A0B10",
          850: "#0E1017",
          800: "#12141D",
          700: "#181B26",
          600: "#222634",
          500: "#323749",
          400: "#4B5268",
          300: "#6F7791",
          200: "#9DA5BE",
          100: "#D3D7E3",
          50: "#F1F3F8",
        },
        mint: {
          DEFAULT: "#5EEAD4",
          50: "#F0FDF4",
          100: "#CCFBF1",
          200: "#99F6E4",
          300: "#5EEAD4",
          400: "#2DD4BF",
          500: "#14B8A6",
          600: "#0D9488",
          700: "#0F766E",
          800: "#115E59",
          900: "#134E4A",
          glow: "rgba(94, 234, 212, 0.25)",
        },
        track: {
          0: {
            DEFAULT: "#5EEAD4",
            glow: "rgba(94, 234, 212, 0.3)",
            bg: "rgba(94, 234, 212, 0.08)",
            border: "rgba(94, 234, 212, 0.25)",
          },
          1: {
            DEFAULT: "#8AB4FF",
            glow: "rgba(138, 180, 255, 0.3)",
            bg: "rgba(138, 180, 255, 0.08)",
            border: "rgba(138, 180, 255, 0.25)",
          },
          2: {
            DEFAULT: "#F5B14C",
            glow: "rgba(245, 177, 76, 0.3)",
            bg: "rgba(245, 177, 76, 0.08)",
            border: "rgba(245, 177, 76, 0.25)",
          },
        },
        card: {
          DEFAULT: "rgb(var(--card-rgb) / <alpha-value>)",
          foreground: "rgb(var(--card-foreground-rgb) / <alpha-value>)",
          subtle: "rgb(var(--card-subtle-rgb) / <alpha-value>)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
      },
      fontFamily: {
        display: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      animation: {
        "pulse-subtle": "pulseSubtle 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float-slow": "floatSlow 8s ease-in-out infinite",
        "glow-fade": "glowFade 4s ease-in-out infinite alternate",
        "aurora": "aurora 15s ease infinite alternate",
      },
      keyframes: {
        pulseSubtle: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.85", transform: "scale(1.02)" },
        },
        floatSlow: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        glowFade: {
          "0%": { filter: "drop-shadow(0 0 12px rgba(94, 234, 212, 0.2))" },
          "100%": { filter: "drop-shadow(0 0 24px rgba(94, 234, 212, 0.5))" },
        },
        aurora: {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
      },
    },
  },
  plugins: [],
};

export default config;

