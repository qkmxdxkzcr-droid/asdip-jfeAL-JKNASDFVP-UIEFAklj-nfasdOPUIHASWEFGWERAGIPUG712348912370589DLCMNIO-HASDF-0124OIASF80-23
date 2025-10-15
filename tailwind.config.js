/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./Pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        panel: 'var(--panel)',
        card: 'var(--card)',
        border: 'var(--border)',
        track: 'var(--track)',
        text: 'var(--text)',
        'text-weak': 'var(--text-weak)',
        'text-muted': 'var(--text-muted)',
        accent: {
          25: 'var(--accent-25)', 
          200: 'var(--accent-200)', 
          600: 'var(--accent-600)',
        },
        ok: 'var(--ok)', 
        warn: 'var(--warn)', 
        danger: 'var(--danger)', 
        info: 'var(--info)',
      },
      borderRadius: { 
        md: 'var(--r-md)', 
        lg: 'var(--r-lg)', 
        xl: 'var(--r-xl)' 
      },
      boxShadow: { 
        soft: 'var(--shadow)' 
      },
      spacing: { 
        's2': 'var(--s-2)', 
        's3': 'var(--s-3)', 
        's4': 'var(--s-4)', 
        's5': 'var(--s-5)', 
        's6': 'var(--s-6)' 
      }
    },
  },
  plugins: [],
}
