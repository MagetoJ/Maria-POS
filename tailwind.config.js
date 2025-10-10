/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/react-app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
        'touch': { 'raw': '(pointer: coarse)' },
        'desktop': { 'raw': '(pointer: fine)' },
      },
      spacing: {
        'touch': '44px', // Apple's recommended touch target size
      },
      minHeight: {
        'touch': '44px',
      },
      minWidth: {
        'touch': '44px',
      }
    },
  },
  plugins: [],
};
