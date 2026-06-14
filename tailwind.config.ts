import type { Config } from "tailwindcss";

// Tokens mirror studio-design-system-v2.md: light/white surfaces, single teal
// accent, dark count badges, restrained status colors, one sans.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "app-bg": "#FFFFFF",
        surface: "#FFFFFF",
        "surface-2": "#F6F8F7",
        border: "#E8EBEA",
        ink: "#1B2522",
        muted: "#6B736F",
        faint: "#9CA39E",
        accent: "#0E8A7C",
        "accent-soft": "#E6F4F1",
        badge: "#1E3A36",
        green: "#15803D",
        "green-bg": "#DCFCE7",
        amber: "#D97706",
        "amber-bg": "#FEF3C7",
        red: "#DC2626",
        "red-bg": "#FEE2E2",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontSize: {
        eyebrow: ["11px", { lineHeight: "1.2", letterSpacing: "0.06em" }],
        meta: ["13px", { lineHeight: "1.4" }],
        body: ["14px", { lineHeight: "1.45" }],
        "card-title": ["16px", { lineHeight: "1.3" }],
        title: ["26px", { lineHeight: "1.15" }],
      },
      borderRadius: {
        card: "12px",
      },
      boxShadow: {
        hover: "0 1px 3px rgba(27, 37, 34, 0.08), 0 1px 2px rgba(27, 37, 34, 0.04)",
        overlay: "0 8px 24px rgba(27, 37, 34, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
