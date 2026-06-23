import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from "path"

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    allowedHosts: true,
    host: 'localhost',
    port: 5173,
    strictPort: false,
    hmr: {
      host: 'localhost',
      port: 5173,
      protocol: 'ws',
    },
    proxy: {
      '/auth': {
        target: 'http://localhost:8989',
        changeOrigin: true,
        secure: false,
      },
      '/oauth2/authorization': {
        target: 'http://localhost:8989',
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: 'http://localhost:8989',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})