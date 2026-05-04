# Round 24 — Russian (ru) translator audit

Reviewer profile: Native RU speaker, Moscow, late-30s. Reads RU first, fluent EN.
Source file audited: `src/locales/ru.json`
EN baseline: `src/locales/en.json`

## Overall impression

The translation is grammatically clean, the plurals (one/few/many) are mostly correct, and the privacy/medical-disclaimer copy reads naturally — that's the hard part and it's done well. Where the file slips is in three predictable places:

1. A few **literal English calques** that no Russian writes ("оценка постоянства", "Локальные счётчики по {{n}} попытке", "квитанция доверия", "Ваше." as a tagline).
2. **Mixed register**: the body text uses formal "вы" consistently, which is right for this audience (adults reflecting on alcohol). But the **microcopy ("Готовы, когда вы готовы", "Так держать") leans warm, while a few imperatives ("Установите дневной лимит") feel bureaucratic**. A small tonal pass would help.
3. **English/abbreviation creep**: `AF`, `std`, `ABV`, `HALT`, `Crisis`, `blob`, `PWA`, `AI Insights`, `Premium`, `vs`. Some of these are unavoidable (`HALT`, `ABV`, `PWA`), but `AF` and `vs` are jarring inside Russian sentences and should be rendered.

No string would actively scare a Russian-speaking user away. There is **one cultural blocker** — the medical-disclaimer language about "scorую помощь" / Crisis tab — that needs adjustment because the link to a Russian-localized crisis number is structurally absent (this is a code-side issue surfaced by the locale review, not a string fix). Beyond that, blockers are limited to a handful of broken phrasings.

---

## Blockers

### B1. `marketing.shortTagline` — `"Без рекламы. Без аналитики. Ваше."`

- A standalone neuter "Ваше." with no noun is ungrammatical in Russian as a punchline. EN "Yours." works because English doesn't agree. RU needs an antecedent.
- A native speaker would write **"Только ваше."** or **"Всё — ваше."** or, best, **"Только для вас."**
- Severity: **blocker** (it reads like a translation bug)
- Ship as-is? **No.**

### B2. `marketing.tagline` and `settings.privacy.tagline` — `"Без рекламы. Без аналитики. С квитанцией доверия."`

- "Квитанция доверия" is a literal calque of "trust receipt." A Russian reader parses "квитанция" as a paper receipt from a shop or utility bill — it has no metaphoric "trust receipt" sense.
- A native phrasing: **"С доказательством на руках."** or **"С прозрачным доказательством."** — but better, drop the metaphor entirely: **"Без рекламы. Без аналитики. С открытым кодом."** (since the moat actually IS the open code + crypto — the "receipt" metaphor doesn't translate).
- Severity: **blocker** (the third clause is meaningless to RU readers)
- Ship as-is? **No.**

### B3. `marketing.moatLine` — `"Криптографически мы не можем прочитать то, что вы записываете."`

- "Криптографически" used as a sentence-initial adverb is grammatical but reads as machine translation. Russians don't lead with that adverb form.
- Native: **"Мы технически не можем прочитать ваши записи — это гарантирует шифрование."** or shorter: **"Шифрование устроено так, что мы не можем прочитать ваши записи."**
- Severity: **blocker** (this is the privacy promise, the headline string of the app — it has to land)
- Ship as-is? **No.**

### B4. `funnel.subtitleOne` — `"Локальные счётчики по {{n}} попытке. Никогда не передаются."`

- "Счётчики по попытке" doesn't parse. The EN ("counts across N attempt") is itself awkward but at least readable. The RU is broken — "по" + dative of "попытка" reads as "according to the attempt", not "across N attempts."
- Native: **"Локальные счётчики за {{n}} попытку. Никогда не передаются."** (за + accusative for "for/across N attempts")
- Same fix for `funnel.subtitleMany`: **"Локальные счётчики за {{n}} попыток. Никогда не передаются."**
- Severity: **blocker** (grammatically wrong)
- Ship as-is? **No.**

### B5. `medicalDisclaimer.emergency` — `"...немедленно свяжитесь со скорой помощью или медицинским специалистом. На вкладке Crisis есть прямые номера."`

- Two issues:
  - "Свяжитесь со скорой помощью" in Russia means **call 103 / 112**. A user in Moscow seeing "медицинский специалист" as the alternative will not know what to do — RU users want **"позвоните 112 или обратитесь к врачу"**.
  - **"вкладка Crisis"** — leaving the English word "Crisis" inside a Russian sentence is the worst kind of localization miss for a crisis-context string. Should be **"вкладка «Кризис»"** (and the tab itself needs renaming in code, but for the locale, the string must use the Russian label).
- Native rewrite: **"Если вы в неотложной ситуации или вам срочно нужна помощь с употреблением — немедленно позвоните 112 или обратитесь к врачу. На вкладке «Кризис» есть прямые номера."**
- Severity: **blocker** (this is the one string in the app that absolutely must work emotionally and operationally for a Russian speaker in distress)
- Ship as-is? **No.**

### B6. `eraseConfirm.typePrompt` / `typeWord` — `"Введите УДАЛИТЬ для подтверждения"` / `"УДАЛИТЬ"`

- Mechanically fine, but `eraseConfirm.confirmButton` is also "Удалить всё" — three near-duplicate variants of the same verb in one dialog. The "type to confirm" pattern in RU usually uses **"СТЕРЕТЬ"** to mirror the destructive contrast (стереть = wipe, удалить = delete-an-item). This separates "type the destruction word" from "confirm/cancel" verbs cleanly.
- Suggested: typePrompt = **"Введите СТЕРЕТЬ для подтверждения"**, typeWord = **"СТЕРЕТЬ"**.
- Severity: **blocker** (the confirmation pattern is broken — typing "УДАЛИТЬ" while a button also says "Удалить всё" defeats the safety mechanism)
- Ship as-is? **No.**

### B7. Plural mismatch in `bulk.deleteConfirm.few/many` confirms vs `bulk.selectionCount`

- `bulk.selectionCount.one`: "{{n}} напиток выбран" — masculine agreement is fine.
- `bulk.deleteConfirm.few`: **"Удалить {{n}} напитка?"** — correct (genitive sg with 2-4).
- `bulk.deleteConfirm.many`: **"Удалить {{n}} напитков?"** — correct (genitive pl with 5+).

These are actually fine. **But** `bulk.deleteConfirm.one` uses "этот напиток" while few/many do not have a demonstrative, which is correct and natural. **No fix needed** — I withdraw this from blockers. (Leaving the analysis in for transparency.)

---

## Style / nit issues (consider list)

### S1. `stats.points` and `goals.points` — `"Оценка постоянства"`

- "Оценка постоянства" is literal for "consistency score" but reads like a school grade for "being consistent." A Russian app would say **"Стабильность"** or **"Регулярность"** as a one-word metric label.
- Severity: nit

### S2. `stats.afStreak`, `goals.afStreak`, `stats.share.afStreak` — `"Серия AF"`

- "AF" is opaque to a Russian speaker. The expansion "alcohol-free" is itself recovered through context, but `AF` as a bare initialism reads like a typo.
- Recommended: **"Серия трезвости"** or **"Дни трезвости подряд"** (for share); for the chip, just **"Без алкоголя"**.
- Severity: nit (style) — but cumulative across ~8 strings, so **borderline blocker** for consistency.

### S3. `stats.std`, `history.stdDrinks`, `analytics.moodCorrelation.colMean` — `"std"`, `"Std напитки"`, `"Ср. std"`

- "std" is technical jargon (US/UK alcohol-research convention). Russian readers don't recognize it. The typical RU rendering is **"станд."** or **"станд. доза"**.
- Suggested: `history.stdDrinks` → **"Станд. дозы"**; `stats.std` → **"станд."**; `colMean` → **"Ср. станд."**
- Severity: style

### S4. `stats.vsPrev30d`, `stats.vsLastWeek`, `monthlyDelta.versus` — `"vs ..."` / `"vs"`

- Latin "vs" inside a Russian phrase is disruptive. Russian writes **"vs"** rarely; native would be **"в сравнении с"** or shorter **"к"** (e.g., "30д к пред. 30д").
- Suggested: `vsPrev30d` → **"к пред. 30 дням"**, `vsLastWeek` → **"к прошлой неделе"**, `monthlyDelta.versus` → **"к"**.
- Severity: style

### S5. `stats.softRestart.building` — `"{{count}} дней без алкоголя. Так держать."`

- "{{count}} дней" is the genitive-plural form, used for 5+. For 1, 2, 3, 4 days it will produce "1 дней / 2 дней" which is wrong. **This needs ICU plural keys** (one/few/many), not a single string.
- Severity: **blocker** (grammatical error for any value 1-4)
- Promoted to blocker — see B8 below.

### B8. `stats.softRestart.building` plural — see S5

- Same applies to: `stats.softRestart.restart` ("{{total}} дней без алкоголя"), and any other interpolated count using a fixed "дней."
- Without ICU plural keys these strings are wrong for n ∈ {1, 2, 3, 4, 21, 22, 23, 24, ...}. Russian speakers will absolutely notice "1 дней."
- Fix: split into `stats.softRestart.building.one|few|many` and use the existing plural infrastructure (e.g., the `unit.day.*` pattern already in the file).
- Severity: **blocker**.

### S6. `stats.daysShort` — `"дн."`

- Fine but a touch terse; "дн." is correct abbreviation for "дней." Keep.
- Severity: ship.

### S7. `onboarding.privacy.description` — `"Никто, включая нас, не видит ваши записи. Опциональные функции AI (выключены по умолчанию) — единственное, что может это изменить — управление в Настройки → AI."`

- Two awkward bits:
  - "управление в Настройки → AI" — "Настройки" should be locative ("в Настройках"), not nominative.
  - "единственное, что может это изменить" reads as a literal English construction; Russian prefers **"единственное исключение"**.
- Suggested: **"Никто, включая нас, не видит ваши записи. Единственное исключение — опциональные функции AI (выключены по умолчанию); управление в Настройках → AI."**
- Severity: nit (mostly grammar)

### S8. `onboarding.insights.description` — `"...может написать рефлексию по анонимизированной сводке."`

- "Написать рефлексию" is calque from "write a reflection." Native Russian would say **"написать комментарий"** or **"составить заметку"**. "Рефлексия" exists in RU but as a psychology term, not a UI noun.
- Suggested: **"...может составить короткую заметку по анонимизированной сводке."**
- Severity: nit

### S9. `onboarding.ready.title` — `"Готовы, когда вы готовы"`

- The repetition mirrors EN "Ready when you are" but in RU it's clunky. Russians don't repeat "готовы" this way.
- Suggested: **"Когда захотите — начнём."** or **"Начнём, когда вы готовы."**
- Severity: style

### S10. `onboarding.justLooking` — `"Просто покажите приложение"`

- EN "Just show me the app" is casual ("just show me around"). RU literal "Просто покажите приложение" sounds like the user is demanding a demo from an employee.
- Suggested: **"Просто посмотреть"** or **"Сначала осмотрюсь"**.
- Severity: nit

### S11. `subscription.coreFeatures` — `"Ядро — журналирование, история, серии, экономия, ресурсы кризиса — бесплатно навсегда."`

- "Журналирование" is a tech term (logging, as in software logs). Users won't connect it to "drink logging." Native: **"запись напитков"** or simply **"журнал"**.
- "Ресурсы кризиса" is a calque. Native: **"кризисная помощь"** or **"телефоны помощи"**.
- Suggested: **"Основа — журнал, история, серии, экономия, телефоны кризисной помощи — бесплатно навсегда."**
- Severity: nit-to-style

### S12. `intention_cope` — `"расслабиться"`

- EN source is "unwind" (the file mapped `_cope` → "unwind"). Russian "расслабиться" works well — emotionally honest, not clinical. **No change.** Good translation.
- Severity: ship.

### S13. `craving.low/high`, `halt_*`, `intention_*` — adjective gender

- All adjectives are nominative masculine singular ("голодный", "сердитый", "одинокий", "уставший"). Since the user may be of any gender, this can read as gendered. Russian apps usually use **adverbial / state forms** ("голоден", "зол", "одинок", "устал" — short masculine) OR **gender-neutral noun phrases** ("голод", "злость", "одиночество", "усталость").
- Recommended: switch HALT triggers to nouns (matches the EN concept of HALT-as-state better): **"голод", "злость", "одиночество", "усталость"**.
- Severity: style (but improves inclusivity meaningfully)

### S14. `bulk.scaleStd` — `"Масштабировать std…"`

- "Масштабировать std" is two unfortunate things at once. "Масштабировать" is engineering-speak; "std" is unrendered. Native: **"Пересчитать дозы…"** or **"Изменить дозы…"**.
- Severity: nit

### S15. `iconThemes.platformNote` — `"...когда выйдут нативные бинарные ассеты."`

- "Нативные бинарные ассеты" is full developer jargon transliterated. End users will not understand. Native: **"...когда мы выпустим обновление приложения для iOS / Android."**
- Severity: style

### S16. `privacy.onDevice` — `"...мы держим зашифрованный blob, а не содержимое."`

- "Blob" left in English mid-sentence. Native: **"мы храним только зашифрованный файл, а не его содержимое."**
- Severity: nit

### S17. `onboarding.tracking.description` — `"Отметьте время, тип, причину и ощущения — только то, что хотите."`

- "Только то, что хотите" is a hair too literal. Native softer: **"...только то, чем хотите поделиться."**
- Severity: nit

### S18. `monthlyDelta.empty` — `"Пока недостаточно истории. Вернитесь в следующем месяце."`

- "Вернитесь в следующем месяце" sounds like a closed shop sign. Native: **"Загляните через месяц."**
- Severity: nit

### S19. `progressCards.streak.daysFromThere` — `"{{days}} дней с этой точки"`

- "С этой точки" is calque of "from there." In RU: **"ещё {{days}} дней"** or **"осталось {{days}} дней"**.
- Also: "дней" is fixed, needs plural ICU split (same issue as B8).
- Severity: **blocker** for the plural; nit for the phrasing.

### S20. `progressCards.streak.nextMilestone` — `"Следующая отметка на {{days}} дне"`

- "На {{days}} дне" is correct only for ordinal-ish reading; for cardinals (which `{{days}}` is) it should be **"на {{days}}-м дне"** OR rephrased: **"Следующая веха — {{days}} день"** (also needs plural).
- Severity: style + plural concern.

### S21. `goalEvolution.subtitle` — `"День {{n}} без алкоголя. Что дальше?"`

- "День {{n}}" reads as headline but for n=1 it would be "День 1 без алкоголя" which is fine; for n=2 "День 2 без алкоголя" also OK. Acceptable.
- Severity: ship.

### S22. `selfExperiment.description` — `"Цель — сделать приложение прозрачным для самого пользователя."`

- "Для самого пользователя" with reflexive "сам" is awkward and slightly accusatory. Native: **"Цель — сделать приложение понятным для вас."**
- Severity: nit

### S23. `bulk.selectionCount.few/many` agreement

- "выбрано" (neuter short adj) is used with few/many while "выбран" (masc) is used with one. This is the standard Russian pattern (neuter for genitive plural counts) — **correct**.
- Severity: ship.

### S24. `tenure.days.other` and similar — `"{{count}} дня"` with "other" key

- ICU plural for Russian uses one/few/many (and optionally "other" as fallback). Setting `other` to "{{count}} дня" (genitive singular, the few-form) means any value not matching one/few/many will display incorrectly. Russian doesn't really use "other" — but if the i18n library falls back to `other`, this should match `many` for safety: **"{{count}} дней"**.
- Same for `tenure.months.other`, `tenure.years.other`, `unit.day.other`, etc.
- Severity: nit (defensive — depends on library behavior; if it always picks one/few/many for `ru`, this is moot)

---

## JSON patch — blocker fixes

```json
{
  "marketing.tagline": "Без рекламы. Без аналитики. Открытый код.",
  "marketing.shortTagline": "Без рекламы. Без аналитики. Только ваше.",
  "marketing.moatLine": "Шифрование устроено так, что мы не можем прочитать ваши записи.",
  "settings.privacy.tagline": "Без рекламы. Без аналитики. Открытый код.",
  "funnel.subtitleOne": "Локальные счётчики за {{n}} попытку. Никогда не передаются.",
  "funnel.subtitleMany": "Локальные счётчики за {{n}} попыток. Никогда не передаются.",
  "medicalDisclaimer.emergency": "Если вы в неотложной ситуации или вам срочно нужна помощь с употреблением — немедленно позвоните 112 или обратитесь к врачу. На вкладке «Кризис» есть прямые номера.",
  "eraseConfirm.typePrompt": "Введите СТЕРЕТЬ для подтверждения",
  "eraseConfirm.typeWord": "СТЕРЕТЬ",
  "stats.softRestart.restart.one": "Вы вернулись. {{total}} день без алкоголя.",
  "stats.softRestart.restart.few": "Вы вернулись. {{total}} дня без алкоголя.",
  "stats.softRestart.restart.many": "Вы вернулись. {{total}} дней без алкоголя.",
  "stats.softRestart.building.one": "{{count}} день без алкоголя. Так держать.",
  "stats.softRestart.building.few": "{{count}} дня без алкоголя. Так держать.",
  "stats.softRestart.building.many": "{{count}} дней без алкоголя. Так держать.",
  "progressCards.streak.daysFromThere.one": "ещё {{days}} день",
  "progressCards.streak.daysFromThere.few": "ещё {{days}} дня",
  "progressCards.streak.daysFromThere.many": "ещё {{days}} дней",
  "progressCards.streak.nextMilestone": "Следующая веха — {{days}}-й день"
}
```

> Note on the plural splits: applying these requires a small code change at the call sites (use the i18n plural API instead of a single key). If the developer prefers a stopgap, change the singular form to use `unit.day.*` interpolation. Do **not** ship "1 дней."

> Note on `medicalDisclaimer.emergency`: this also implies the Crisis tab label needs a Russian rendering ("Кризис") elsewhere in the codebase. If the tab is hardcoded in EN, the fix here is partial.

---

## Consider list (cheap, same commit)

```json
{
  "stats.points": "Стабильность",
  "goals.points": "Стабильность",
  "stats.afStreak": "Дни трезвости подряд",
  "goals.afStreak": "Дни трезвости подряд",
  "goals.longestStreak": "Самая длинная серия трезвости",
  "stats.share.afStreak": "Дни трезвости подряд",
  "stats.totalAFDays": "Всего дней трезвости",
  "stats.afDays30d": "Дни трезвости (30д)",
  "stats.afDaysLabel": "Дни трезвости",
  "retrospective.afDays": "Дни трезвости",
  "monthlyDelta.afDays": "Дни трезвости",
  "ribbon.afDays.one": "{{n}} день трезвости",
  "ribbon.afDays.few": "{{n}} дня трезвости",
  "ribbon.afDays.many": "{{n}} дней трезвости",
  "stats.vsPrev30d": "к пред. 30 дням",
  "stats.vsLastWeek": "к прошлой неделе",
  "monthlyDelta.versus": "к",
  "stats.std": "станд.",
  "history.stdDrinks": "Станд. дозы",
  "analytics.moodCorrelation.colMean": "Ср. станд.",
  "bulk.scaleStd": "Пересчитать дозы…",
  "halt_hungry": "голод",
  "halt_angry": "злость",
  "halt_lonely": "одиночество",
  "halt_tired": "усталость",
  "onboarding.privacy.description": "Никто, включая нас, не видит ваши записи. Единственное исключение — опциональные функции AI (выключены по умолчанию); управление в Настройках → AI.",
  "onboarding.insights.description": "Паттерны проявляются по мере записей — на вашем устройстве. Опциональный AI Insights (выключен, пока вы его не включите) может составить короткую заметку по анонимизированной сводке.",
  "onboarding.ready.title": "Когда захотите — начнём",
  "onboarding.justLooking": "Просто посмотреть",
  "onboarding.tracking.description": "Отметьте время, тип, причину и ощущения — только то, чем хотите поделиться.",
  "subscription.coreFeatures": "Основа — журнал, история, серии, экономия, телефоны кризисной помощи — бесплатно навсегда. Premium добавляет более глубокую аналитику, пользовательские шаблоны и больше.",
  "iconThemes.platformNote": "Веб-пользователи увидят изменения после переустановки PWA. Изменения для iOS / Android применятся, когда выйдет соответствующее обновление приложения.",
  "privacy.onDevice": "Записи хранятся в локальной памяти телефона. Ничто не покидает устройство само. Если вы включите облачное резервное копирование, файл шифруется сквозным ключом, известным только вашему устройству — мы храним только зашифрованный файл, а не его содержимое. Опциональные функции AI (выключены по умолчанию) — единственное исключение; см. Настройки → AI для полного потока данных.",
  "monthlyDelta.empty": "Пока недостаточно истории. Загляните через месяц.",
  "selfExperiment.description": "Всё, что показано ниже, находится на этом устройстве. Ничего не отправляется наружу, ни один сервис аналитики не имеет к этому доступа. Цель — сделать приложение понятным для вас."
}
```

Also worth fixing the `*.other` plural fallbacks to mirror the `many` form for safety:

```json
{
  "tenure.days.other": "{{count}} дней",
  "tenure.months.other": "{{count}} месяцев",
  "tenure.years.other": "{{count}} лет",
  "unit.day.other": "дней",
  "unit.drink.other": "напитков",
  "unit.entry.other": "записей",
  "unit.row.other": "строк",
  "unit.time.other": "раз",
  "unit.priorAnswer.other": "{{count}} предыдущих ответов"
}
```

---

## Ship verdict

**ship-with-listed-fixes**

The blockers are real but small in count (8) and the fixes are mechanical. The plural problems in `stats.softRestart.*` and `progressCards.streak.daysFromThere` will produce visible "1 дней" bugs that any RU user notices in the first session — those must land. The `medicalDisclaimer.emergency` fix is the most important culturally. The `marketing.*` taglines need rewording but are not user-blocking.

After applying B1–B8 the file is shippable. The "consider" list is cheap polish that brings the translation from "obviously translated" to "feels like it was written in Russian" — recommended same commit if the developer has 30 minutes.
