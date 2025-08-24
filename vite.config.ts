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
  if (process.env.CI !== 'true') {
    plugins.push(
      VitePWA({
        injectRegister: null,
        strategies: 'generateSW',
        registerType: 'autoUpdate',
        includeAssets: ['icons/icon.svg'],
        manifest: {
          name: 'Alchohalt',
          short_name: 'Alchohalt',
          description: 'Offline-first alcohol tracker & coach. 100% on-device.',
          theme_color: '#0ea5e9',
          background_color: '#0b0f14',
          display: 'standalone',
          display_override: ['standalone', 'minimal-ui', 'browser'],
          scope: '/',
          start_url: '/',
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

