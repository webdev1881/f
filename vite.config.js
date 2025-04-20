import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'icon-512.png',
        'icon-256.png',
        'notification.mp3',
        'bell.mp3',
        'chime.mp3'
      ],
      manifest: {
        name: 'Сімейний додаток',
        short_name: '',
        description: 'Додаток для сімейного вмкористання',
        theme_color: '#007bff',
        icons: [
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/icon-256.png',
            sizes: '256x256',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            urlPattern: new RegExp('^https://your-socket-server\\.com/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 // 1 день
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    port: 3000,
    host: true
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    commonjsOptions: {
      esmExternals: true 
   },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia', 'firebase/app', 'firebase/firestore'],
          socketio: ['socket.io-client']
        }
      }
    }
  }
});