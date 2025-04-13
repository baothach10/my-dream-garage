import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  base: './',
  publicDir: './public',
  plugins: [react()],
  build: {
    outDir: './dist',
    rollupOptions: {
      treeshake: false
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@public': resolve(__dirname, './public'),
      '@assets': resolve(__dirname, './public/assets')
    }
  },
  assetsInclude: [
    '**/*.glb',
    '**/*.gltf',
    '**/*.mp3',
    '**/*.MP3',
    '**/*.wav',
    '**/*.png',
    '**/*.jpg',
    '**/*.jpeg',
    '**/*.svg',
    '**/*.webp'
  ]
});
