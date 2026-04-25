import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ''

// Split chunks to reduce bundle size
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: ['all'],
  },
  build: {
    chunkSizeWarningLimit: 5000,
    minify: 'esbuild',
  },
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || vercelUrl || ''),
  },
})
