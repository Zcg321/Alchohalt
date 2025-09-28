import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

let visualizer;
if (process.env.BUNDLE_REPORT === '1') {
  ({ visualizer } = await import('rollup-plugin-visualizer'));
}

export default defineConfig(() => {
  const plugins = [react()];
  
  // Always enable PWA in production builds - this was the issue Codex identified
  plugins.push(
    VitePWA({
      injectRegister: 'auto',
      strategies: 'generateSW',
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg'],
      devOptions: {
        enabled: process.env.NODE_ENV === 'development'
      },
      manifest: {
          name: 'Alchohalt - Smart Alcohol Tracker & Coach',
          short_name: 'Alchohalt',
          description: 'AI-powered alcohol tracking with personalized insights, smart recommendations, and goal management. 100% offline and private.',
          theme_color: '#0ea5e9',
          background_color: '#0f172a',
          display: 'standalone',
          display_override: ['standalone', 'fullscreen', 'minimal-ui'],
          orientation: 'portrait-primary',
          scope: '/',
          start_url: '/?source=pwa',
          lang: 'en',
          edge_side_panel: {
            "preferred_width": 400
          },
          categories: ['health', 'lifestyle', 'productivity'],
          shortcuts: [
            {
              name: 'Quick log',
              short_name: 'Log',
              url: '/log',
              icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
            },
            {
              name: 'History',
              short_name: 'History',
              url: '/history',
              icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
            },
            {
              name: 'AF Streak',
              short_name: 'Streak',
              url: '/stats',
              icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
            },
          ],
          screenshots: [
            {
              src: '/icons/screenshot-1080x1920.png',
              sizes: '1080x1920',
              type: 'image/png',
              form_factor: 'narrow',
            },
            {
              src: '/icons/screenshot-1920x1080.png',
              sizes: '1920x1080',
              type: 'image/png',
              form_factor: 'wide',
            },
          ],
          icons: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: '/icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
            { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
          navigateFallback: '/index.html',
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.mode === 'navigate',
              handler: 'NetworkFirst',
              options: { cacheName: 'pages' },
            },
            {
              urlPattern: ({ request }) => ['style', 'script', 'worker'].includes(request.destination),
              handler: 'StaleWhileRevalidate',
              options: { cacheName: 'assets' },
            },
            {
              urlPattern: ({ request }) => ['image', 'font'].includes(request.destination),
              handler: 'CacheFirst',
              options: {
                cacheName: 'static-resources',
                expiration: { maxEntries: 64, maxAgeSeconds: 60 * 60 * 24 * 30 },
              },
            },
          ],
        },
      })
    );
    if (visualizer) {
      plugins.push(visualizer({ filename: 'stats.html', gzipSize: true }));
    }
  if (visualizer) {
    plugins.push(visualizer({ filename: 'stats.html', gzipSize: true }));
  }

  return {
    plugins,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        ...(process.env.CI === 'true'
          ? { 'virtual:pwa-register': '/src/features/pwa/virtual-pwa-register-stub.ts' }
          : {}),
      },
    },
    esbuild: { drop: ['console', 'debugger'] },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      assetsDir: 'assets',
      minify: 'terser',
      cssCodeSplit: true,
      brotliSize: false,
      reportCompressedSize: false,
      terserOptions: { compress: { pure_funcs: ['console.log'] } },
      rollupOptions: {
        external: [/^@capacitor\//],
        onwarn(warning, warn) {
          if (/circular dependency/.test(warning.message)) return;
          warn(warning);
        },
        treeshake: true,
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react')) return 'react';
              if (id.includes('capacitor')) return 'capacitor';
              if (id.includes('recharts')) return 'charts';
              if (id.includes('lodash')) return 'lodash';
              if (id.includes('date-fns') || id.includes('dayjs')) return 'date';
              if (id.includes('lucide-react') || id.includes('@heroicons')) return 'icons';
              return 'vendor';
            }
          },
        },
      },
      write: true,
    },
  };
});

