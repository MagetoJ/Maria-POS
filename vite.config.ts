import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import { mochaPlugins } from "@getmocha/vite-plugins";

export default defineConfig(({ mode }) => {
  const isRender = process.env.RENDER === 'true';
  
  return {
    // For production builds on Render, use minimal plugins
    plugins: mode === 'production' && isRender
      ? [react({ 
          // Disable TypeScript checking in Render builds
          babel: {
            parserOpts: {
              plugins: ['jsx', 'typescript']
            }
          }
        })] 
      : [...mochaPlugins(process.env as any), react(), cloudflare()],
    
    // Disable type checking in build for Render
    esbuild: isRender ? {
      drop: ['console', 'debugger'],
      target: 'es2020'
    } : undefined,
  
  server: {
    allowedHosts: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  
  build: {
    chunkSizeWarningLimit: 5000,
    outDir: 'dist/client',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router'],
        },
      },
    },
  },
  
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  };
});
