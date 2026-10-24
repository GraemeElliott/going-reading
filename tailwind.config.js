const animate = require('tailwindcss-animate');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  safelist: ['dark'],
  prefix: '',

  content: [
    './pages/**/*.{ts,tsx,vue}',
    './components/**/*.{ts,tsx,vue}',
    './app/**/*.{ts,tsx,vue}',
    './src/**/*.{ts,tsx,vue}',
  ],

  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        goingTeal: 'rgb(0, 124, 137)',
        goingYellow: 'rgb(255, 215, 0)',
        goingGreen: 'rgb(67, 160, 71)',
        goingRed: 'rgb(178, 34, 34)',
        gr: {
          bg: 'var(--gr-bg)',
          surface: 'var(--gr-surface)',
          'surface-2': 'var(--gr-surface-2)',
          line: 'var(--gr-line)',
          text: 'var(--gr-text)',
          muted: 'var(--gr-muted)',
          accent: 'var(--gr-accent)',
          'accent-soft': 'var(--gr-accent-soft)',
          'accent-ink': 'var(--gr-accent-ink)',
          star: 'var(--gr-star)',
          'star-off': 'var(--gr-star-off)',
          'danger-text': 'var(--gr-danger-text)',
          'danger-bg': 'var(--gr-danger-bg)',
          'on-danger': 'var(--gr-on-danger)',
          backdrop: 'var(--gr-backdrop)',
          track: 'var(--gr-track)',
          'shelf-read': 'var(--gr-shelf-read)',
          'shelf-want': 'var(--gr-shelf-want)',
          'shelf-dnf': 'var(--gr-shelf-dnf)',
          'status-read': 'var(--gr-status-read)',
          'status-reading': 'var(--gr-status-reading)',
          'status-want': 'var(--gr-status-want)',
          'status-dnf': 'var(--gr-status-dnf)',
          'status-none': 'var(--gr-status-none)',
          hero: 'var(--gr-hero)',
          'on-hero': 'var(--gr-on-hero)',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      fontFamily: {
        heading: ['Newsreader', 'Georgia', 'serif'],
        body: ['Figtree', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'gr-card': 'var(--gr-card-shadow)',
        'gr-modal': 'var(--gr-modal-shadow)',
        'gr-control': 'var(--gr-control-shadow)',
      },
      borderRadius: {
        xl: 'calc(var(--radius) + 4px)',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },
        'collapsible-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-collapsible-content-height)' },
        },
        'collapsible-up': {
          from: { height: 'var(--radix-collapsible-content-height)' },
          to: { height: 0 },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'collapsible-down': 'collapsible-down 0.2s ease-in-out',
        'collapsible-up': 'collapsible-up 0.2s ease-in-out',
      },
    },
  },
  plugins: [animate],
};
