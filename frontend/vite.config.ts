import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev server on 5173, /api proxied to the Express API on 4000.
export default defineConfig({
  // Sub-path hosting (e.g. /shop/) needs VITE_BASE=/shop/ at build time.
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
