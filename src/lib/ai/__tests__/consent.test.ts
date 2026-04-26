import { afterEach, describe, expect, it } from 'vitest';
import {
  hasValidConsent,
  useAIConsentStore,
} from '../consent';
import { CURRENT_DISCLOSURE_VERSION, type AIConsentState } from '../types';

afterEach(() => {
  useAIConsentStore.getState().reset();
});

const FRESH: AIConsentState = {
  granted: false,
  grantedAt: null,
  revokedAt: null,
  disclosureVersion: 0,
  instanceId: '',
  provider: null,
};

describe('AI consent — fresh install', () => {
  it('starts with no consent and no instanceId', () => {
    const c = useAIConsentStore.getState().consent;
    expect(c.granted).toBe(false);
    expect(c.instanceId).toBe('');
    expect(c.provider).toBeNull();
    expect(hasValidConsent(c)).toBe(false);
  });
});

describe('AI consent — grant', () => {
  it('granting flips granted=true, sets disclosureVersion, generates instanceId', () => {
    useAIConsentStore.getState().grant('anthropic');
    const c = useAIConsentStore.getState().consent;
    expect(c.granted).toBe(true);
    expect(c.disclosureVersion).toBe(CURRENT_DISCLOSURE_VERSION);
    expect(c.instanceId).toMatch(/^[0-9a-f]{32}$/);
    expect(c.provider).toBe('anthropic');
    expect(hasValidConsent(c)).toBe(true);
  });

  it('regranting after revoke generates a NEW instanceId (rotation)', () => {
    useAIConsentStore.getState().grant('anthropic');
    const first = useAIConsentStore.getState().consent.instanceId;
    useAIConsentStore.getState().revoke();
    expect(useAIConsentStore.getState().consent.instanceId).toBe('');
    useAIConsentStore.getState().grant('anthropic');
    const second = useAIConsentStore.getState().consent.instanceId;
    expect(second).toMatch(/^[0-9a-f]{32}$/);
    expect(second).not.toBe(first);
  });
});

describe('AI consent — revoke', () => {
  it('revoke wipes instanceId + provider, sets revokedAt, granted=false', () => {
    useAIConsentStore.getState().grant('anthropic');
    useAIConsentStore.getState().revoke();
    const c = useAIConsentStore.getState().consent;
    expect(c.granted).toBe(false);
    expect(c.instanceId).toBe('');
    expect(c.provider).toBeNull();
    expect(c.revokedAt).not.toBeNull();
    expect(hasValidConsent(c)).toBe(false);
  });
});

describe('AI consent — hasValidConsent', () => {
  it('returns false when granted=false', () => {
    expect(hasValidConsent(FRESH)).toBe(false);
  });

  it('returns false when disclosureVersion is stale', () => {
    expect(
      hasValidConsent({
        ...FRESH,
        granted: true,
        grantedAt: Date.now(),
        disclosureVersion: CURRENT_DISCLOSURE_VERSION - 1,
        instanceId: 'a'.repeat(32),
        provider: 'anthropic',
      }),
    ).toBe(false);
  });

  it('returns false when instanceId is empty even if granted=true', () => {
    expect(
      hasValidConsent({
        ...FRESH,
        granted: true,
        grantedAt: Date.now(),
        disclosureVersion: CURRENT_DISCLOSURE_VERSION,
        instanceId: '',
        provider: 'anthropic',
      }),
    ).toBe(false);
  });

  it('returns false when revokedAt is newer than grantedAt', () => {
    expect(
      hasValidConsent({
        ...FRESH,
        granted: true,
        grantedAt: 1000,
        revokedAt: 2000,
        disclosureVersion: CURRENT_DISCLOSURE_VERSION,
        instanceId: 'a'.repeat(32),
        provider: 'anthropic',
      }),
    ).toBe(false);
  });
});
