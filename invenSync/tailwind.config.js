/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}","./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
          primary:{
            DEFAULT: "#1A2E35",
            100: "#1A2E351A"
          },
          secondary: {
            DEFAULT: "#86efac",
            100: "#86efac8A",
            200: "#86efac9A"
          },
          black: {
            DEFAULT: "#0F1C20",
            100: "#252A34",
            200: "#3E5359"
          },
          gray: {
            DEFAULT: "#E0E4E8",
            100: "#D9E2E3",
            200: "#B0B7C1"
          },
      },
      fontFamily: {
        pthin: ["Poppins-Thin", "sans-serif"],
        pextralight: ["Poppins-ExtraLight", "sans-serif"],
        plight: ["Poppins-Light", "sans-serif"],
        pregular: ["Poppins-Regular", "sans-serif"],
        pmedium: ["Poppins-Medium", "sans-serif"],
        psemibold: ["Poppins-SemiBold", "sans-serif"],
        pbold: ["Poppins-Bold", "sans-serif"],
        pextrabold: ["Poppins-ExtraBold", "sans-serif"],
        pblack: ["Poppins-Black", "sans-serif"],
      },
    },
  },
  plugins: [],
}