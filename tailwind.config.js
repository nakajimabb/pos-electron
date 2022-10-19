/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './src/index.html'],
  theme: {
    extend: {},
  },
  plugins: [],
  // safelist: [
  //   {
  //     pattern: /^(bg|text|hover|ring|m|p|grid|gap|border|w|h|m|mx|my|p|px|py|ring|flex|max)-/,
  //     variants: ['sm', 'md', 'lg'],
  //   },
  // ],
};
