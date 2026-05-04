# App Store metadata — locale pack

[R29-3] Per-locale title + subtitle + keywords + short description +
"What's New" notes for the 6 shipped locales (en/es/fr/de/pl/ru).
Owner-action: paste each locale's block into App Store Connect →
App Information → Localizable Information → switch language → fill.

Companion to:
- `docs/launch/app-store-description.md` — the EN long-form pitch.
- `docs/launch/app-store-keywords.md` — the EN keyword methodology.

This pack closes the marketing-director C6 concern: previously the
6-locale i18n covered in-app strings but the App Store fields
themselves are per-locale and were English-only.

---

## Translation status

All translations are direct from the EN canon. **Each locale needs
a native-speaker review before publishing** — the R23 pl-translator
feedback round and the R24 ru-translator feedback round are the
process model. Even Spanish/French/German with widely-spoken
audiences benefits from a dialect choice (es-ES vs es-MX, etc.); the
versions below default to neutral/Iberian Spanish, metropolitan
French, standard German.

| Locale | Status |
|--------|--------|
| en | Canon. No review needed. |
| es | Translated; needs native-speaker review (es-ES default). |
| fr | Translated; needs native-speaker review (fr-FR default). |
| de | Translated; needs native-speaker review. |
| pl | Translated; needs native-speaker review (R23 reviewer pattern). |
| ru | Translated; needs native-speaker review (R24 reviewer pattern). |

---

## App name (30 chars max — same across all locales)

`Alchohalt`

The brand name does not translate. Same field value in every locale.

---

## Subtitle (30 chars max, per locale)

The English subtitle "No ads. No analytics. Yours." is 28 chars and
delivers the same promise as the keyword field in everyday voice.
Each locale below preserves the three-beat rhythm where the language
allows it within 30 chars.

| Locale | Subtitle (chars) |
|--------|------------------|
| en | `No ads. No analytics. Yours.` (28) |
| es | `Sin anuncios. Sin rastreo. Tuyo.` (32 — too long, use:) |
|    | `Sin rastreo. Sin anuncios.` (26) |
| fr | `Sans pub. Sans pistage. À vous.` (31 — too long, use:) |
|    | `Sans pub. Sans pistage.` (23) |
| de | `Keine Werbung. Kein Tracking.` (29) |
| pl | `Bez reklam. Bez analityki.` (26) |
| ru | `Без рекламы. Без аналитики.` (27) |

**Char-count notes:** App Store Connect counts visible characters
not bytes, so multi-byte Cyrillic still counts as one char. The
"too long, use:" alternates above are the picks within the 30-char
limit. The dropped third clause ("Yours" / "À vous") is the
ownership promise, which is implicit in the short description below.

---

## Short description / Keywords field (100 chars, per locale)

Translated keyword lines using the same 4 head terms + 5
differentiators + 4 long-tail anchors structure as the EN canon.

### English (canon)

```
alcohol,tracker,sober,private,encrypted,no analytics,recovery,journal,goal,drinks,habit,calm,offline
```
99 chars.

### Spanish (es)

```
alcohol,registro,sobrio,privado,cifrado,sin analitica,recuperacion,diario,meta,bebidas,habito,calma,sin conexion
```
112 chars — **too long**. Trimmed:
```
alcohol,sobrio,privado,cifrado,sin analitica,recuperacion,diario,meta,bebidas,habito,calma,offline
```
98 chars. (Dropped "registro" — "alcohol" + "diario" cover the
tracker-log search lane in Spanish.)

### French (fr)

```
alcool,suivi,sobre,prive,chiffre,sans analytique,addiction,journal,objectif,boisson,habitude,calme,hors ligne
```
108 chars — **too long**. Trimmed:
```
alcool,sobre,prive,chiffre,sans analytique,addiction,journal,objectif,boisson,habitude,calme,hors ligne
```
102 chars — still over. Final:
```
alcool,sobre,prive,chiffre,sans analytique,addiction,journal,objectif,habitude,calme,hors ligne
```
94 chars.

### German (de)

```
alkohol,tracker,nuchtern,privat,verschlusselt,keine analytik,recovery,tagebuch,ziel,getranke,gewohnheit,ruhig,offline
```
118 chars — **too long**. Trimmed:
```
alkohol,nuchtern,privat,verschlusselt,keine analytik,recovery,tagebuch,ziel,getranke,gewohnheit,ruhig,offline
```
108 chars — still over. Final:
```
alkohol,nuchtern,privat,verschlusselt,keine analytik,tagebuch,ziel,getranke,gewohnheit,ruhig,offline
```
99 chars.

### Polish (pl)

```
alkohol,tracker,trzezwy,prywatny,szyfrowanie,bez analityki,wsparcie,dziennik,cel,napoje,nawyk,spokoj,offline
```
107 chars — **too long**. Trimmed:
```
alkohol,trzezwy,prywatny,szyfrowanie,bez analityki,wsparcie,dziennik,cel,napoje,nawyk,spokoj,offline
```
99 chars.

### Russian (ru)

Cyrillic chars still count as 1 char each in App Store Connect
keyword field, but native-speaker review needed to confirm the term
choices match what Russian-speaking users actually search.

```
алкоголь,трезвый,приватный,шифрование,без аналитики,восстановление,дневник,цель,напитки,привычка,офлайн
```
102 chars — **too long**. Trimmed:
```
алкоголь,трезвый,приватный,шифрование,без аналитики,дневник,цель,напитки,привычка,офлайн
```
86 chars.

---

## Description (long-form per locale)

The full 4000-char EN description in `app-store-description.md` is
the canonical pitch. Each non-EN locale gets a **shorter
focused-on-moats** version below — long enough to land the three
biggest moats (no analytics, encrypted backup, crisis support) but
short enough that a native-speaker reviewer can edit it in one pass.

The owner can choose to either:
- **(a)** Paste the focused version below into the localized App
  Store Connect long-description field. Reviewer updates as needed.
- **(b)** Translate the full EN canon. ~30-60 minutes per locale
  with a native-speaker editor.

Path (a) is recommended for the initial submission. Path (b) for
the second pass after native-speaker reviews.

### Spanish (es) — focused version

```
Sin analíticas. Copia de seguridad cifrada de extremo a extremo.
Líneas de crisis en cada pantalla. La app de seguimiento de
alcohol que no te rastrea.

POR QUÉ ES DIFERENTE

→ Sin analíticas de terceros. Ni Firebase, ni Mixpanel, ni
  rastreadores. No vendemos lo que no recopilamos.

→ Copia de seguridad cifrada de extremo a extremo. Cuando
  activas la copia, los datos se cifran en tu dispositivo con una
  clave que solo él conoce. El servidor solo guarda texto cifrado.

→ Apoyo en crisis en cada pantalla. Toca "¿Necesitas ayuda?" en
  el encabezado para acceder al temporizador de respiración y a
  las líneas de crisis. Nunca de pago, nunca bloqueado.

→ Lenguaje claro. Sin "viajes transformadores", sin jerga clínica.
  Nivel de lectura sexto grado.

GRATIS PARA SIEMPRE: registro de bebidas, historial, días sin
alcohol, ahorro, diario básico, bloqueo biométrico, un
recordatorio, exportación completa (JSON + CSV) y todos los
recursos de crisis.

PREMIUM: correlaciones estado de ánimo/bebida, multi-recordatorios,
informes PDF, copia cifrada, presets personalizados, visualizaciones
avanzadas, temas de iconos, e Insights AI opcionales.

— De por vida: 69 $ una vez. Sin trampa de suscripción.

Tu privacidad: tus datos se quedan en tu teléfono. No podemos leer
lo que registras criptográficamente. Sin anuncios, sin analíticas.
Ni ahora, ni cuando seamos rentables, ni nunca.
```

### French (fr) — focused version

```
Aucune analytique. Sauvegarde chiffrée de bout en bout. Lignes
de crise sur chaque écran. L'app de suivi d'alcool qui ne vous
suit pas.

POURQUOI C'EST DIFFÉRENT

→ Pas d'analytique tierce. Pas de Firebase, pas de Mixpanel, pas
  de Sentry par défaut. On ne peut pas vendre ce qu'on ne collecte
  pas.

→ Sauvegarde chiffrée de bout en bout. Quand vous activez la
  sauvegarde cloud, vos données sont chiffrées sur votre appareil
  avec une clé que seul votre appareil détient. Le serveur ne
  stocke que du chiffrement.

→ Soutien en crise sur chaque écran. Touchez "Besoin d'aide ?"
  dans l'en-tête pour le minuteur de respiration et les lignes
  d'urgence. Jamais payant, jamais derrière une fonctionnalité.

→ Langage clair. Pas de "voyage transformateur", pas de jargon
  clinique. Niveau de lecture sixième.

GRATUIT POUR TOUJOURS : journal de boissons, historique, jours
sans alcool, économies, journal de base, verrouillage biométrique,
un rappel, export complet (JSON + CSV) et toutes les ressources
de crise.

PREMIUM : corrélations humeur/boissons, multi-rappels, rapports
PDF, sauvegarde chiffrée, préréglages personnalisés, visualisations
avancées, thèmes d'icônes, et insights IA optionnels.

— À vie : 69 $ une fois. Pas de piège d'abonnement.

Vos données restent sur votre téléphone. Cryptographiquement, nous
ne pouvons pas lire ce que vous enregistrez. Pas de publicité, pas
d'analytique. Ni maintenant, ni quand nous serons rentables, jamais.
```

### German (de) — focused version

```
Keine Analytik. Ende-zu-Ende-verschlüsseltes Backup. Krisen-
Hotlines auf jedem Bildschirm. Der Alkohol-Tracker, der dich
nicht trackt.

WARUM ES ANDERS IST

→ Keine Drittanbieter-Analytik. Kein Firebase, kein Mixpanel,
  kein Sentry standardmäßig. Wir können nicht verkaufen, was
  wir nicht sammeln.

→ Ende-zu-Ende-verschlüsseltes Backup. Wenn du Cloud-Backup
  aktivierst, werden deine Daten auf deinem Gerät mit einem
  Schlüssel verschlüsselt, den nur dein Gerät kennt. Der Server
  speichert nur Chiffretext.

→ Krisen-Unterstützung auf jedem Bildschirm. Tippe „Brauchst du
  Hilfe?“ im Header für den Atem-Timer und Krisen-Hotlines.
  Nie kostenpflichtig, nie hinter einer Funktion.

→ Klare Sprache. Keine „transformative Reise“, kein klinischer
  Fachjargon. Lesbarkeit sechste Klasse.

KOSTENLOS FÜR IMMER: Drink-Log, Verlauf, alkoholfreie Tage,
gespartes Geld, einfaches Tagebuch, biometrische Sperre, eine
Erinnerung, vollständiger Export (JSON + CSV) und alle Krisen-
Ressourcen.

PREMIUM: Stimmungs/Drink-Korrelationen, Mehrfach-Erinnerungen,
PDF-Berichte, verschlüsseltes Backup, eigene Drink-Presets,
erweiterte Visualisierungen, Icon-Themes und opt-in AI-Insights.

— Lebenslang: 69 $ einmalig. Keine Abo-Falle.

Deine Daten bleiben auf deinem Handy. Kryptografisch können wir
nicht lesen, was du loggst. Keine Werbung, keine Analytik. Nicht
jetzt, nicht wenn wir profitabel sind, nie.
```

### Polish (pl) — focused version

```
Brak analityki. Kopia zapasowa szyfrowana end-to-end. Linie
kryzysowe na każdym ekranie. Aplikacja do śledzenia alkoholu,
która cię nie śledzi.

DLACZEGO TO INNE

→ Bez analityki firm trzecich. Brak Firebase, Mixpanel, Sentry
  domyślnie. Nie sprzedajemy tego, czego nie zbieramy.

→ Kopia zapasowa szyfrowana end-to-end. Gdy włączysz kopię w
  chmurze, dane są szyfrowane na twoim urządzeniu kluczem, który
  zna tylko ono. Serwer przechowuje wyłącznie tekst zaszyfrowany.

→ Wsparcie kryzysowe na każdym ekranie. Dotknij „Potrzebujesz
  pomocy?” w nagłówku, aby otworzyć timer oddechowy i linie
  kryzysowe. Nigdy płatne, nigdy zablokowane.

→ Jasny język. Bez „transformującej podróży”, bez żargonu
  klinicznego. Poziom czytania szóstej klasy.

ZA DARMO NA ZAWSZE: dziennik napojów, historia, dni bez alkoholu,
zaoszczędzone pieniądze, podstawowy dziennik, blokada biometryczna,
jedno przypomnienie, pełny eksport (JSON + CSV) i wszystkie zasoby
kryzysowe.

PREMIUM: korelacje nastrój/napoje, wiele przypomnień, raporty PDF,
zaszyfrowana kopia, własne presety napojów, zaawansowane
wizualizacje, motywy ikon i opcjonalne wglądy AI.

— Dożywotnio: 69 $ raz. Brak pułapki subskrypcyjnej.

Twoje dane zostają na twoim telefonie. Kryptograficznie nie możemy
odczytać tego, co rejestrujesz. Bez reklam, bez analityki. Nie
teraz, nie gdy będziemy rentowni, nigdy.
```

### Russian (ru) — focused version

```
Никакой аналитики. Резервное копирование со сквозным шифрованием.
Линии помощи в кризис на каждом экране. Трекер алкоголя, который
не следит за вами.

ПОЧЕМУ ЭТО ДРУГОЕ

→ Никакой сторонней аналитики. Никакого Firebase, никакого
  Mixpanel, никакого Sentry по умолчанию. Мы не можем продать
  то, что не собираем.

→ Резервная копия со сквозным шифрованием. Когда вы включаете
  облачную копию, данные шифруются на вашем устройстве ключом,
  который знает только оно. Сервер хранит только зашифрованный
  текст.

→ Поддержка в кризис на каждом экране. Коснитесь «Нужна
  помощь?» в шапке, чтобы открыть таймер дыхания и линии помощи.
  Никогда не платно, никогда не за функцией.

→ Простой язык. Без «трансформационных путешествий», без
  клинического жаргона. Уровень чтения шестой класс.

БЕСПЛАТНО НАВСЕГДА: дневник напитков, история, дни без алкоголя,
сэкономленные деньги, базовый дневник, биометрическая блокировка,
одно напоминание, полный экспорт (JSON + CSV) и все кризисные
ресурсы.

ПРЕМИУМ: корреляции настроение/напитки, несколько напоминаний,
PDF-отчёты, зашифрованная копия, свои пресеты напитков,
продвинутые визуализации, темы иконок и опциональные AI-инсайты.

— Навсегда: 69 $ один раз. Никакой подписочной ловушки.

Ваши данные остаются на вашем телефоне. Криптографически мы не
можем прочитать то, что вы записываете. Никакой рекламы, никакой
аналитики. Не сейчас, не когда мы будем прибыльными, никогда.
```

---

## "What's New" / release notes per locale

Used in App Store Connect → Version Information → "What's New in
this Version" field per locale. The generic version-launch text:

| Locale | Text |
|--------|------|
| en | `Initial App Store launch. Calm alcohol tracking with no third-party analytics, end-to-end encrypted backup, and crisis lines on every screen.` |
| es | `Lanzamiento inicial. Seguimiento tranquilo del alcohol sin analítica de terceros, copia cifrada de extremo a extremo y líneas de crisis en cada pantalla.` |
| fr | `Lancement initial. Suivi calme de l'alcool sans analytique tierce, sauvegarde chiffrée de bout en bout et lignes de crise sur chaque écran.` |
| de | `Erstveröffentlichung. Ruhiges Alkohol-Tracking ohne Drittanbieter-Analytik, mit Ende-zu-Ende-verschlüsseltem Backup und Krisen-Hotlines auf jedem Bildschirm.` |
| pl | `Pierwsze uruchomienie. Spokojne śledzenie alkoholu bez analityki firm trzecich, z kopią szyfrowaną end-to-end i liniami kryzysowymi na każdym ekranie.` |
| ru | `Первый запуск. Спокойный трекинг алкоголя без сторонней аналитики, с резервной копией со сквозным шифрованием и линиями помощи на каждом экране.` |

---

## Screenshot caption translations

Apple screenshots are uploaded per-locale and the captions are
text overlays burnt into each PNG. The R28-2 capture script supports
caption text via the `STORE_CAPTION` env var, so re-running the
script per locale produces a captioned set per language.

| # | Locale | Caption (matches R28-2 EN voice) |
|---|--------|----------------------------------|
| 1 | en | Today, in plain language. |
|   | es | Hoy, en lenguaje claro. |
|   | fr | Aujourd'hui, en langage clair. |
|   | de | Heute, in klarer Sprache. |
|   | pl | Dziś, w prostym języku. |
|   | ru | Сегодня, простыми словами. |
| 2 | en | Track without judgment. |
|   | es | Registra sin juicio. |
|   | fr | Suivez sans jugement. |
|   | de | Verfolgen ohne Urteil. |
|   | pl | Śledź bez oceniania. |
|   | ru | Отслеживайте без осуждения. |
| 3 | en | Set the goal you actually want. |
|   | es | Pon la meta que realmente quieres. |
|   | fr | Fixez l'objectif que vous voulez vraiment. |
|   | de | Setze das Ziel, das du wirklich willst. |
|   | pl | Ustaw cel, którego naprawdę chcesz. |
|   | ru | Поставьте цель, которую действительно хотите. |
| 4 | en | Insights you can prove are private. |
|   | es | Insights que puedes verificar son privados. |
|   | fr | Des insights vérifiablement privés. |
|   | de | Insights, deren Privatsphäre du beweisen kannst. |
|   | pl | Wglądy, których prywatność możesz zweryfikować. |
|   | ru | Инсайты, приватность которых можно проверить. |
| 5 | en | Help, on every screen, always free. |
|   | es | Ayuda en cada pantalla, siempre gratis. |
|   | fr | De l'aide, sur chaque écran, toujours gratuite. |
|   | de | Hilfe, auf jedem Bildschirm, immer kostenlos. |
|   | pl | Pomoc, na każdym ekranie, zawsze za darmo. |
|   | ru | Помощь на каждом экране, всегда бесплатно. |

---

## Owner-action checklist

Per locale, in App Store Connect:

- [ ] Switch language (App Information → Localizable Information).
- [ ] Set **App name**: `Alchohalt` (no change).
- [ ] Set **Subtitle**: per the 30-char picks above.
- [ ] Set **Keywords**: per the 100-char trimmed line above.
- [ ] Paste **Description**: focused or full per choice.
- [ ] Set **What's New**: per the release-notes line above.
- [ ] Upload screenshots: 5 per locale, per the captions above
      (re-run R28-2 capture script with the locale's STORE_CAPTION).

Estimated owner time per locale: ~10 minutes once the screenshots
are captured.

Estimated owner time for all 5 non-EN locales: ~50 minutes plus
native-speaker review (~30 min/locale = 2.5h total).
