/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          950: "#070a10",
          900: "#0a0e17",
          800: "#0f1420",
          700: "#161d2e"
        },
        gold: {
          400: "#e9c98a",
          500: "#e5b567",
          600: "#c99a4d"
        },
        signal: {
          blue: "#4f8cff",
          green: "#3ecf8e",
          red: "#f0616d"
        },
        ink: {
          100: "#f5f0e6",
          300: "#c7ccd6",
          500: "#8a93a6",
          700: "#565f74"
        }
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"]
      }
    }
  },
  plugins: []
};
