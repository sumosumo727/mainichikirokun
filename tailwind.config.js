/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      spacing: {
        '25': '6.25rem',  // 100px (25 * 0.25rem)
        '30': '7.5rem',   // 120px (30 * 0.25rem)
      },
    },
  },
  plugins: [],
};