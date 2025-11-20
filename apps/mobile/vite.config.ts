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
});
