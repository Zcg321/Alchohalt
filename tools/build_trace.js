import { build } from 'vite';
(async () => {
  console.log('=== starting build ===');
  try {
    const res = await build({ logLevel: 'debug' });
    console.log('=== build finished ===', Array.isArray(res) ? res.length : 'ok');
  } catch (e) {
    console.error('Build error', e);
    process.exit(1);
  }
})();
