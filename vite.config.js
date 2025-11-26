import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const ghBase = '/Delivery-Board-V2/';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Use repo base on GitHub Actions; root for local/dev
  base: process.env.GITHUB_ACTIONS ? ghBase : '/',
});
