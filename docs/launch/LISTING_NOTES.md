# Listing notes — App Store + Play Store submission

Owner-action paste-ready URLs and form fields. Read top to bottom while
filling in the App Store Connect / Play Console submission flow.

## Public URLs (after `[SHIP-3]` lands and Pages is enabled)

The `pages.yml` workflow publishes the legal docs at:

```
https://zcg321.github.io/alchohalt/
https://zcg321.github.io/alchohalt/privacy-policy.html
https://zcg321.github.io/alchohalt/terms-of-service.html
https://zcg321.github.io/alchohalt/eula.html
https://zcg321.github.io/alchohalt/subscription-terms.html
https://zcg321.github.io/alchohalt/consumer-health-data-policy.html
```

**Gate:** GitHub Pages on a free account requires the repo to be public.
If the alchohalt repo is currently private, either flip it to public OR
upgrade to GitHub Pro before merging the workflow. Otherwise the site
fails to publish and the URLs above 404.

To enable Pages after the workflow lands (one-time, owner-action):
Repository Settings -> Pages -> Source: **GitHub Actions**. The first
workflow run after that will publish. Subsequent pushes to `main` that
touch `docs/legal/**` re-publish automatically.

## Apple App Store Connect

Form fields → values:

| Field | Value |
|---|---|
| Privacy Policy URL | `https://zcg321.github.io/alchohalt/privacy-policy.html` |
| License Agreement | Custom EULA → `https://zcg321.github.io/alchohalt/eula.html` (or leave default to use Apple's standard EULA) |
| Support URL | (owner action — set up a support email or a help page) |
| Marketing URL | (optional — link to a landing page if one exists) |

App Privacy → Privacy Practices → reference `privacy-policy.html` for the
data-collection inventory. Alchohalt is offline-first by default, so the
privacy nutrition label is mostly "Data Not Collected" except for the
opt-in AI Insights flow (described in `consumer-health-data-policy.html`).

## Google Play Console

Form fields → values:

| Field | Value |
|---|---|
| Privacy Policy | `https://zcg321.github.io/alchohalt/privacy-policy.html` |
| Subscription disclosure (in-app) | Repeat Section 3 auto-renewal block from `subscription-terms.html` |

Data safety form → most categories will be "No data collected." Use
`consumer-health-data-policy.html` for the health-data-specific
declarations (AI Insights opt-in, retention, third-party sharing).

## Sub-app legal links

After the URLs above are live, update the in-app `Settings → Legal` panel
to point at the hosted URLs (currently they likely point at GitHub source
or in-app text). See `src/features/settings/LegalLinks.tsx` for the
current target.

## Counsel review gate

The legal scaffolds carry a `counsel-review` checklist at the bottom of
each file. **None of these are cleared yet.** Do not submit to either
store until counsel sign-off is in writing — the consumer-health-data
policy in particular is load-bearing for WA MHMDA + NV SB 370 + CO CPA +
CT CTDPA compliance and is not safe to ship as a scaffold.

Recommended counsel scope: ~$500 flat-fee review of all five docs by a
US consumer-product attorney with mobile + health-app experience.

## Pre-submission checklist

- [ ] Repo flipped to public (OR owner upgraded to GitHub Pro)
- [ ] Pages workflow run succeeded; URLs above return 200
- [ ] Counsel review cleared on all 5 docs
- [ ] Apple Developer Program enrollment active ($99/yr, 24-48h review)
- [ ] Google Play Console enrollment active ($25 one-time, 1-3 days review)
- [ ] RevenueCat dashboard configured (see `revenuecat-setup.md`)
- [ ] Marketing screenshots captured (see `public/marketing/screenshots/`)
- [ ] App icon set generated (see `tools/marketing/generate_icons.py`)
