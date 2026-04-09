/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
        body: ['"Trebuchet MS"', '"Segoe UI"', 'sans-serif'],
      },
      boxShadow: {
        panel: '0 20px 45px rgba(22, 33, 62, 0.12)',
      },
      colors: {
        ink: '#14213d',
        sand: '#f4efe6',
        ember: '#f97316',
        pine: '#2b6a57',
        sky: '#dbeafe',
      },
    },
  },
  plugins: [],
}
