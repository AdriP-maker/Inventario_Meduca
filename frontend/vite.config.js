import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost/SASS_Meduca_Inventory/backend/public',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
