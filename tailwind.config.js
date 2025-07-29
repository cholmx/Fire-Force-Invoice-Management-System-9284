/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          start: '#DC2725',
          end: '#E74E11',
        },
        gradient: {
          start: '#DC2725',
          end: '#E74E11',
        }
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(to right, #DC2725, #E74E11)',
        'brand-gradient-hover': 'linear-gradient(to right, #C41E1D, #D24410)',
      },
      fontFamily: {
        'sans': ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        'title': ['"Inter Tight"', 'Inter', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [],
}