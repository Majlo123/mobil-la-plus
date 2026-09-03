import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1.25rem", lg: "2rem" },
      screens: { "2xl": "1380px" },
    },
    extend: {
      colors: {
        /**
         * Brend paleta Mobil Plus LA — uzorkovana sa logotipa i flajera:
         * azurno plava na crnoj podlozi, sa amber akcentom (na flajeru se
         * koristi za „SPAŠAVANJE PODATAKA").
         */
        brand: {
          DEFAULT: "#1477E8",
          600: "#0F5FC4",
          500: "#2E8BFF",
          400: "#55A4FF",
          50: "#E8F2FE",
        },
        /** Podloge — sajt je dark-first, kao i sam brend. */
        ink: {
          DEFAULT: "#05070A", // pozadina strane
          800: "#0D1117", // kartice i sekcije
          700: "#141A22", // izdignute površine (hover, dropdown)
          600: "#1E2732", // ivice na tamnom
        },
        cream: "#F7FAFC", // tekst na tamnom / svetle sekcije
        accent: {
          DEFAULT: "#F5C518",
          600: "#D9AC0B",
          400: "#FFD84D",
        },
        border: "#1E2732",
        input: "#1E2732",
        ring: "#2E8BFF",
        background: "#05070A",
        foreground: "#F7FAFC",
        muted: { DEFAULT: "#141A22", foreground: "#9AA7B8" },
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "1rem",
        xl: "1.5rem",
        "2xl": "2rem",
      },
      boxShadow: {
        // Na tamnoj podlozi senka ne radi — dubinu nosi suptilan plavi glow.
        soft: "0 2px 8px -2px rgb(0 0 0 / 0.6), 0 8px 24px -8px rgb(0 0 0 / 0.5)",
        card: "0 1px 3px rgb(0 0 0 / 0.5), 0 12px 32px -12px rgb(0 0 0 / 0.6)",
        lift: "0 8px 16px -8px rgb(0 0 0 / 0.5), 0 24px 48px -16px rgb(20 119 232 / 0.35)",
        glow: "0 0 0 1px rgb(46 139 255 / 0.25), 0 0 24px -6px rgb(46 139 255 / 0.45)",
      },
      backgroundImage: {
        "grid-faint":
          "linear-gradient(to right, rgb(247 250 252 / 0.045) 1px, transparent 1px), linear-gradient(to bottom, rgb(247 250 252 / 0.045) 1px, transparent 1px)",
        // Odjek štampanih ploča sa logotipa — koristi se kao suptilan sloj u hero-u.
        "circuit-glow":
          "radial-gradient(60% 60% at 50% 0%, rgb(20 119 232 / 0.22) 0%, transparent 70%)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.16,1,0.3,1) both",
        marquee: "marquee 28s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
