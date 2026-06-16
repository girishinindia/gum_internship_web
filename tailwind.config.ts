import type { Config } from 'tailwindcss';

/**
 * GI Internship — modern light theme.
 * Brand = sky/cyan (matches the email + admin portal: #0284c7 / #0ea5e9),
 * neutrals on the slate ramp for a cleaner, contemporary feel.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { 50: '#f0f9ff', 100: '#e0f2fe', 200: '#bae6fd', 300: '#7dd3fc', 400: '#38bdf8', 500: '#0ea5e9', 600: '#0284c7', 700: '#0369a1', 800: '#075985', 900: '#0c4a6e' },
        success: { 50: '#ecfdf5', 100: '#d1fae5', 300: '#6ee7b7', 500: '#10b981', 600: '#059669', 700: '#047857', 900: '#064e3b' },
        warning: { 50: '#fffbeb', 100: '#fef3c7', 300: '#fcd34d', 500: '#f59e0b', 600: '#d97706', 700: '#b45309', 900: '#78350f' },
        danger: { 50: '#fef2f2', 100: '#fee2e2', 300: '#fca5a5', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c', 900: '#7f1d1d' },
        neutral: { 0: '#ffffff', 50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1', 400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155', 800: '#1e293b', 900: '#0f172a' },
      },
      fontFamily: {
        heading: ['Poppins', 'Noto Sans Devanagari', 'Noto Sans Gujarati', 'system-ui', 'sans-serif'],
        body: ['Inter', 'Noto Sans', 'Noto Sans Devanagari', 'Noto Sans Gujarati', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        display: ['3rem', { lineHeight: '3.25rem', fontWeight: '700', letterSpacing: '-0.02em' }],
        h1: ['2rem', { lineHeight: '2.5rem', fontWeight: '700', letterSpacing: '-0.015em' }],
        h2: ['1.5rem', { lineHeight: '2rem', fontWeight: '600', letterSpacing: '-0.01em' }],
        h3: ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],
        'body-lg': ['1.125rem', { lineHeight: '1.8rem' }],
        body: ['1rem', { lineHeight: '1.6rem' }],
        'body-sm': ['0.875rem', { lineHeight: '1.35rem' }],
        caption: ['0.75rem', { lineHeight: '1rem', fontWeight: '500' }],
      },
      borderRadius: { sm: '6px', md: '10px', lg: '14px', xl: '20px', '2xl': '28px' },
      boxShadow: {
        soft: '0 1px 2px rgba(15,23,42,.04), 0 4px 16px rgba(15,23,42,.06)',
        card: '0 2px 4px rgba(15,23,42,.04), 0 8px 24px rgba(15,23,42,.06)',
        lift: '0 8px 16px rgba(2,132,199,.10), 0 16px 40px rgba(15,23,42,.10)',
        glow: '0 8px 24px rgba(14,165,233,.28)',
      },
      screens: { md: '768px', xl: '1280px' },
      maxWidth: { container: '1400px' },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg,#0284c7 0%,#0ea5e9 50%,#38bdf8 100%)',
      },
    },
  },
  plugins: [],
};
export default config;
