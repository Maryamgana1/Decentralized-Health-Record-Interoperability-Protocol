import { describe, it, expect } from 'vitest';
import type { PatientProfile, HealthRecord, AccessGrant, AuditEvent } from '../src/models';

describe('Data Models', () => {
  it('should have correct PatientProfile interface structure', () => {
    const mockProfile: PatientProfile = {
      bnsName: 'john.doe.btc',
      publicKey: 'mock-public-key',
      registrationBlock: 12345,
      encryptionKeyHash: 'mock-hash',
      storagePreferences: {
        provider: 'gaia',
        encryptionEnabled: true,
        backupEnabled: true
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    expect(mockProfile.bnsName).toBe('john.doe.btc');
    expect(mockProfile.storagePreferences.provider).toBe('gaia');
  });

  it('should have correct HealthRecord interface structure', () => {
    const mockRecord: HealthRecord = {
      id: 'record-123',
      patientBNS: 'john.doe.btc',
      recordType: 'lab-results',
      encryptedContent: 'encrypted-data',
      contentHash: 'sha256-hash',
      metadata: {
        recordType: 'lab-results',
        timestamp: new Date(),
        fileSize: 1024,
        mimeType: 'application/json'
      },
      storageLocation: 'gaia://storage-url',
      createdAt: new Date(),
      version: 1,
      encryptionAlgorithm: 'AES-256-GCM',
      iv: 'initialization-vector'
    };

    expect(mockRecord.recordType).toBe('lab-results');
    expect(mockRecord.version).toBe(1);
  });

  it('should have correct AccessGrant interface structure', () => {
    const mockGrant: AccessGrant = {
      id: 'grant-123',
      patientBNS: 'john.doe.btc',
      providerPrincipal: 'SP1ABC123',
      grantedAt: 12345,
      expiresAt: 12445,
      recordScope: ['lab-results', 'prescriptions'],
      status: 'active',
      providerPublicKey: 'provider-public-key',
      createdAt: new Date(),
      txId: 'stacks-tx-id',
      accessCount: 0
    };

    expect(mockGrant.status).toBe('active');
    expect(mockGrant.recordScope).toContain('lab-results');
  });

  it('should have correct AuditEvent interface structure', () => {
    const mockEvent: AuditEvent = {
      id: 'event-123',
      patientBNS: 'john.doe.btc',
      providerPrincipal: 'SP1ABC123',
      eventType: 'access_granted',
      timestamp: new Date(),
      blockHeight: 12345,
      recordsAccessed: ['record-123'],
      eventHash: 'event-hash'
    };

    expect(mockEvent.eventType).toBe('access_granted');
    expect(mockEvent.recordsAccessed).toContain('record-123');
  });
});