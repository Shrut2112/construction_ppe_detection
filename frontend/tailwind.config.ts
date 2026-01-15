// tailwind.config.ts
const config = {
  theme: {
    extend: {
      colors: {
        tech: {
          obsidian: '#050505',   // Solid, deep black for base
          lead: '#1A1A1B',       // Dark grey for card surfaces
          steel: '#2D2D2E',      // Lighter grey for borders and strokes
          neon: '#00FF41',       // Classic "Terminal Green" for compliance
          warning: '#FFB800',    // Industrial amber for cautions
          alert: '#FF3131',      // Pure red for violations
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'], // High-tech data feel
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    }
  }
}
export default config;