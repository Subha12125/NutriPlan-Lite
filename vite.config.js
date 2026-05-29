import { defineConfig } from 'vite';

export default defineConfig({
  root: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    cssCodeSplit: false, // Saari 12+ CSS files ko ek jagah bundle karega
    sourcemap: true
  },
  server: {
    port: 3000,
    open: true // Command chalate hi browser apne aap open ho jayega
  }
});