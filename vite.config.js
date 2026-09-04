import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/Fantasy-AI-safety/',
  publicDir: 'site-public',
  plugins: [react()],
  server: {
    host: true,
    port: 3000
  }
});
