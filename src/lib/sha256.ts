export async function sha256(json: unknown): Promise<string> {
  const data = new TextEncoder().encode(typeof json === 'string' ? json : JSON.stringify(json));
  if (crypto?.subtle?.digest) {
    const h = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(h)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  // Fallback: throw error instead of insecure hash
  throw new Error('Web Crypto API not available. Secure checksum verification requires modern browser support.');
}
