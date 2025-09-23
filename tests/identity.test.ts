import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BNSResolver, KeyManager, PatientIdentity } from '../src/services/identity';

describe('BNSResolver', () => {
  let bnsResolver: BNSResolver;

  beforeEach(() => {
    bnsResolver = new BNSResolver();
  });

  describe('verifyBNSName', () => {
    it('should return null for non-existent BNS name', async () => {
      // Mock fetch to return 404
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      const result = await bnsResolver.verifyBNSName('nonexistent.btc');
      expect(result).toBeNull();
    });

    it('should return BNS info for valid name', async () => {
      const mockBNSData = {
        name: 'test',
        namespace: 'btc',
        address: 'SP1ABC123DEF456',
        zonefile: 'test zonefile',
        last_txid_height: 12345
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockBNSData)
      });

      const result = await bnsResolver.verifyBNSName('test.btc');
      expect(result).toEqual({
        name: 'test',
        namespace: 'btc',
        owner: 'SP1ABC123DEF456',
        zonefile: 'test zonefile',
        address: 'SP1ABC123DEF456',
        blockHeight: 12345,
        expireBlock: undefined
      });
    });

    it('should throw error for invalid BNS name format', async () => {
      await expect(bnsResolver.verifyBNSName('invalid-name')).rejects.toThrow(
        'Invalid BNS name format: invalid-name'
      );
    });

    it('should handle API errors gracefully', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      await expect(bnsResolver.verifyBNSName('test.btc')).rejects.toThrow(
        'BNS API error: 500 Internal Server Error'
      );
    });
  });

  describe('verifyOwnership', () => {
    it('should return true for correct owner', async () => {
      const mockBNSData = {
        name: 'test',
        namespace: 'btc',
        address: 'SP1ABC123DEF456',
        zonefile: 'test zonefile',
        last_txid_height: 12345
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockBNSData)
      });

      const result = await bnsResolver.verifyOwnership('test.btc', 'SP1ABC123DEF456');
      expect(result).toBe(true);
    });

    it('should return false for incorrect owner', async () => {
      const mockBNSData = {
        name: 'test',
        namespace: 'btc',
        address: 'SP1ABC123DEF456',
        zonefile: 'test zonefile',
        last_txid_height: 12345
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockBNSData)
      });

      const result = await bnsResolver.verifyOwnership('test.btc', 'SP1DIFFERENT123');
      expect(result).toBe(false);
    });

    it('should return false for non-existent name', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      const result = await bnsResolver.verifyOwnership('nonexistent.btc', 'SP1ABC123DEF456');
      expect(result).toBe(false);
    });
  });

  describe('getOwner', () => {
    it('should return owner for valid BNS name', async () => {
      const mockBNSData = {
        name: 'test',
        namespace: 'btc',
        address: 'SP1ABC123DEF456',
        zonefile: 'test zonefile',
        last_txid_height: 12345
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockBNSData)
      });

      const result = await bnsResolver.getOwner('test.btc');
      expect(result).toBe('SP1ABC123DEF456');
    });

    it('should return null for non-existent name', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      const result = await bnsResolver.getOwner('nonexistent.btc');
      expect(result).toBeNull();
    });
  });
});

describe('KeyManager', () => {
  let keyManager: KeyManager;

  beforeEach(() => {
    keyManager = new KeyManager();
  });

  describe('generateKeyPair', () => {
    it('should generate valid key pair', async () => {
      const keyPair = await keyManager.generateKeyPair('test.btc');
      
      expect(keyPair.publicKey).toBeDefined();
      expect(keyPair.privateKey).toBeDefined();
      expect(keyPair.keyHash).toBeDefined();
      expect(keyPair.publicKey).toMatch(/^[0-9a-f]+$/);
      expect(keyPair.privateKey).toMatch(/^[0-9a-f]+$/);
      expect(keyPair.keyHash).toMatch(/^[0-9a-f]+$/);
    });

    it('should generate different keys for different BNS names', async () => {
      const keyPair1 = await keyManager.generateKeyPair('test1.btc');
      const keyPair2 = await keyManager.generateKeyPair('test2.btc');
      
      expect(keyPair1.publicKey).not.toBe(keyPair2.publicKey);
      expect(keyPair1.privateKey).not.toBe(keyPair2.privateKey);
      expect(keyPair1.keyHash).not.toBe(keyPair2.keyHash);
    });

    it('should generate different keys with passphrase', async () => {
      const keyPair1 = await keyManager.generateKeyPair('test.btc');
      const keyPair2 = await keyManager.generateKeyPair('test.btc', 'passphrase');
      
      expect(keyPair1.publicKey).not.toBe(keyPair2.publicKey);
      expect(keyPair1.privateKey).not.toBe(keyPair2.privateKey);
    });
  });

  describe('deriveKey', () => {
    it('should derive consistent key from same passphrase and salt', () => {
      const salt = Buffer.from('test-salt');
      const key1 = keyManager.deriveKey('password', salt, 1000);
      const key2 = keyManager.deriveKey('password', salt, 1000);
      
      expect(key1.key.equals(key2.key)).toBe(true);
      expect(key1.salt.equals(key2.salt)).toBe(true);
      expect(key1.iterations).toBe(key2.iterations);
    });

    it('should derive different keys from different passphrases', () => {
      const salt = Buffer.from('test-salt');
      const key1 = keyManager.deriveKey('password1', salt);
      const key2 = keyManager.deriveKey('password2', salt);
      
      expect(key1.key.equals(key2.key)).toBe(false);
    });

    it('should generate random salt if not provided', () => {
      const key1 = keyManager.deriveKey('password');
      const key2 = keyManager.deriveKey('password');
      
      expect(key1.salt.equals(key2.salt)).toBe(false);
    });
  });

  describe('generateSecureKey', () => {
    it('should generate key of specified length', () => {
      const key = keyManager.generateSecureKey(16);
      expect(key.length).toBe(16);
    });

    it('should generate different keys on each call', () => {
      const key1 = keyManager.generateSecureKey();
      const key2 = keyManager.generateSecureKey();
      
      expect(key1.equals(key2)).toBe(false);
    });

    it('should throw error for keys that are too short', () => {
      expect(() => keyManager.generateSecureKey(8)).toThrow(
        'Key length must be at least 16 bytes'
      );
    });
  });

  describe('hashKey', () => {
    it('should generate consistent hash for same key', () => {
      const key = Buffer.from('test-key', 'utf8').toString('hex');
      const hash1 = keyManager.hashKey(key);
      const hash2 = keyManager.hashKey(key);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[0-9a-f]{64}$/); // SHA-256 hex
    });

    it('should generate different hashes for different keys', () => {
      const key1 = Buffer.from('key1', 'utf8').toString('hex');
      const key2 = Buffer.from('key2', 'utf8').toString('hex');
      const hash1 = keyManager.hashKey(key1);
      const hash2 = keyManager.hashKey(key2);
      
      expect(hash1).not.toBe(hash2);
    });

    it('should handle Buffer input', () => {
      const keyBuffer = Buffer.from('test-key');
      const hash = keyManager.hashKey(keyBuffer);
      
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  describe('validateKey', () => {
    it('should validate strong keys', () => {
      const strongKey = keyManager.generateSecureKey();
      expect(keyManager.validateKey(strongKey)).toBe(true);
    });

    it('should reject keys that are too short', () => {
      const shortKey = Buffer.alloc(8);
      expect(keyManager.validateKey(shortKey)).toBe(false);
    });

    it('should reject all-zero keys', () => {
      const zeroKey = Buffer.alloc(32, 0);
      expect(keyManager.validateKey(zeroKey)).toBe(false);
    });

    it('should reject all-ones keys', () => {
      const onesKey = Buffer.alloc(32, 255);
      expect(keyManager.validateKey(onesKey)).toBe(false);
    });

    it('should reject keys with all same bytes', () => {
      const sameByteKey = Buffer.alloc(32, 123);
      expect(keyManager.validateKey(sameByteKey)).toBe(false);
    });
  });

  describe('rotateKeys', () => {
    it('should generate new key pair with rotation metadata', async () => {
      const oldKeyPair = await keyManager.generateKeyPair('test.btc');
      const rotation = await keyManager.rotateKeys(oldKeyPair, 'test.btc');
      
      expect(rotation.newKeyPair.publicKey).not.toBe(oldKeyPair.publicKey);
      expect(rotation.newKeyPair.privateKey).not.toBe(oldKeyPair.privateKey);
      expect(rotation.rotationId).toBeDefined();
      expect(rotation.timestamp).toBeInstanceOf(Date);
    });
  });
});

describe('PatientIdentity', () => {
  let patientIdentity: PatientIdentity;
  let mockBNSResolver: any;
  let mockKeyManager: any;

  beforeEach(() => {
    mockBNSResolver = {
      verifyBNSName: vi.fn(),
      verifyOwnership: vi.fn(),
      getOwner: vi.fn()
    };

    mockKeyManager = {
      generateKeyPair: vi.fn(),
      deriveKey: vi.fn(),
      generateSecureKey: vi.fn(),
      hashKey: vi.fn(),
      validateKey: vi.fn(),
      rotateKeys: vi.fn()
    };

    patientIdentity = new PatientIdentity(mockBNSResolver, mockKeyManager);
  });

  describe('verifyIdentity', () => {
    it('should return valid result for correct ownership', async () => {
      const mockBNSInfo = {
        name: 'test',
        namespace: 'btc',
        owner: 'SP1ABC123DEF456',
        zonefile: 'test',
        address: 'SP1ABC123DEF456',
        blockHeight: 12345
      };

      mockBNSResolver.verifyBNSName.mockResolvedValue(mockBNSInfo);
      mockBNSResolver.verifyOwnership.mockResolvedValue(true);

      const result = await patientIdentity.verifyIdentity('test.btc', 'SP1ABC123DEF456');
      
      expect(result.isValid).toBe(true);
      expect(result.bnsInfo).toEqual(mockBNSInfo);
      expect(result.error).toBeUndefined();
    });

    it('should return invalid result for non-existent BNS name', async () => {
      mockBNSResolver.verifyBNSName.mockResolvedValue(null);

      const result = await patientIdentity.verifyIdentity('nonexistent.btc', 'SP1ABC123DEF456');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('BNS name nonexistent.btc not found');
    });

    it('should return invalid result for incorrect ownership', async () => {
      const mockBNSInfo = {
        name: 'test',
        namespace: 'btc',
        owner: 'SP1ABC123DEF456',
        zonefile: 'test',
        address: 'SP1ABC123DEF456',
        blockHeight: 12345
      };

      mockBNSResolver.verifyBNSName.mockResolvedValue(mockBNSInfo);
      mockBNSResolver.verifyOwnership.mockResolvedValue(false);

      const result = await patientIdentity.verifyIdentity('test.btc', 'SP1DIFFERENT123');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Principal SP1DIFFERENT123 does not own BNS name test.btc');
    });
  });

  describe('registerPatient', () => {
    it('should successfully register a new patient', async () => {
      const mockBNSInfo = {
        name: 'test',
        namespace: 'btc',
        owner: 'SP1ABC123DEF456',
        zonefile: 'test',
        address: 'SP1ABC123DEF456',
        blockHeight: 12345
      };

      const mockKeyPair = {
        publicKey: 'public-key-hex',
        privateKey: 'private-key-hex',
        keyHash: 'key-hash-hex'
      };

      mockBNSResolver.verifyBNSName.mockResolvedValue(mockBNSInfo);
      mockBNSResolver.verifyOwnership.mockResolvedValue(true);
      mockKeyManager.generateKeyPair.mockResolvedValue(mockKeyPair);

      const registration = {
        bnsName: 'test.btc',
        principal: 'SP1ABC123DEF456',
        metadata: {
          displayName: 'Test User',
          email: 'test@example.com'
        }
      };

      const profile = await patientIdentity.registerPatient(registration);
      
      expect(profile.bnsName).toBe('test.btc');
      expect(profile.publicKey).toBe('public-key-hex');
      expect(profile.encryptionKeyHash).toBe('key-hash-hex');
      expect(profile.registrationBlock).toBe(12345);
      expect(profile.metadata?.displayName).toBe('Test User');
      expect(profile.storagePreferences.encryptionEnabled).toBe(true);
    });

    it('should reject registration for invalid identity', async () => {
      mockBNSResolver.verifyBNSName.mockResolvedValue(null);

      const registration = {
        bnsName: 'nonexistent.btc',
        principal: 'SP1ABC123DEF456'
      };

      await expect(patientIdentity.registerPatient(registration)).rejects.toThrow(
        'BNS name nonexistent.btc not found'
      );
    });

    it('should reject duplicate registration', async () => {
      const mockBNSInfo = {
        name: 'test',
        namespace: 'btc',
        owner: 'SP1ABC123DEF456',
        zonefile: 'test',
        address: 'SP1ABC123DEF456',
        blockHeight: 12345
      };

      const mockKeyPair = {
        publicKey: 'public-key-hex',
        privateKey: 'private-key-hex',
        keyHash: 'key-hash-hex'
      };

      mockBNSResolver.verifyBNSName.mockResolvedValue(mockBNSInfo);
      mockBNSResolver.verifyOwnership.mockResolvedValue(true);
      mockKeyManager.generateKeyPair.mockResolvedValue(mockKeyPair);

      const registration = {
        bnsName: 'test.btc',
        principal: 'SP1ABC123DEF456'
      };

      // Register once
      await patientIdentity.registerPatient(registration);

      // Try to register again
      await expect(patientIdentity.registerPatient(registration)).rejects.toThrow(
        'Patient with BNS name test.btc is already registered'
      );
    });
  });

  describe('rotatePatientKeys', () => {
    it('should successfully rotate patient keys', async () => {
      // First register a patient
      const mockBNSInfo = {
        name: 'test',
        namespace: 'btc',
        owner: 'SP1ABC123DEF456',
        zonefile: 'test',
        address: 'SP1ABC123DEF456',
        blockHeight: 12345
      };

      const oldKeyPair = {
        publicKey: 'old-public-key',
        privateKey: 'old-private-key',
        keyHash: 'old-key-hash'
      };

      const newKeyPair = {
        publicKey: 'new-public-key',
        privateKey: 'new-private-key',
        keyHash: 'new-key-hash'
      };

      mockBNSResolver.verifyBNSName.mockResolvedValue(mockBNSInfo);
      mockBNSResolver.verifyOwnership.mockResolvedValue(true);
      mockKeyManager.generateKeyPair.mockResolvedValueOnce(oldKeyPair);

      const registration = {
        bnsName: 'test.btc',
        principal: 'SP1ABC123DEF456'
      };

      await patientIdentity.registerPatient(registration);

      // Now rotate keys
      mockKeyManager.generateKeyPair.mockResolvedValueOnce(newKeyPair);

      const updatedProfile = await patientIdentity.rotatePatientKeys('test.btc', 'new-passphrase');
      
      expect(updatedProfile.publicKey).toBe('new-public-key');
      expect(updatedProfile.encryptionKeyHash).toBe('new-key-hash');
      expect(mockKeyManager.generateKeyPair).toHaveBeenCalledWith('test.btc', 'new-passphrase');
    });

    it('should reject key rotation for non-existent patient', async () => {
      await expect(patientIdentity.rotatePatientKeys('nonexistent.btc')).rejects.toThrow(
        'Patient profile not found for BNS name: nonexistent.btc'
      );
    });
  });

  describe('validatePatientIdentity', () => {
    it('should return true for valid identity', async () => {
      const mockBNSInfo = {
        name: 'test',
        namespace: 'btc',
        owner: 'SP1ABC123DEF456',
        zonefile: 'test',
        address: 'SP1ABC123DEF456',
        blockHeight: 12345
      };

      mockBNSResolver.verifyBNSName.mockResolvedValue(mockBNSInfo);
      mockBNSResolver.verifyOwnership.mockResolvedValue(true);

      const result = await patientIdentity.validatePatientIdentity('test.btc', 'SP1ABC123DEF456');
      expect(result).toBe(true);
    });

    it('should return false for invalid identity', async () => {
      mockBNSResolver.verifyBNSName.mockResolvedValue(null);

      const result = await patientIdentity.validatePatientIdentity('nonexistent.btc', 'SP1ABC123DEF456');
      expect(result).toBe(false);
    });
  });
});