/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/react-app/index.html",
    "./src/react-app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        xs: '475px',
        touch: { raw: '(pointer: coarse)' },
        desktop: { raw: '(pointer: fine)' },
      },
      spacing: {
        touch: '44px', // Apple recommended touch size
      },
      minHeight: {
        touch: '44px', // <- THIS defines minHeight.touch
      },
      minWidth: {
        touch: '44px', // <- THIS defines minWidth.touch
      },
    },
  },
  plugins: [],
};
