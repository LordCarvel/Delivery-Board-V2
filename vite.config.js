import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const isDeliveryHubBuild = process.env.DELIVERY_HUB === '1';

export default defineConfig({
  plugins: [react()],
  base: isDeliveryHubBuild ? './' : '/Delivery-Board-V2/',
});