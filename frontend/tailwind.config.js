/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#18120f",
        sandal: "#f7ead1",
        saffron: "#d97706",
        raga: "#8b3a1c",
      },
      boxShadow: {
        soft: "0 24px 80px rgba(38, 25, 12, 0.12)",
      },
    },
  },
  plugins: [],
};
