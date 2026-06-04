import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/Zymi-Video-Audio-Call/',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
