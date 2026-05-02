#!/usr/bin/env node
/**
 * [R10-D] Generate a side-by-side translation review document for fr/de
 * native translators. Reads en/es/fr/de locales, flattens, sorts by
 * surface (key prefix), and writes a Markdown doc with tone notes per
 * surface.
 *
 * Usage: node tools/translation/generate_review_doc.cjs
 *
 * Output: docs/translation/review-{date}.md
 *
 * The owner can hand this doc to a native French and a native German
 * translator. They review row-by-row, mark concerns inline, and return
 * it. The "Notes" column on each row carries register guidance ("warm,
 * informal du/tu" vs "clinical neutral") so the translator doesn't lose
 * context for short keys.
 */
const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.resolve(__dirname, '..', '..', 'src', 'locales');
const OUT_DIR = path.resolve(__dirname, '..', '..', 'docs', 'translation');

function loadLocale(name) {
  const p = path.join(LOCALES_DIR, `${name}.json`);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function flatten(obj, prefix = '') {
  const out = {};
  for (const key of Object.keys(obj)) {
    const v = obj[key];
    const next = prefix ? `${prefix}.${key}` : key;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(out, flatten(v, next));
    } else {
      out[next] = String(v);
    }
  }
  return out;
}

/**
 * Tone guidance per surface prefix. The translator gets this so they
 * can pick register correctly without re-deriving it from short keys.
 */
const TONE_BY_SURFACE = {
  appName: 'Brand. Do not translate. "alchohalt" stays as-is in all locales.',
  diagnostics:
    'Calm clinical voice. The user is reading their own audit-trail data. Avoid emotional language. Numbers are facts, not judgements.',
  goalEvolution:
    'Warm trusted-friend voice. The user just hit a milestone — congratulate without exuberance. "Outgrew this goal" not "WAY TO GO!". Conversational register: French tu / German du.',
  goalTemplates:
    'Calm helpful voice. The user is picking from a menu of starting shapes. Avoid sounding prescriptive. Sentence-case, no exclamation marks.',
  monthlyDelta:
    'Factual, no judgement. The data speaks for itself. Numbers are reported, not editorialized. "Down 26%" is the right register; "Great job, you cut down 26%!" is not.',
  privacy:
    'Direct, no jargon. The user is verifying a privacy claim — clarity beats sophistication. Avoid crypto vocabulary unless mirroring the source.',
  paywall:
    'Soft transactional. Premium framing without pressure. Cancellation phrasing should reassure, not threaten.',
  stats:
    'Compact tabular labels. Often used as column headers — keep short, sentence-case, no period.',
  money: 'Compact tabular labels with currency-aware framing.',
  analytics: 'Tabular + chart legends. Match register to stats above.',
  iconThemes: 'Settings-section voice: helpful, neutral.',
  medicalDisclaimer:
    'Required-disclaimer voice. Tone is direct without alarm. Use the formal-without-stiff register that works in legal disclosures (French: tu acceptable here despite formality, German: du.).',
  subscription: 'Soft transactional. Mirror paywall register.',
  support: 'Warm, makes the user feel heard. Avoid corporate "thank you for reaching out".',
  openSource:
    'Calm honest voice. The fact of being open source is an artifact, not a brag.',
  goal: 'Goal-setting voice: calm, no streak-pressure, no exclamation marks.',
};

function toneFor(key) {
  const surface = key.split('.')[0];
  return TONE_BY_SURFACE[surface] || 'No specific tone note. Match calm trusted-friend baseline.';
}

function main() {
  const en = flatten(loadLocale('en'));
  const es = flatten(loadLocale('es'));
  const fr = flatten(loadLocale('fr'));
  const de = flatten(loadLocale('de'));

  const date = new Date().toISOString().slice(0, 10);
  const allKeys = Array.from(new Set([
    ...Object.keys(en), ...Object.keys(es), ...Object.keys(fr), ...Object.keys(de)
  ])).sort();

  // Group by surface (top-level key)
  const surfaces = {};
  for (const k of allKeys) {
    const surface = k.split('.')[0];
    surfaces[surface] = surfaces[surface] || [];
    surfaces[surface].push(k);
  }

  const lines = [];
  lines.push('# Native fr / de translation review');
  lines.push('');
  lines.push(`Generated: ${date}`);
  lines.push('');
  lines.push('## How to review');
  lines.push('');
  lines.push('Each surface (top-level key) has its own section with a tone note.');
  lines.push('Read the note first — it tells you which register to apply.');
  lines.push('');
  lines.push(
    'For each row, compare the English source to the current French / German'
  );
  lines.push(
    'translation. If the translation is correct and lands in the right tone,'
  );
  lines.push('leave it. If not, write your suggestion in the **Notes** column.');
  lines.push('');
  lines.push('The English column is the source of truth. Spanish is included as');
  lines.push("reference (it's been reviewed) — useful for picking up nuance the");
  lines.push('English text leaves implicit.');
  lines.push('');
  lines.push('Variables like `{{n}}` and `{{count}}` MUST be preserved verbatim.');
  lines.push('Order can be rearranged inside the sentence; the variable itself');
  lines.push('cannot be translated or pluralized away.');
  lines.push('');
  lines.push('## Coverage stats');
  lines.push('');
  lines.push(`- **Total keys:** ${allKeys.length}`);
  lines.push(`- **English (source):** ${Object.keys(en).length}`);
  lines.push(`- **Spanish (reviewed):** ${Object.keys(es).length}`);
  lines.push(`- **French (machine pass — needs native review):** ${Object.keys(fr).length}`);
  lines.push(`- **German (machine pass — needs native review):** ${Object.keys(de).length}`);
  lines.push('');

  for (const surface of Object.keys(surfaces).sort()) {
    const keys = surfaces[surface];
    lines.push(`## \`${surface}\` (${keys.length} key${keys.length === 1 ? '' : 's'})`);
    lines.push('');
    lines.push(`> **Tone:** ${toneFor(surface)}`);
    lines.push('');
    lines.push('| Key | English | Spanish | French | German | Notes |');
    lines.push('| --- | --- | --- | --- | --- | --- |');
    for (const k of keys.sort()) {
      // Escape backslash FIRST so we don't double-escape the pipes we
      // insert next. Then handle pipes (Markdown table separator) and
      // newlines. Order matters: escaping backslashes after pipe
      // escaping would turn `\|` into `\\|`.
      const cell = (s) =>
        (s ?? '')
          .replace(/\\/g, '\\\\')
          .replace(/\|/g, '\\|')
          .replace(/\r?\n/g, ' ')
          .trim();
      lines.push(
        `| \`${k}\` | ${cell(en[k])} | ${cell(es[k])} | ${cell(fr[k])} | ${cell(de[k])} |  |`
      );
    }
    lines.push('');
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const outPath = path.join(OUT_DIR, `review-${date}.md`);
  fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
  console.log(`Wrote ${outPath}`);
  console.log(`  ${allKeys.length} keys across ${Object.keys(surfaces).length} surfaces`);
}

main();
