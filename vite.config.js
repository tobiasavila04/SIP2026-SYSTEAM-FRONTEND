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
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/api/users': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/api/roles': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/api/permissions': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/api/projects': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
      },
      '/api/wallet': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
      },
      '/api/investments': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
      },
      '/api/dashboard': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})