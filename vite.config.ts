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
      includeAssets: ['logo.png'],
      manifest: {
        name: 'DingleUP!',
        short_name: 'DingleUP!',
        description: 'Teszteld tudásod 15 izgalmas kérdéssel! Gyűjts aranyérméket és versenyezz a ranglistán.',
        theme_color: '#0a0a2e',
        background_color: '#0a0a2e',
        display: 'fullscreen',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/dingleup-logo.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/dingleup-logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg}'],
        navigateFallback: null,
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB limit for large assets
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
}));
