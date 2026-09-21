import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// base './' -> laeuft aus jedem Unterverzeichnis (GitHub Pages) und per file://
// viteSingleFile buendelt JS+CSS in die eine index.html fuer den portablen Release.
export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile()],
  // PORT respektieren, damit ein Launcher einen freien Port zuweisen kann.
  server: { port: Number(process.env.PORT) || 5173 },
  preview: { port: Number(process.env.PORT) || 4173 },
  build: {
    cssCodeSplit: false,
    assetsInlineLimit: 100000000,
  },
});
