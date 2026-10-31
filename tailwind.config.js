/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: 'var(--color-primary-tint)',
          100: 'var(--color-primary-line)',
          500: 'var(--color-primary)',
          600: 'var(--color-primary-hover)',
          on: 'var(--color-on-primary)',
        },
        bg: {
          main: 'var(--bg-main)',
          card: 'var(--bg-card)',
        },
        ink: {
          DEFAULT: 'var(--text-ink)',
          muted: 'var(--text-muted)',
        },
        line: 'var(--border-line)',
        success: {
          icon: 'var(--color-success-icon)',
          fill: 'var(--color-success-fill)',
          on: 'var(--color-on-success)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          on: 'var(--color-on-warning)',
        },
        info: {
          DEFAULT: 'var(--color-info)',
          bg: 'var(--color-info-bg)',
        },
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'Bricolage Grotesque', 'Manrope', 'system-ui', 'sans-serif'],
        sans: ['var(--font-sans)', 'Figtree', 'Inter', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        card: '14px',
        element: '10px',
      },
      boxShadow: {
        card: '0 4px 20px rgba(0, 0, 0, 0.03)',
        floating: '0 4px 12px rgba(0, 0, 0, 0.15)',
      },
    },
  },
  plugins: [],
};
