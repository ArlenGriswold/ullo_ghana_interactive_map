import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const SUPABASE_BASE = 'https://iraunnurohhyxfwuhmvt.supabase.co/storage/v1/object/public/pano'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/pano': {
        target: SUPABASE_BASE,
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/pano/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.removeHeader('origin')
            proxyReq.removeHeader('referer')
          })
        },
      },
      '/drone': {
        target: SUPABASE_BASE,
        changeOrigin: true,
        secure: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.removeHeader('origin')
            proxyReq.removeHeader('referer')
          })
        },
      },
    },
  },
})
