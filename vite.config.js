import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Project root is the current directory where vite.config.js is
  root: '.', 
  // Directory to serve static assets from during development
  publicDir: 'public',
  build: {
    // Output to 'dist' directory at the project root
    outDir: 'dist',
    // Clear the output directory on build
    emptyOutDir: true,
    rollupOptions: {
      // Explicitly specify index.html as the entry point, relative to the project root
      input: 'public/index.html',
    },
  },
});
