export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Bleu impérial foncé
        imperial: {
          50: "#e8eaf6",
          100: "#c5cae9",
          200: "#9fa8da",
          300: "#7986cb",
          400: "#5c6bc0",
          500: "#3949ab",
          600: "#1a237e", // Couleur principale
          700: "#151c6b",
          800: "#101558",
          900: "#0a0e45",
        },
        // Vert émeraude
        emerald: {
          50: "#e8f5e9",
          100: "#c8e6c9",
          200: "#a5d6a7",
          300: "#81c784",
          400: "#66bb6a",
          500: "#4caf50",
          600: "#2e7d32", // Couleur principale
          700: "#276128",
          800: "#1b5e20",
          900: "#114114",
        },
      },
      fontFamily: {
        // Police élégante et distinctive
        display: ["'Playfair Display'", "Georgia", "serif"],
        body: ["'DM Sans'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
