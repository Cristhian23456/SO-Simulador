/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    // El motor (src/core) es puro TypeScript: se prueba en Node, sin DOM.
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
