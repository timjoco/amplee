import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    proxy: {
      '/api': {
        target: 'https://amplee.app',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  esbuild: {
    // Remove console.log and debugger in production builds
    // Keep console.error and console.warn for debugging production issues
    pure: process.env.NODE_ENV === 'production' ? ['console.log'] : [],
    drop: process.env.NODE_ENV === 'production' ? ['debugger'] : [],
  },
});
