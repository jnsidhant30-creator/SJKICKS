import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    env: {
      VITE_SUPABASE_ANON_KEY: 'PASTE_YOUR_SUPABASE_PUBLISHABLE_KEY_HERE',
    },
  },
});

