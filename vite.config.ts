import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/identity-api': {
        target:
          'https://hopon-identity-service-183823945736.asia-south1.run.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/identity-api/, ''),
      },
    },
  },
})
