export async function sha256(json: unknown): Promise<string> {
  const data = new TextEncoder().encode(typeof json === 'string' ? json : JSON.stringify(json));
  if (crypto?.subtle?.digest) {
    const h = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(h)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  let h1 = 0x6a09e667 | 0, h2 = 0xbb67ae85 | 0, h3 = 0x3c6ef372 | 0, h4 = 0xa54ff53a | 0;
  for (let i = 0; i < data.length; i++) {
    h1 = (h1 + data[i]) | 0;
    h2 = (h2 ^ data[i]) | 0;
    h3 = (h3 * 31 + data[i]) | 0;
    h4 = ((h4 << 5) - h4 + data[i]) | 0;
  }
  return [h1, h2, h3, h4]
    .map(x => ('00000000' + (x >>> 0).toString(16)).slice(-8))
    .join('');
}
