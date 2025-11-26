import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages base (repo name). In dev, Vite handles it automatically.
  base: '/Delivery-Board-V2/',
});
