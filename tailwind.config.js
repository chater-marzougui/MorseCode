/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'morse-bg': '#f3f4f6', // Light gray background
        'morse-primary': '#1f2937', // Dark gray/black for contrast
        'morse-accent': '#3b82f6', // Blue accent
      }
    },
  },
  plugins: [],
}
