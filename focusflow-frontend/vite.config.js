import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'FocusFlow',
        short_name: 'FocusFlow',
        description: 'Travaille mieux, gagne des points.',
        theme_color: '#0F0E17',
        background_color: '#0F0E17',
        display: 'standalone',
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    host: '0.0.0.0',   // indispensable dans Docker
    port: 5173,
    watch: {
      usePolling: true  // nécessaire sur Windows pour le hot-reload dans Docker
    }
  }
})