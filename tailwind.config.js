/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          base: 'var(--color-surface-base)',
          panel: 'var(--color-surface-panel)',
          card: 'var(--color-surface-card)',
          hover: 'var(--color-surface-hover)',
          border: 'var(--color-surface-border)',
          borderHover: 'var(--color-surface-borderHover)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          hover: 'var(--color-accentHover)',
          subtle: 'var(--color-accentSubtle)',
          foreground: '#ffffff',
        },
        foreground: {
          DEFAULT: 'var(--color-foreground)',
          base: 'var(--color-foreground)',
          muted: 'var(--color-foregroundMuted)',
          subtle: 'var(--color-foregroundSubtle)',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '0.75rem',
        sm: '0.5rem',
        lg: '0.875rem',
        xl: '1rem',
        '2xl': '1.25rem',
      },
      boxShadow: {
        subtle: '0 1px 2px rgba(0, 0, 0, 0.04)',
        card: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)',
        popover: '0 4px 12px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
}