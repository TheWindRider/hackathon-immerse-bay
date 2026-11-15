import { defineConfig } from 'vite';
import satie from 'satie-runtime/vite';

export default defineConfig({
  base: './',
  plugins: [satie()],
  server: {
    headers: {
      'Permissions-Policy': 'xr-spatial-tracking=(self)',
    },
  },
  preview: {
    headers: {
      'Permissions-Policy': 'xr-spatial-tracking=(self)',
    },
  },
});
