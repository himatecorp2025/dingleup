import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';
import type { Plugin } from 'vite';

// Security headers plugin - ONLY for production builds
// Development mode needs relaxed policies for HMR and hot reload
const securityHeadersPlugin = (mode: string): Plugin => ({
  name: 'security-headers',
  configureServer(server) {
    // Skip security headers in development to allow HMR and hot reload
    if (mode === 'development') {
      return;
    }
    
    server.middlewares.use((req, res, next) => {
      // Content Security Policy
      res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://fonts.googleapis.com https://www.googletagmanager.com; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "img-src 'self' data: https: blob:; " +
        "font-src 'self' https://fonts.gstatic.com; " +
        "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com; " +
        "frame-ancestors 'none'; " +
        "base-uri 'self'; " +
        "form-action 'self';"
      );
      
      // Other security headers
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
      
      next();
    });
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    securityHeadersPlugin(mode),
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
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,mp4,mp3,woff,woff2}'],
        // Offline fallback strategy - serve app shell on navigation failures
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/admin/],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // Increased for video files
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        // Pre-cache critical assets for offline functionality
        additionalManifestEntries: [
          { url: '/dingleup-logo.png', revision: null },
          { url: '/assets/introvideo.mp4', revision: null },
          { url: '/assets/DingleUP.mp3', revision: null },
          { url: '/assets/game-background.png', revision: null }
        ],
        runtimeCaching: [
          // Supabase API - Aggressive cache-first with network fallback for maximum speed
          {
            urlPattern: ({ url }) => url.origin === 'https://wdpxmwsxhckazwxufttk.supabase.co',
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-api-cache',
              expiration: {
                maxEntries: 300,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days aggressive cache
              },
              networkTimeoutSeconds: 3, // Ultra-fast timeout (3s)
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // Images - Maximum aggressive cache first
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 500, // Much more images cached
                maxAgeSeconds: 60 * 60 * 24 * 90 // 90 days aggressive cache
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // Videos - Cache first with network fallback
          {
            urlPattern: /\.(?:mp4|webm)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'videos-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          // Audio - Cache first with network fallback
          {
            urlPattern: /\.(?:mp3|wav|ogg)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'audio-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          // Fonts - Maximum aggressive cache
          {
            urlPattern: /\.(?:woff|woff2|ttf|otf)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 365 * 3 // 3 years
              }
            }
          },
          // Static JS/CSS bundles - Cache first for instant loads
          {
            urlPattern: /\.(?:js|css)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-resources-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
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
