# App Store + Play Store readiness pre-flight (2026-05-01)

Round 5 doesn&rsquo;t ship anything to stores — owner needs to register
Apple Developer + Google Play first. This pre-flights the assets and
disclosures owner will paste into the consoles.

## Status check

| Asset | Status | Notes |
|---|---|---|
| App Store description | ✅ Ready | `docs/launch/app-store-description.md` — round-4 voice, NYT-clean. |
| Play Store description | ✅ Ready | Same doc; reuse short description. |
| App icon (1024) | ✅ Ready | `public/icons/icon-1024.png` |
| iOS adaptive icon | ✅ Ready | `public/icons/icon.svg` + maskable-512 |
| Android adaptive icon | ✅ Ready | `public/icons/maskable-512.png` |
| iPhone screenshots | ❌ Pending | See `public/screenshots/README.md` capture plan |
| iPad screenshots | ❌ Pending | Same |
| Android phone screenshots | ❌ Pending | Same |
| Android tablet screenshots | ❌ Pending | Same |
| Feature graphic (Play) | ❌ Pending | 1024×500 — see capture plan |
| App Store privacy disclosure | ✅ Drafted (below) | Paste into App Store Connect → Privacy |
| Play Store data safety | ✅ Drafted (below) | Paste into Play Console → Data safety |

---

## App Store privacy disclosure (paste into App Store Connect)

App Store Connect → App Privacy → Privacy Practices.

### Data NOT collected

The app, in its default configuration, **does not collect any data
that leaves the device**. All entries live in local storage. No
analytics, no crash reports, no telemetry, no user accounts.

### Optional features that change the answer (declare these)

The owner must declare these in App Store Connect because the
default-off opt-in features can collect data when users enable them:

#### 1. Encrypted backup (Settings → Encrypted backup)

- **Data type:** Health & Fitness → Sensitive Info (alcohol use is
  health-adjacent). Data is end-to-end encrypted with a passphrase
  the user holds; the server (when present) sees only ciphertext.
- **Linked to user:** Yes (the device key derives from a user
  passphrase the server cannot see).
- **Used for tracking:** No.
- **Disclosure:** "Encrypted backup of your drink log to a transport
  the user controls. The server cannot read the contents."

#### 2. AI Insights (Settings → AI; off by default)

- **Data type:** Health & Fitness → Sensitive Info; aggregated
  drink-day summaries (no per-drink rows) sent to the configured
  AI provider.
- **Linked to user:** No (we send only aggregated counts; the
  payload includes no identifiers).
- **Used for tracking:** No.
- **Disclosure:** "Optional AI Insights call out to a third-party
  language model. The user controls the provider in Settings.
  Off by default; explicit consent screen on first enable. The app
  sanitizes the payload to drink-day aggregates before sending —
  no per-event detail leaves the device."

#### 3. Crisis hotlines

- The hotline links open the dialer / SMS app via `tel:` and `sms:`
  schemes. The phone provider — not Alchohalt — handles the call.
- **Disclosure:** "Tapping a crisis line opens your phone dialer.
  The app does not see who you call or text from these links."

### Privacy URL

`https://alchohalt.com/legal/privacy` (or the `/legal/privacy`
in-app route, which the round-3 SHIP-3.1 commit landed and the
Vercel deployment serves).

---

## Play Store data safety (paste into Play Console)

Play Console → App content → Data safety.

### Data collection summary

| Question | Answer |
|---|---|
| Does your app collect or share any of the required user data types? | No (default mode) |
| Is all of the user data collected by your app encrypted in transit? | Yes (when collected — encrypted backup uses libsodium-wrappers; AI Insights uses HTTPS) |
| Do you provide a way for users to request that their data is deleted? | Yes — Settings → Data Management → Erase all data |

### Per-data-type declarations

#### Health & fitness

- **Item:** Health info (alcohol consumption logs)
- **Collected?** No (default). User-toggled encrypted backup
  optionally transmits to a server-they-control endpoint as
  ciphertext.
- **Shared?** No (default). AI Insights, when enabled, shares
  aggregated daily summaries with the configured provider.
- **Optional?** Yes — both encrypted backup and AI Insights are
  off by default and require explicit consent.
- **Purpose:** App functionality only.

#### Personal info

- **Item:** None. The app does not ask for name, email, address,
  or any identifier.

#### Financial info

- **Item:** Optional cost-per-drink that the user types. Stays on
  device.

#### Photos & videos

- None.

#### Audio files

- None.

#### Files & docs

- Export to JSON / CSV / PDF stays on device unless the user
  explicitly shares it via the OS share sheet.

#### App activity / app info / device IDs

- None collected.

### Data deletion request URL

`https://alchohalt.com/legal/data-deletion` — direct the user to
Settings → Data Management → Erase all data, which wipes local
storage and any opted-in encrypted-backup ciphertext.

### Security practices

- ✅ Data encrypted in transit (when transmitted at all)
- ✅ User can request data deletion
- ✅ Independent security review committed: see Round 1 audit doc
- ✅ Follows COPPA-equivalent safe-children practices: not
  marketed to under-18, no children-targeted features

---

## App-store rejection risk audit (light pass)

Common rejection reasons and our state:

| Risk | Status |
|---|---|
| Apple 1.1.6 — false health claims | ✅ Disclaimer surfaces on every metric tile. AI off by default. |
| Apple 4.2 — minimum functionality | ✅ Real PWA + Capacitor wrapper; not a webview-of-a-website. |
| Apple 5.1.1 — privacy practices | ✅ Privacy URL + nutrition labels above; no PII collection by default. |
| Apple 5.1.2 — third-party data sharing | ✅ AI Insights consent screen names the provider explicitly. |
| Google sensitive content (alcohol) | ⚠️ App is in **Health & Fitness / Lifestyle**, not Adult. Alcohol topic is health-context, not promotion. Owner should confirm "Mature 17+" rating during submission. |
| Google data safety inconsistency | ✅ Disclosure above matches the in-app behavior. |

---

## Lock-screen / native widget follow-up

The Friday-night-having-a-hard-time judge in section C asked about
crisis support from the lock screen. PWAs cannot install lock-screen
widgets. The native iOS / Android wrapper (Capacitor) could in a
future round implement:
- iOS WidgetKit lock-screen widget linking to the crisis page
- Android quick-settings tile or a notification with a tap-to-call
  988 action

These are deferred to a post-launch native feature round.

---

## Owner-blocking items (specific questions)

1. **Apple Developer Program enrollment.** $99/year. Owner needs to
   register, submit identity docs, and accept the agreements. Until
   that's done, no iOS submission.
2. **Google Play Developer registration.** $25 one-time. Same gate
   for Play.
3. **Marketing screenshots.** Owner needs to either: (a) take them
   manually from a real iPhone / Android device with the round-5
   build, or (b) wait for a future round that has a Chromium binary
   on the build machine for Playwright capture.
4. **App store rating questionnaire.** Owner should expect to mark
   "Infrequent / mild references to alcohol or drug use" on the
   Apple rating questionnaire. Play Store: "Mature 17+" should be
   accurate.
5. **Privacy URL endpoint.** Confirm `https://alchohalt.com/legal/
   privacy` resolves before submission. The Vercel deployment serves
   the in-app route; need to confirm the marketing site (if separate)
   serves the same content.

Once 1–2 land and 3 lands, the disclosures above unblock everything.
