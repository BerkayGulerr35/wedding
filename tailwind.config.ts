import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ivory:       '#f5f1e8',
        'ivory-deep':'#ede5d2',
        paper:       '#efe7d3',
        cream:       '#faf6ec',
        olive:       '#6b8f71',
        'olive-deep':'#4f6e54',
        'olive-soft':'#8aa890',
        moss:        '#3d5440',
        amber:       '#d9a441',
        'amber-soft':'#e8c277',
        honey:       '#c98a3a',
        'gold-glow': '#f5d68a',
        ink:         '#2a2218',
        'ink-soft':  '#5a4a35',
        'ink-faded': '#8a7656',
        terracotta:  '#b06b4a',
      },
      fontFamily: {
        serif:  ['var(--font-cormorant)', 'Georgia', 'serif'],
        sans:   ['var(--font-inter)', 'system-ui', 'sans-serif'],
        cursive:['var(--font-caveat)', 'cursive'],
      },
    },
  },
  plugins: [],
};

export default config;
