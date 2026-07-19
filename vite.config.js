import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // GitHub Pages project sites live at /repository-name/.
  // Local development and Vercel use the normal root path.
  base: process.env.VITE_BASE_PATH || '/',
});
