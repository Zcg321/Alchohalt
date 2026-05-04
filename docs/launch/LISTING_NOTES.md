# Listing notes — App Store + Play Store submission

Owner-action paste-ready URLs and form fields. Read top to bottom while
filling in the App Store Connect / Play Console submission flow.

## Public URLs (served by Vercel deployment of the PWA itself)

`[SHIP-3.1]` replaced the GitHub-Pages-on-public-repo path with a
Vercel deployment of the alchohalt PWA. The same deployment serves
both the actual product (`/`, `/?tab=...`) and the legal pages as
in-app routes (`/legal/<slug>`). Source code stays in the private
GitHub repo — only the built `dist/` output is public.

After the Vercel deployment is provisioned (one-time setup, ~2 min,
see "Vercel setup" below), the canonical legal URLs are:

```
https://<vercel-deployment>.vercel.app/legal/privacy-policy
https://<vercel-deployment>.vercel.app/legal/terms-of-service
https://<vercel-deployment>.vercel.app/legal/eula
https://<vercel-deployment>.vercel.app/legal/subscription-terms
https://<vercel-deployment>.vercel.app/legal/consumer-health-data
```

Once the owner buys / configures a custom domain (e.g. `alchohalt.app`),
swap the host:

```
https://alchohalt.app/legal/privacy-policy
… etc.
```

The privacy-policy URL paste field in App Store Connect / Play Console
should use the **custom domain form** if the domain is configured at
submission time; otherwise the `*.vercel.app` form is acceptable for
review and can be updated post-launch.

### Vercel setup (~2 minutes, owner-action, $0)

1. Sign up at https://vercel.com/signup (free Hobby tier covers Alchohalt)
2. Click "Add New… → Project," authorize the Vercel GitHub app, pick
   the alchohalt repo. Repo can stay **private** — Vercel's GitHub
   integration only needs read access to build.
3. Vercel auto-detects `vercel.json`. Confirm:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Click Deploy. First build is ~90 seconds. Vercel returns the live
   URL.
5. (Optional, do this before App Store submission) Settings → Domains
   → add the custom domain, update DNS.

**The repo stays private** — this was the right trade-off vs the
[SHIP-3] flip-the-repo-public path. Vercel sees the source via OAuth,
the world sees only `dist/`.

## Apple App Store Connect

Form fields → values:

| Field | Value |
|---|---|
| Privacy Policy URL | `https://<your-vercel-or-custom-domain>/legal/privacy-policy` |
| License Agreement | Custom EULA → `https://<your-vercel-or-custom-domain>/legal/eula` (or leave default to use Apple's standard EULA) |
| Support URL | (owner action — set up a support email or a help page) |
| Marketing URL | (optional — link to a landing page if one exists) |
| **Keywords (100 chars)** | See `docs/launch/app-store-keywords.md` for the chosen line + methodology. Paste into App Information → Keywords field. |

App Privacy → Privacy Practices → reference the privacy policy URL for
the data-collection inventory. Alchohalt is offline-first by default,
so the privacy nutrition label is mostly "Data Not Collected" except
for the opt-in AI Insights flow (described in
`/legal/consumer-health-data`).

## Google Play Console

Form fields → values:

| Field | Value |
|---|---|
| Privacy Policy | `https://<your-vercel-or-custom-domain>/legal/privacy-policy` |
| Subscription disclosure (in-app) | Repeat Section 3 auto-renewal block from `/legal/subscription-terms` |

Data safety form → most categories will be "No data collected." Use
`/legal/consumer-health-data` for the health-data-specific declarations
(AI Insights opt-in, retention, third-party sharing).

## In-app Settings → Legal

Already wired post-`[SHIP-3.1]`. `src/features/settings/LegalLinks.tsx`
links to the same `/legal/<slug>` paths the App Store + Play Store
references — same Vercel deployment, same content, no divergence.

## Counsel review gate

The legal scaffolds carry a `counsel-review` checklist at the bottom of
each file. **None of these are cleared yet.** Do not submit to either
store until counsel sign-off is in writing — the consumer-health-data
policy in particular is load-bearing for WA MHMDA + NV SB 370 + CO CPA +
CT CTDPA compliance and is not safe to ship as a scaffold.

Recommended counsel scope: ~$500 flat-fee review of all five docs by a
US consumer-product attorney with mobile + health-app experience.

## Pre-submission checklist

- [ ] Vercel project provisioned; legal URLs return 200
- [ ] (Optional) Custom domain configured in Vercel + DNS
- [ ] Counsel review cleared on all 5 docs
- [ ] Apple Developer Program enrollment active ($99/yr, 24-48h review)
- [ ] Google Play Console enrollment active ($25 one-time, 1-3 days review)
- [ ] RevenueCat dashboard configured (see `revenuecat-setup.md`)
- [ ] Marketing screenshots captured (see `public/marketing/screenshots/`)
- [ ] App icon set generated (see `tools/marketing/generate_icons.py`)
