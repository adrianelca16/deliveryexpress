/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
       colors: {
        primary: "#2563EB",
        "primary-dark": "#1D4ED8",
        secondary: "#B8860B",
        white: {
          DEFAULT: "#FFFFFF",
          100: "#F8FAFC",
        },
        gray: {
          100: "#F0F0F0",
        },
        dark: {
          DEFAULT: "#111827",
          100: "#181C2E",
        },
        error: "#F14141",
        success: "#2F9B65",
        tertiary: '#D9D9D9',
      },
      fontFamily: {
        quicksand: ["Quicksand-Regular", "sans-serif"],
        "quicksand-bold": ["Quicksand-Bold", "sans-serif"],
        "quicksand-semibold": ["Quicksand-SemiBold", "sans-serif"],
        "quicksand-light": ["Quicksand-Light", "sans-serif"],
        "quicksand-medium": ["Quicksand-Medium", "sans-serif"],
      },
    },
  },
  plugins: [],
}