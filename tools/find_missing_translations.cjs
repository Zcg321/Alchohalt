#!/usr/bin/env node
// Find translation keys present in en.json but missing from other locales.
// Each file is checked at the literal-flat-key level AND nested level —
// a key is "present" if either lookup path resolves.

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'locales');
const EN = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, 'en.json'), 'utf8'));
const TARGETS = ['es', 'fr', 'de', 'pl', 'ru'];

function flatKeys(obj, prefix = '') {
  const out = [];
  for (const k of Object.keys(obj)) {
    const full = prefix ? `${prefix}.${k}` : k;
    if (obj[k] && typeof obj[k] === 'object' && !Array.isArray(obj[k])) {
      out.push(...flatKeys(obj[k], full));
    } else {
      out.push(full);
    }
  }
  return out;
}

function lookup(obj, dotted) {
  if (Object.prototype.hasOwnProperty.call(obj, dotted)) return obj[dotted];
  const parts = dotted.split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = cur[p];
  }
  return cur;
}

function getValue(obj, dotted) {
  return lookup(obj, dotted);
}

const enKeys = flatKeys(EN);

for (const lng of TARGETS) {
  const filePath = path.join(LOCALES_DIR, `${lng}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const missing = enKeys.filter((k) => getValue(data, k) === undefined);
  console.log(`\n=== ${lng}.json — ${missing.length} missing keys (out of ${enKeys.length}) ===`);
  for (const k of missing) {
    const enVal = getValue(EN, k);
    if (typeof enVal === 'string') {
      console.log(`  ${k}: "${enVal}"`);
    } else {
      console.log(`  ${k}: ${JSON.stringify(enVal)}`);
    }
  }
}
