// tailwind.config.js
module.exports = {
  darkMode: 'class', // or 'media'
  // ... other configurations
  content: [
    // ... your paths
  ],
  theme: {
    extend: {
      colors: {
        // Optional: Define semantic colors using CSS variables for easier theming
        // This is common with libraries like shadcn/ui
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: 'hsl(var(--card))',
        // 'card-foreground': 'hsl(var(--card-foreground))',
        // // ... and so on for primary, secondary, accent, muted, etc.
      },
      // ...
    },
  },
  plugins: [],
};