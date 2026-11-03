/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite builds the app; Vitest (configured under `test`) runs the automated tests.
export default defineConfig({
  plugins: [react()],
  // Recharts makes the bundle ~590 kB (≈170 kB gzipped) – fine for this app.
  build: { chunkSizeWarningLimit: 800 },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: false,
  },
});
