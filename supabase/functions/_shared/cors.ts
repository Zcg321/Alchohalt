// Shared CORS headers for sync edge functions.
// The Capacitor WebView served from `capacitor://localhost` issues
// real CORS preflights; the Vite dev server on `http://localhost:5173`
// also needs to be allowed in dev. `*` is fine here because the auth
// gate is the JWT, not the origin.

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
} as const;
