import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { writeFileSync } from 'fs';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'generate-redirects',
      closeBundle() {
        // Create _redirects file for Netlify
        writeFileSync('dist/_redirects', '/* /index.html 200');
      }
    }
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
