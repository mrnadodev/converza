import type { Config } from "tailwindcss";

// Palette WhatsApp-native utilisée dans les maquettes CONVERZA.
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#008069", // en-têtes
          dark: "#075E54",
          teal: "#00A884",
          green: "#25D366",   // boutons d'action
          leaf: "#12B886",
        },
        chat: {
          bg: "#EFEAE2",       // fond conversation
          out: "#D9FDD3",      // bulle sortante
          tick: "#53BDEB",     // double coche lue
        },
        ink: {
          DEFAULT: "#111B21",
          soft: "#3B4A54",
          muted: "#667781",
          faint: "#8696A0",
        },
        line: "#E9EDEF",
        owed: { text: "#B25E09", bg: "#FEF3E2" }, // "lajan pou resevwa"
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl2: "18px",
      },
    },
  },
  plugins: [],
};

export default config;
