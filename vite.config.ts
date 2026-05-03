import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
// @ts-expect-error — local .mjs plugin, no .d.ts shim needed
import sri from './vite-plugin-sri.mjs';

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
          name: 'Alchohalt — A calm alcohol tracker',
          short_name: 'Alchohalt',
          description: 'A calm drink log. Track what you drink, set a goal that fits, see how a week or a month actually shaped up. Crisis lines on every screen. Your data stays on your phone.',
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
  /* [R20-C] SRI runs as the LAST plugin so it sees the final
   * emitted bundle (after VitePWA + visualizer). */
  plugins.push(sri());

  return {
    plugins,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        // [R10-E] Alias @capacitor/core to a web stub so the bundle
        // resolves on the browser. The rollup `external: [/^@capacitor\//]`
        // rule was leaving bare-specifier `import "@capacitor/core"`
        // statements in lazy chunks (e.g. AdvancedGoalSetting), which
        // the browser cannot resolve — pageerror "Failed to resolve
        // module specifier". Native builds (via Capacitor CLI) override
        // this alias with the real runtime; they don't go through vite.
        '@capacitor/core': path.resolve(__dirname, 'src/shared/capacitor-web-stub.ts'),
        ...(process.env.CI === 'true'
          ? { 'virtual:pwa-register': '/src/features/pwa/virtual-pwa-register-stub.ts' }
          : {}),
      },
      // [BUG-DUPLICATE-REACT-ROOT] Force a single React + ReactDOM
      // instance across the whole graph. Without this, any transitive
      // dep that bundles its own copy (or any moment the Vite dev
      // optimizeDeps pre-bundle is mid-rebuild) ends up giving two
      // tiles different React instances → "Cannot read properties of
      // null (reading 'useState')". Hit the AIInsightsTile path in
      // Sprint 1 (4f7f78c [ALCH-AI-PRIVACY-FIX]) and re-surfaced on
      // the Track tab during the 2026-04-27 audit. dedupe is the
      // canonical durable fix; the ErrorBoundary `isolate` wrapper
      // around AIInsightsTile is now defensive resilience, not a
      // workaround for this bug.
      dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
    },
    optimizeDeps: {
      // Pre-bundle React explicitly so dev hot-reloads don't catch a
      // half-resolved module mid-flight (the second symptom from the
      // Sprint 1 incident — node_modules/.vite/deps/react.js
      // momentarily returning null).
      include: ['react', 'react-dom', 'react-dom/client'],
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
        // [R10-E] Externalize Capacitor *plugins* (preferences,
        // local-notifications, etc.) that are only loaded via dynamic
        // import on native; their import() calls survive externalization
        // and runtime guards (Capacitor.isNativePlatform()) prevent them
        // from firing on web. `@capacitor/core` is the exception: it's
        // statically imported by src/shared/* and src/features/health/*,
        // so externalizing it left bare specifiers in lazy chunks that
        // crashed the browser. We alias it to a web stub above.
        external: [
          /^@capacitor\/(?!core$)/,
          /^@capacitor-community\//,
        ],
        onwarn(warning, warn) {
          if (/circular dependency/.test(warning.message)) return;
          warn(warning);
        },
        treeshake: true,
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            // [BUG-DUPLICATE-REACT-ROOT] Match react and react-dom with
            // exact path segments — substring `react` also catches
            // react-smooth, react-transition-group (recharts), and
            // anything in src/ with "react" in the path. Bundling
            // those with react proper risks pulling fragments into
            // the wrong chunk on tree-shake.
            if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) {
              return 'react';
            }
            if (id.includes('@capacitor/')) return 'capacitor';
            if (id.includes('recharts')) return 'charts';
            if (id.includes('lodash')) return 'lodash';
            if (id.includes('date-fns') || id.includes('dayjs')) return 'date';
            if (id.includes('lucide-react') || id.includes('@heroicons')) return 'icons';
            // [AUDIT-2026-05-01-E] libsodium is only used by the
            // lazy-loaded Sync surface (and the test-only
            // encrypted-backup helper). Returning undefined lets
            // Rollup put it in whichever async chunk imports it
            // instead of stuffing 400 KB of WASM bindings into the
            // eager `vendor` chunk that every visitor downloads.
            if (id.includes('libsodium')) return undefined;
            // jspdf is similarly only pulled by the PDF-export path.
            if (id.includes('jspdf')) return undefined;
            return 'vendor';
          },
        },
      },
      write: true,
    },
  };
});

