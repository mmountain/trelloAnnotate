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
      },
      output: {
        entryFileNames: `assets/[name]-[hash].js`,
        chunkFileNames: `assets/[name]-[hash].js`,
        assetFileNames: `assets/[name]-[hash].[ext]`,
        // Remove 'crossorigin' attribute from generated script tags
        // This can resolve 'cross-origin read blocking' errors
        // especially on GitHub Pages when Content-Type sniffing is an issue.
        // It might be added by default for modules, so we're trying to counteract it.
        sanitizeFileName: (fileName) => {
          if (fileName.endsWith('.js') && fileName.includes('modal')) {
            return fileName; // We don't want to change the filename, but remove 'crossorigin' later.
          }
          return fileName;
        }
      }
    }
  },
  server: {
    port: 3000,
    host: 'localhost'
  }
});
