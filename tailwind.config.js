/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'background': '#0d0d1a',
        'card-background': '#1c1c30',
        'sidebar-background': '#111122',
        'text-color': '#f0f0f0',
        'secondary-text-color': '#b0b0c0',
        'border-color': 'rgba(60, 60, 90, 0.5)',
        'primary-color': '#a855f7',
        'primary-hover-color': '#c084fc',
        'success-color': '#4CAF50',
        'warning-color': '#FFC107',
        'danger-color': '#F44336',
        'info-color': '#2196F3',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        'fira-code': ['Fira Code', 'monospace'],
      },
      boxShadow: {
        'dark': '0 10px 30px rgba(0, 0, 0, 0.5)',
        'light': '0 4px 15px rgba(0, 0, 0, 0.3)',
      },
      borderRadius: {
        'xl': '12px',
      },
      spacing: {
        'sm': '1rem',
        'md': '1.5rem',
        'lg': '2rem',
      }
    },
  },
  plugins: [],
}