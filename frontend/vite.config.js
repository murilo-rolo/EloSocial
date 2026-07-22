import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.js'],
    globals: true,
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icon-192x192.png', 'icon-512x512.png'],
      manifest: {
        name: 'EloSocial - Prontuário SUAS',
        short_name: 'EloSocial',
        description: 'Sistema de Prontuário Eletrônico SUAS para CRAS',
        theme_color: '#0B1511',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'icon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    host: true,
  },
})
