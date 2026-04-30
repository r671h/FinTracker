/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#1D9E75',
          'green-bg': '#E1F5EE',
          'green-text': '#085041',
          blue: '#378ADD',
          'blue-bg': '#E6F1FB',
          purple: '#7F77DD',
          'purple-bg': '#EEEDFE',
          red: '#D85A30',
          'red-bg': '#FAECE7',
          amber: '#EF9F27',
          'amber-bg': '#FAEEDA',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
