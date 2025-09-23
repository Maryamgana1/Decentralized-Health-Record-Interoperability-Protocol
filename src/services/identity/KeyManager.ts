import { randomBytes, createHash, pbkdf2Sync } from 'crypto';

/**
 * Key Manager for encryption key generation and management
 * Requirement 1.4: Generate encryption keys for patient health records
 * Requirement 7.2: Use cryptographically secure random number generation
 */

export interface KeyPair {
  publicKey: string;
  privateKey: string;
  keyHash: string;
}

export interface DerivedKey {
  key: Buffer;
  salt: Buffer;
  iterations: number;
}

export interface IKeyManager {
  /**
   * Generate a new encryption key pair for a patient
   * @param bnsName - Patient's BNS name for key derivation
   * @param passphrase - Optional passphrase for additional security
   * @returns Promise resolving to a new key pair
   */
  generateKeyPair(bnsName: string, passphrase?: string): Promise<KeyPair>;

  /**
   * Derive an encryption key from a passphrase and salt
   * @param passphrase - The passphrase to derive from
   * @param salt - Optional salt (will generate if not provided)
   * @param iterations - Number of PBKDF2 iterations (default: 100000)
   * @returns Derived key information
   */
  deriveKey(passphrase: string, salt?: Buffer, iterations?: number): DerivedKey;

  /**
   * Generate a cryptographically secure random key
   * @param length - Key length in bytes (default: 32 for AES-256)
   * @returns Random key as Buffer
   */
  generateSecureKey(length?: number): Buffer;

  /**
   * Create a hash of a key for verification purposes
   * @param key - The key to hash
   * @returns SHA-256 hash of the key as hex string
   */
  hashKey(key: string | Buffer): string;

  /**
   * Validate key strength and format
   * @param key - The key to validate
   * @returns True if key meets security requirements
   */
  validateKey(key: string | Buffer): boolean;

  /**
   * Rotate keys by generating new ones and providing migration path
   * @param oldKeyPair - The existing key pair to rotate
   * @param bnsName - Patient's BNS name
   * @param passphrase - Optional new passphrase
   * @returns New key pair and rotation metadata
   */
  rotateKeys(oldKeyPair: KeyPair, bnsName: string, passphrase?: string): Promise<{
    newKeyPair: KeyPair;
    rotationId: string;
    timestamp: Date;
  }>;
}

export class KeyManager implements IKeyManager {
  private readonly DEFAULT_KEY_LENGTH = 32; // 256 bits for AES-256
  private readonly DEFAULT_ITERATIONS = 100000; // PBKDF2 iterations
  private readonly MIN_KEY_LENGTH = 16; // Minimum 128 bits

  async generateKeyPair(bnsName: string, passphrase?: string): Promise<KeyPair> {
    try {
      // Generate a secure random private key
      const privateKeyBuffer = this.generateSecureKey(this.DEFAULT_KEY_LENGTH);
      
      // If passphrase is provided, derive additional entropy
      let finalPrivateKey = privateKeyBuffer;
      if (passphrase) {
        const derivedKey = this.deriveKey(passphrase + bnsName);
        // XOR the random key with derived key for additional entropy
        finalPrivateKey = Buffer.alloc(this.DEFAULT_KEY_LENGTH);
        for (let i = 0; i < this.DEFAULT_KEY_LENGTH; i++) {
          finalPrivateKey[i] = privateKeyBuffer[i] ^ derivedKey.key[i % derivedKey.key.length];
        }
      }

      const privateKey = finalPrivateKey.toString('hex');
      
      // Generate public key (for this implementation, we'll use a derived public key)
      // In a real implementation, you'd use proper elliptic curve cryptography
      const publicKeyHash = createHash('sha256')
        .update(finalPrivateKey)
        .update(bnsName)
        .digest();
      const publicKey = publicKeyHash.toString('hex');

      const keyHash = this.hashKey(privateKey);

      return {
        publicKey,
        privateKey,
        keyHash
      };
    } catch (error) {
      throw new Error(`Failed to generate key pair: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  deriveKey(passphrase: string, salt?: Buffer, iterations: number = this.DEFAULT_ITERATIONS): DerivedKey {
    try {
      const actualSalt = salt || randomBytes(32);
      const key = pbkdf2Sync(passphrase, actualSalt, iterations, this.DEFAULT_KEY_LENGTH, 'sha256');
      
      return {
        key,
        salt: actualSalt,
        iterations
      };
    } catch (error) {
      throw new Error(`Failed to derive key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  generateSecureKey(length: number = this.DEFAULT_KEY_LENGTH): Buffer {
    if (length < this.MIN_KEY_LENGTH) {
      throw new Error(`Key length must be at least ${this.MIN_KEY_LENGTH} bytes`);
    }
    
    try {
      return randomBytes(length);
    } catch (error) {
      throw new Error(`Failed to generate secure key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  hashKey(key: string | Buffer): string {
    try {
      const keyBuffer = typeof key === 'string' ? Buffer.from(key, 'hex') : key;
      return createHash('sha256').update(keyBuffer).digest('hex');
    } catch (error) {
      throw new Error(`Failed to hash key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  validateKey(key: string | Buffer): boolean {
    try {
      const keyBuffer = typeof key === 'string' ? Buffer.from(key, 'hex') : key;
      
      // Check minimum length
      if (keyBuffer.length < this.MIN_KEY_LENGTH) {
        return false;
      }

      // Check for all zeros (weak key)
      if (keyBuffer.every(byte => byte === 0)) {
        return false;
      }

      // Check for all ones (weak key)
      if (keyBuffer.every(byte => byte === 255)) {
        return false;
      }

      // Basic entropy check - ensure not all bytes are the same
      const firstByte = keyBuffer[0];
      if (keyBuffer.every(byte => byte === firstByte)) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  async rotateKeys(oldKeyPair: KeyPair, bnsName: string, passphrase?: string): Promise<{
    newKeyPair: KeyPair;
    rotationId: string;
    timestamp: Date;
  }> {
    try {
      // Generate new key pair
      const newKeyPair = await this.generateKeyPair(bnsName, passphrase);
      
      // Create rotation ID for tracking
      const rotationId = createHash('sha256')
        .update(oldKeyPair.keyHash)
        .update(newKeyPair.keyHash)
        .update(Date.now().toString())
        .digest('hex');

      return {
        newKeyPair,
        rotationId,
        timestamp: new Date()
      };
    } catch (error) {
      throw new Error(`Failed to rotate keys: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}