import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'dingleup-logo.png'],
      manifest: {
        name: 'DingleUP!',
        short_name: 'DingleUP!',
        description: 'Kvízjáték magyar nyelven',
        theme_color: '#9333ea',
        background_color: '#000000',
        display: 'standalone',
        icons: [
          {
            src: '/dingleup-logo.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/dingleup-logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/dingleup-logo.png',
            sizes: '1024x1024',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        shortcuts: [
          {
            name: 'Játék indítása',
            short_name: 'Játék',
            description: 'Új játék indítása',
            url: '/game',
            icons: [{ src: '/dingleup-logo.png', sizes: '192x192' }]
          },
          {
            name: 'Ranglista',
            short_name: 'Ranglista',
            description: 'Napi ranglista megtekintése',
            url: '/leaderboard',
            icons: [{ src: '/dingleup-logo.png', sizes: '192x192' }]
          },
          {
            name: 'Profil',
            short_name: 'Profil',
            description: 'Profil beállítások',
            url: '/profile',
            icons: [{ src: '/dingleup-logo.png', sizes: '192x192' }]
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg}'],
        navigateFallback: null,
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === 'https://wdpxmwsxhckazwxufttk.supabase.co',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24
              },
              networkTimeoutSeconds: 10
            }
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
}));
