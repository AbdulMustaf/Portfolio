/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        netflix: {
          red: '#e50914',
          dark: '#141414',
          'dark-2': '#181818',
          'dark-3': '#2f2f2f',
        },
        text: {
          primary: '#e6e6e6',
          secondary: '#999999',
        },
      },
      fontFamily: {
        netflix: ['"Netflix Sans"', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      },
      screens: {
        xs: '480px',
      },
    },
  },
  plugins: [],
}
