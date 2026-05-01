# PENDING — screenshots not yet captured

The five iOS + five Android × two themes = 20 PNGs are not yet in this
directory. The capture script `tools/marketing/capture_screenshots.ts` is
ready and reproducible; running it requires Playwright (~150 MB Chromium
download) and a running build of the app.

The capture environment in which this worktree was prepared had neither
Playwright installed nor the dev server running, so the artifacts are
left as a deliberate gap rather than faked. See `README.md` in this
directory for the full re-run instructions — roughly:

```bash
npm install -D playwright tsx
npx playwright install chromium
npm run build
npx vite preview --port 4173 &
npx tsx tools/marketing/capture_screenshots.ts
```

After capture, delete this file and commit the PNGs.
