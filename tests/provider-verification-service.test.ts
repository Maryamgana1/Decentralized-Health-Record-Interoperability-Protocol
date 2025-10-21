import { describe, it, expect, beforeEach } from 'vitest';
import { ProviderVerificationService } from '../src/services/verification/ProviderVerificationService';

describe('Provider Verification Service', () => {
  let service: ProviderVerificationService;

  beforeEach(() => {
    service = new ProviderVerificationService('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.provider-verification');
  });

  describe('Provider Registration', () => {
    it('should validate registration request correctly', async () => {
      const validRequest = {
        providerPrincipal: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        licenseNumber: 'MD123456',
        credentialTypes: ['medical-license' as const],
        expiresAt: Math.floor(Date.now() / 1000) + 86400, // 1 day from now
        issuingAuthority: 'State Medical Board'
      };

      const result = await service.registerProvider(validRequest);
      expect(result.success).toBe(true);
      expect(result.txId).toBeDefined();
    });

    it('should reject invalid registration request', async () => {
      const invalidRequest = {
        providerPrincipal: '',
        licenseNumber: 'MD123456',
        credentialTypes: ['medical-license' as const],
        expiresAt: Math.floor(Date.now() / 1000) + 86400,
        issuingAuthority: 'State Medical Board'
      };

      const result = await service.registerProvider(invalidRequest);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Provider principal is required');
    });

    it('should reject request with past expiry date', async () => {
      const invalidRequest = {
        providerPrincipal: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        licenseNumber: 'MD123456',
        credentialTypes: ['medical-license' as const],
        expiresAt: Math.floor(Date.now() / 1000) - 86400, // 1 day ago
        issuingAuthority: 'State Medical Board'
      };

      const result = await service.registerProvider(invalidRequest);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Expiry date must be in the future');
    });
  });

  describe('Provider Verification', () => {
    it('should return verification response', async () => {
      const response = await service.verifyProvider('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
      
      expect(response.isVerified).toBe(true);
      expect(response.credentials).toBeDefined();
      expect(response.status).toBeDefined();
      expect(response.verifiedAt).toBeInstanceOf(Date);
    });

    it('should handle verification errors gracefully', async () => {
      // This would test error handling in a real implementation
      const response = await service.verifyProvider('');
      
      expect(response.isVerified).toBe(false);
      expect(response.failureReason).toBeDefined();
    });
  });

  describe('Credential Updates', () => {
    it('should validate update request correctly', async () => {
      const validUpdate = {
        providerPrincipal: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        newExpiresAt: Math.floor(Date.now() / 1000) + 86400,
        newCredentialTypes: ['medical-license' as const, 'board-certification' as const],
        updateReason: 'Credential renewal'
      };

      const result = await service.updateProviderCredentials(validUpdate);
      expect(result.success).toBe(true);
      expect(result.txId).toBeDefined();
    });

    it('should reject invalid update request', async () => {
      const invalidUpdate = {
        providerPrincipal: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        newExpiresAt: Math.floor(Date.now() / 1000) - 86400, // Past date
        newCredentialTypes: ['medical-license' as const],
        updateReason: 'Credential renewal'
      };

      const result = await service.updateProviderCredentials(invalidUpdate);
      expect(result.success).toBe(false);
      expect(result.error).toContain('New expiry date must be in the future');
    });
  });

  describe('Provider Suspension', () => {
    it('should validate suspension request correctly', async () => {
      const validSuspension = {
        providerPrincipal: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        reason: 'Violation of medical ethics',
        effectiveDate: new Date(),
        requestingAuthority: 'Medical Board'
      };

      const result = await service.suspendProvider(validSuspension);
      expect(result.success).toBe(true);
      expect(result.txId).toBeDefined();
    });

    it('should reject suspension without reason', async () => {
      const invalidSuspension = {
        providerPrincipal: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        reason: '',
        effectiveDate: new Date(),
        requestingAuthority: 'Medical Board'
      };

      const result = await service.suspendProvider(invalidSuspension);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Suspension reason is required');
    });
  });

  describe('Data Retrieval', () => {
    it('should get provider credentials', async () => {
      const credentials = await service.getProviderCredentials('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
      
      expect(credentials).toBeDefined();
      expect(credentials?.providerPrincipal).toBe('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
      expect(credentials?.licenseNumber).toBeDefined();
      expect(credentials?.credentialTypes).toBeInstanceOf(Array);
    });

    it('should get provider status', async () => {
      const status = await service.getProviderStatus('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
      
      expect(status).toBeDefined();
      expect(status?.providerPrincipal).toBe('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
      expect(status?.status).toBeDefined();
      expect(status?.accessCount).toBeTypeOf('number');
    });

    it('should check credential type', async () => {
      const hasLicense = await service.hasCredentialType('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', 'medical-license');
      expect(hasLicense).toBe(true);

      const hasSpecialty = await service.hasCredentialType('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', 'specialty-certification');
      expect(hasSpecialty).toBe(false);
    });
  });

  describe('Credential Type Management', () => {
    it('should add credential type successfully', async () => {
      const result = await service.addCredentialType(
        'telemedicine-license',
        'License for providing telemedicine services',
        true
      );

      expect(result.success).toBe(true);
      expect(result.txId).toBeDefined();
    });

    it('should reject adding credential type without description', async () => {
      const result = await service.addCredentialType(
        'telemedicine-license',
        '',
        true
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Credential type and description are required');
    });
  });

  describe('Provider Reactivation', () => {
    it('should reactivate provider successfully', async () => {
      const result = await service.reactivateProvider('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');

      expect(result.success).toBe(true);
      expect(result.txId).toBeDefined();
    });

    it('should reject reactivation with empty principal', async () => {
      const result = await service.reactivateProvider('');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Provider principal is required');
    });
  });
});
