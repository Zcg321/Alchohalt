/**
 * Secure Storage Wrapper (Task 20)
 * Optional local data encryption with AES-256-GCM
 * Key derived from user PIN or device-specific secure random
 * Behind ENABLE_LOCAL_ENCRYPTION flag
 */

import { Preferences } from '@capacitor/preferences';

interface EncryptedPayload {
  version: number;
  iv: string;        // Base64 encoded initialization vector
  salt: string;      // Base64 encoded salt for key derivation
  data: string;      // Encrypted + Base64 encoded data
  tag: string;       // Authentication tag (GCM)
}

const ENCRYPTION_KEY_STORAGE = 'alchohalt.encryption.enabled';
const ENCRYPTION_SALT_STORAGE = 'alchohalt.encryption.salt';
const PBKDF2_ITERATIONS = 100000;
const CURRENT_VERSION = 1;

/**
 * SecureStorage - Drop-in encrypted storage wrapper
 * Uses AES-256-GCM for encryption with PBKDF2 key derivation
 */
export class SecureStorage {
  private encryptionKey: CryptoKey | null = null;
  private enabled: boolean = false;

  constructor() {
    this.checkEnabled();
  }

  /**
   * Check if encryption is enabled
   */
  async checkEnabled(): Promise<boolean> {
    const { value } = await Preferences.get({ key: ENCRYPTION_KEY_STORAGE });
    this.enabled = value === 'true';
    return this.enabled;
  }

  /**
   * Enable encryption with a PIN
   */
  async enable(pin: string): Promise<void> {
    if (pin.length < 4) {
      throw new Error('PIN must be at least 4 characters');
    }

    // Generate salt if not exists
    let salt = await this.getSalt();
    if (!salt) {
      salt = this.generateSalt();
      await this.storeSalt(salt);
    }

    // Derive encryption key from PIN
    this.encryptionKey = await this.deriveKey(pin, salt);
    
    // Mark encryption as enabled
    await Preferences.set({ key: ENCRYPTION_KEY_STORAGE, value: 'true' });
    this.enabled = true;
  }

  /**
   * Disable encryption
   */
  async disable(): Promise<void> {
    this.encryptionKey = null;
    this.enabled = false;
    await Preferences.remove({ key: ENCRYPTION_KEY_STORAGE });
    await Preferences.remove({ key: ENCRYPTION_SALT_STORAGE });
  }

  /**
   * Check if encryption is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Set a value (encrypted if enabled)
   */
  async set(key: string, value: unknown): Promise<void> {
    const stringValue = JSON.stringify(value);

    if (this.enabled && this.encryptionKey) {
      const encrypted = await this.encrypt(stringValue);
      await Preferences.set({ 
        key, 
        value: JSON.stringify(encrypted) 
      });
    } else {
      await Preferences.set({ key, value: stringValue });
    }
  }

  /**
   * Get a value (decrypted if enabled)
   */
  async get(key: string): Promise<unknown | null> {
    const { value } = await Preferences.get({ key });
    
    if (!value) {
      return null;
    }

    if (this.enabled && this.encryptionKey) {
      try {
        const encrypted: EncryptedPayload = JSON.parse(value);
        const decrypted = await this.decrypt(encrypted);
        return JSON.parse(decrypted);
      } catch (error) {
        console.error('Failed to decrypt value:', error);
        throw new Error('Decryption failed. Wrong PIN or corrupted data.');
      }
    } else {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
  }

  /**
   * Remove a value
   */
  async remove(key: string): Promise<void> {
    await Preferences.remove({ key });
  }

  /**
   * Initialize encryption key from PIN
   */
  async initialize(pin: string): Promise<boolean> {
    const salt = await this.getSalt();
    
    if (!salt) {
      return false;
    }

    try {
      this.encryptionKey = await this.deriveKey(pin, salt);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Encrypt data
   */
  private async encrypt(data: string): Promise<EncryptedPayload> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized');
    }

    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Encrypt data
    const encodedData = new TextEncoder().encode(data);
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv
      },
      this.encryptionKey,
      encodedData
    );

    // Get salt for payload
    const salt = await this.getSalt();

    return {
      version: CURRENT_VERSION,
      iv: this.arrayBufferToBase64(iv),
      salt: salt || '',
      data: this.arrayBufferToBase64(encrypted),
      tag: '' // GCM includes tag in ciphertext
    };
  }

  /**
   * Decrypt data
   */
  private async decrypt(payload: EncryptedPayload): Promise<string> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized');
    }

    // Decode IV and data
    const iv = this.base64ToArrayBuffer(payload.iv);
    const encryptedData = this.base64ToArrayBuffer(payload.data);

    // Decrypt data
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv
      },
      this.encryptionKey,
      encryptedData
    );

    return new TextDecoder().decode(decrypted);
  }

  /**
   * Derive encryption key from PIN using PBKDF2
   */
  private async deriveKey(pin: string, salt: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const pinData = encoder.encode(pin);
    const saltData = this.base64ToArrayBuffer(salt);

    // Import PIN as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      pinData,
      'PBKDF2',
      false,
      ['deriveKey']
    );

    // Derive AES key
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltData,
        iterations: PBKDF2_ITERATIONS,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Generate random salt
   */
  private generateSalt(): string {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    return this.arrayBufferToBase64(salt);
  }

  /**
   * Get stored salt
   */
  private async getSalt(): Promise<string | null> {
    const { value } = await Preferences.get({ key: ENCRYPTION_SALT_STORAGE });
    return value;
  }

  /**
   * Store salt
   */
  private async storeSalt(salt: string): Promise<void> {
    await Preferences.set({ key: ENCRYPTION_SALT_STORAGE, value: salt });
  }

  /**
   * Convert ArrayBuffer to Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert Base64 to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}

// Singleton instance
let secureStorageInstance: SecureStorage | null = null;

/**
 * Get SecureStorage instance
 */
export function getSecureStorage(): SecureStorage {
  if (!secureStorageInstance) {
    secureStorageInstance = new SecureStorage();
  }
  return secureStorageInstance;
}
