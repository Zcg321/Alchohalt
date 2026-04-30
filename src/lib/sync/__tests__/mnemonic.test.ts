import { describe, expect, it } from 'vitest';
import {
  generate,
  decode,
  entropyToWords,
  seedFromMnemonic,
  masterKeyFromMnemonic,
} from '../mnemonic';
import { BIP39_ENGLISH } from '../wordlist';

describe('[SYNC-1] mnemonic.ts — BIP-39 12-word recovery', () => {
  it('vendored wordlist is 2048 words and stable at the boundaries', () => {
    expect(BIP39_ENGLISH.length).toBe(2048);
    expect(BIP39_ENGLISH[0]).toBe('abandon');
    expect(BIP39_ENGLISH[2047]).toBe('zoo');
  });

  it('generate() returns 12 words, all from the BIP-39 list', async () => {
    const words = await generate();
    expect(words.length).toBe(12);
    for (const w of words) expect(BIP39_ENGLISH).toContain(w);
  });

  it('generate() yields fresh entropy each call', async () => {
    const a = await generate();
    const b = await generate();
    expect(a.join(' ')).not.toBe(b.join(' '));
  });

  it('decode roundtrips entropyToWords output', async () => {
    const entropy = new Uint8Array([
      0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd, 0xef,
      0xfe, 0xdc, 0xba, 0x98, 0x76, 0x54, 0x32, 0x10,
    ]);
    const words = await entropyToWords(entropy);
    const back = await decode(words);
    expect(Array.from(back)).toEqual(Array.from(entropy));
  });

  it('decode rejects an unknown word', async () => {
    const words = (await generate()).slice();
    words[5] = 'notarealword';
    await expect(decode(words)).rejects.toThrow(/Unknown word/);
  });

  it('decode rejects a checksum-corrupted mnemonic', async () => {
    const words = await generate();
    // Replace the last word (which carries the checksum bits) with a
    // different real word — extremely likely to break the checksum.
    const replacement =
      BIP39_ENGLISH[(BIP39_ENGLISH.indexOf(words[11]!) + 1) % 2048]!;
    const tampered = [...words.slice(0, 11), replacement];
    await expect(decode(tampered)).rejects.toThrow(/checksum/i);
  });

  it('seedFromMnemonic is deterministic', async () => {
    const words = await generate();
    const s1 = await seedFromMnemonic(words);
    const s2 = await seedFromMnemonic(words);
    expect(s1.length).toBe(64);
    expect(Array.from(s1)).toEqual(Array.from(s2));
  });

  it('masterKeyFromMnemonic is deterministic and 32 bytes', async () => {
    const words = await generate();
    const k1 = await masterKeyFromMnemonic(words);
    const k2 = await masterKeyFromMnemonic(words);
    expect(k1.length).toBe(32);
    expect(Array.from(k1)).toEqual(Array.from(k2));
  });

  it('masterKeyFromMnemonic differs across different mnemonics', async () => {
    const w1 = await generate();
    const w2 = await generate();
    const k1 = await masterKeyFromMnemonic(w1);
    const k2 = await masterKeyFromMnemonic(w2);
    expect(Array.from(k1)).not.toEqual(Array.from(k2));
  });

  it('matches the BIP-39 reference vector for the all-zero entropy', async () => {
    // BIP-39 spec test vector — entropy = 16 zero bytes.
    const entropy = new Uint8Array(16);
    const words = await entropyToWords(entropy);
    expect(words).toEqual([
      'abandon', 'abandon', 'abandon', 'abandon',
      'abandon', 'abandon', 'abandon', 'abandon',
      'abandon', 'abandon', 'abandon', 'about',
    ]);
    const back = await decode(words);
    expect(Array.from(back)).toEqual(Array.from(entropy));
  });
}, { timeout: 30_000 });
