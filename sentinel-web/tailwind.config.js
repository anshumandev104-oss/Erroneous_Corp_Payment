/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'bank-blue': '#0052FF',
        'bank-navy': '#0F172A',
        'bank-gray': '#F8FAFC',
      },
    },
  },
  plugins: [],
};
