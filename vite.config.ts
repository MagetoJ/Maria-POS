import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  root: './src/react-app',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/react-app')
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: '../../dist',
    emptyOutDir: true,
    sourcemap: true,
  }
})