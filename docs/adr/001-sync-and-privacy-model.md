# ADR 001: Multi-Device Sync & Privacy Model

**Status:** Proposed  
**Date:** 2025-01-02  
**Decision Makers:** Development Team  

## Context

Alchohalt currently stores all data locally on-device using Capacitor Preferences. Users have requested multi-device synchronization to access their data across multiple devices (phone, tablet, web). However, the app's core value proposition is privacy and data security - all data stays on-device with no external servers.

We need to design a sync solution that:
1. Maintains the privacy-first approach
2. Enables cross-device data access
3. Doesn't require running our own backend servers
4. Provides end-to-end encryption
5. Is cost-effective to operate
6. Complies with privacy regulations (GDPR, CCPA, etc.)

## Decision

We will implement **client-side encrypted sync** using one of the following approaches:

### Option A: iCloud/Google Drive Sync (Recommended)
- Use platform-specific cloud storage (iCloud for iOS/macOS, Google Drive for Android/Web)
- Encrypt data client-side before upload
- Key derived from user PIN or device biometric
- No backend infrastructure needed
- Free for most users (within platform quotas)

**Pros:**
- No backend costs
- Platform-native integration
- Automatic backup
- User controls data location
- Works offline with eventual sync

**Cons:**
- Platform-specific implementation
- Limited cross-platform (iOS <-> Android requires manual export/import)
- Quota limitations

### Option B: CRDTs with WebRTC P2P Sync
- Use Conflict-Free Replicated Data Types (CRDTs) for automatic conflict resolution
- Direct peer-to-peer sync via WebRTC when devices are on same network
- Optional relay server for NAT traversal (can be third-party)
- All data encrypted end-to-end

**Pros:**
- True peer-to-peer
- No cloud storage needed
- Real-time sync when devices are together
- Cross-platform

**Cons:**
- Complex implementation
- Requires devices to be online simultaneously or relay server
- Larger app size (CRDT libraries)

### Option C: End-to-End Encrypted Backend (Future)
- Build minimal backend with end-to-end encryption
- Users generate encryption keys client-side
- Server only stores encrypted blobs
- Server never has access to encryption keys

**Pros:**
- Full cross-platform support
- Reliable sync (server always available)
- Better for scaling

**Cons:**
- Backend costs
- Ongoing maintenance
- Security responsibility
- Need to handle key recovery

## Recommendation

**Start with Option A (Platform Cloud Sync)** for initial implementation:
1. Implement iCloud sync for iOS/macOS users
2. Implement Google Drive sync for Android/Web users
3. Keep existing JSON export/import for cross-platform migration
4. Add local encryption as optional enhancement

**Migration Path:**
- Phase 1: Local encryption (Task 20 - current)
- Phase 2: iCloud sync (iOS)
- Phase 3: Google Drive sync (Android)
- Phase 4: If demand exists, evaluate Option C (encrypted backend)

## Local Encryption Design

### Key Derivation
```typescript
// User chooses: PIN or biometric
// Key derived from:
- User PIN (if app lock enabled) + salt
- Device-specific secure random (if no PIN)
- Biometric-backed secure enclave (iOS/Android)

// Use PBKDF2 or Argon2 for key derivation
const encryptionKey = await deriveKey(userSecret, salt, iterations);
```

### Encryption Method
- Algorithm: AES-256-GCM
- Random IV for each encryption
- Authentication tag included
- Key rotation support

### Storage
```typescript
interface EncryptedPayload {
  version: number;
  iv: string;        // Base64 encoded
  salt: string;      // Base64 encoded
  data: string;      // Encrypted + Base64 encoded
  tag: string;       // Authentication tag
}
```

### API Design
```typescript
class SecureStorage {
  async set(key: string, value: any): Promise<void>;
  async get(key: string): Promise<any | null>;
  async remove(key: string): Promise<void>;
  async enable(pin: string): Promise<void>;
  async disable(): Promise<void>;
  isEnabled(): boolean;
}
```

## Security Considerations

1. **Key Management:**
   - Keys never stored in plaintext
   - Key derivation uses strong salt and iterations
   - Option to backup encryption key (encrypted with recovery phrase)

2. **Threat Model:**
   - Protects against: Device theft, malware with file access, cloud backup exposure
   - Does NOT protect against: Compromised device (malware with memory access), rubber-hose cryptanalysis

3. **Recovery:**
   - User must remember PIN/recovery phrase
   - Lost PIN = lost data (by design - no backdoor)
   - Encourage regular exports as backup

4. **Performance:**
   - Encryption/decryption on read/write may add latency
   - Acceptable for small datasets (typical usage: <1MB)
   - Consider caching decrypted data in memory

## Implementation Plan

### Phase 1: Local Encryption (Current Task)
- [ ] Create `SecureStorage` wrapper
- [ ] Implement AES-256-GCM encryption
- [ ] Key derivation from PIN
- [ ] Optional enable/disable in settings
- [ ] Behind ENABLE_LOCAL_ENCRYPTION flag
- [ ] Unit tests for encryption/decryption

### Phase 2: iCloud Integration (Future)
- [ ] Capacitor plugin for iCloud key-value storage
- [ ] Encrypt before upload to iCloud
- [ ] Sync logic and conflict resolution
- [ ] Settings UI for sync enable/disable

### Phase 3: Google Drive Integration (Future)
- [ ] Capacitor plugin for Google Drive
- [ ] Similar encryption and sync logic
- [ ] Cross-platform export/import remains available

## Consequences

### Positive
- Users can optionally encrypt local data
- Foundation for future sync features
- Maintains privacy-first approach
- No backend costs
- Gradual rollout with feature flags

### Negative
- Added complexity
- Users must manage PIN/recovery
- Risk of data loss if PIN forgotten
- Performance impact (minimal)
- Platform-specific sync implementations

## Alternatives Considered

1. **No Encryption:** Simpler but less secure
2. **Firebase with encrypted payloads:** Backend costs, Google dependency
3. **Blockchain:** Overkill, expensive, slow
4. **Password manager API:** Limited availability, complex integration

## References

- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [Capacitor Secure Storage](https://capacitorjs.com/docs/apis/preferences)
- [iOS Keychain Services](https://developer.apple.com/documentation/security/keychain_services)
- [Android Keystore](https://developer.android.com/training/articles/keystore)
- [OWASP Mobile Security](https://owasp.org/www-project-mobile-security/)
