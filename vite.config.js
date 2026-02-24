import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'manifest.json',
          dest: '.'
        },
        {
          src: 'public/icon.svg',
          dest: '.'
        },
        {
          src: 'public/connector.html',
          dest: '.'
        },
        {
          src: 'public/index.html',
          dest: '.'
        },
        {
          src: 'public/js',
          dest: '.'
        }
      ]
    })
  ],
  base: './', // Use relative paths for GitHub Pages
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        modal: './modal.html'
      }
    }
  },
  server: {
    port: 3000,
    host: 'localhost'
  }
});
