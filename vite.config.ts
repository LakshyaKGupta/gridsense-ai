import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Split chunks to reduce bundle size
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: ['all'],
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 5000,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('maplibre-gl') || id.includes('react-map-gl')) return 'vendor-map';
            if (id.includes('firebase')) return 'vendor-firebase';
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) return 'vendor-react';
            if (id.includes('framer-motion') || id.includes('lucide-react')) return 'vendor-utils';
            if (id.includes('papaparse') || id.includes('recharts') || id.includes('jspdf') || id.includes('html2canvas')) return 'vendor-data';
            return 'vendor-core';
          }
        }
      }
    }
  },
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || '/api'),
  },
})
