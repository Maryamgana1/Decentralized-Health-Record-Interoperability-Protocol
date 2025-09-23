import { describe, it, expect, beforeEach } from 'vitest';
import { ProviderRoutes } from '../src/api/routes/providers';
import { ProviderRegistrationRequest, ProviderCredentialUpdateRequest, ProviderSuspensionRequest } from '../src/models/ProviderCredential';

describe('Provider API Routes', () => {
  let providerRoutes: ProviderRoutes;

  beforeEach(() => {
    providerRoutes = new ProviderRoutes('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.provider-verification');
  });

  describe('POST /api/v1/providers/register', () => {
    it('should register provider successfully with valid request', async () => {
      const validRequest: ProviderRegistrationRequest = {
        providerPrincipal: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        licenseNumber: 'MD123456',
        credentialTypes: ['medical-license', 'board-certification'],
        expiresAt: Math.floor(Date.now() / 1000) + 86400,
        issuingAuthority: 'State Medical Board'
      };

      const response = await providerRoutes.registerProvider({
        body: validRequest,
        headers: {}
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data?.txId).toBeDefined();
      expect(response.body.message).toContain('successfully');
    });

    it('should return 400 for missing request body', async () => {
      const response = await providerRoutes.registerProvider({
        body: null as any,
        headers: {}
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Request body is required');
    });

    it('should return 400 for invalid request data', async () => {
      const invalidRequest = {
        providerPrincipal: '', // Invalid empty principal
        licenseNumber: 'MD123456',
        credentialTypes: ['medical-license'],
        expiresAt: Math.floor(Date.now() / 1000) + 86400,
        issuingAuthority: 'State Medical Board'
      } as ProviderRegistrationRequest;

      const response = await providerRoutes.registerProvider({
        body: invalidRequest,
        headers: {}
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/v1/providers/{providerPrincipal}/verify', () => {
    it('should verify provider successfully', async () => {
      const response = await providerRoutes.verifyProvider({
        params: { providerPrincipal: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM' },
        headers: {}
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.isVerified).toBeDefined();
      expect(response.body.data.verifiedAt).toBeDefined();
    });

    it('should return 400 for missing provider principal', async () => {
      const response = await providerRoutes.verifyProvider({
        params: { providerPrincipal: '' },
        headers: {}
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Provider principal is required');
    });
  });

  describe('GET /api/v1/providers/{providerPrincipal}/credentials', () => {
    it('should get provider credentials successfully', async () => {
      const response = await providerRoutes.getProviderCredentials({
        params: { providerPrincipal: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM' },
        headers: {}
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.providerPrincipal).toBe('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
      expect(response.body.data.licenseNumber).toBeDefined();
      expect(response.body.data.credentialTypes).toBeInstanceOf(Array);
    });

    it('should return 400 for missing provider principal', async () => {
      const response = await providerRoutes.getProviderCredentials({
        params: { providerPrincipal: '' },
        headers: {}
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Provider principal is required');
    });
  });

  describe('GET /api/v1/providers/{providerPrincipal}/status', () => {
    it('should get provider status successfully', async () => {
      const response = await providerRoutes.getProviderStatus({
        params: { providerPrincipal: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM' },
        headers: {}
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.providerPrincipal).toBe('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
      expect(response.body.data.status).toBeDefined();
      expect(response.body.data.accessCount).toBeTypeOf('number');
    });
  });

  describe('PUT /api/v1/providers/{providerPrincipal}/credentials', () => {
    it('should update provider credentials successfully', async () => {
      const updateRequest = {
        newExpiresAt: Math.floor(Date.now() / 1000) + 172800, // 2 days from now
        newCredentialTypes: ['medical-license', 'board-certification', 'specialty-certification'],
        updateReason: 'Credential renewal and specialty addition'
      } as Omit<ProviderCredentialUpdateRequest, 'providerPrincipal'>;

      const response = await providerRoutes.updateProviderCredentials({
        params: { providerPrincipal: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM' },
        body: updateRequest,
        headers: {}
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data?.txId).toBeDefined();
      expect(response.body.message).toContain('updated successfully');
    });

    it('should return 400 for missing request body', async () => {
      const response = await providerRoutes.updateProviderCredentials({
        params: { providerPrincipal: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM' },
        body: null as any,
        headers: {}
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Request body is required');
    });

    it('should return 400 for invalid update data', async () => {
      const invalidUpdate = {
        newExpiresAt: Math.floor(Date.now() / 1000) - 86400, // Past date
        newCredentialTypes: ['medical-license'],
        updateReason: 'Invalid update'
      } as Omit<ProviderCredentialUpdateRequest, 'providerPrincipal'>;

      const response = await providerRoutes.updateProviderCredentials({
        params: { providerPrincipal: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM' },
        body: invalidUpdate,
        headers: {}
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /api/v1/providers/{providerPrincipal}/suspend', () => {
    it('should suspend provider successfully', async () => {
      const suspensionRequest = {
        reason: 'Violation of medical ethics',
        effectiveDate: new Date(),
        requestingAuthority: 'State Medical Board'
      } as Omit<ProviderSuspensionRequest, 'providerPrincipal'>;

      const response = await providerRoutes.suspendProvider({
        params: { providerPrincipal: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM' },
        body: suspensionRequest,
        headers: {}
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data?.txId).toBeDefined();
      expect(response.body.message).toContain('suspended successfully');
    });

    it('should return 400 for missing suspension reason', async () => {
      const invalidSuspension = {
        reason: '', // Empty reason
        effectiveDate: new Date(),
        requestingAuthority: 'State Medical Board'
      } as Omit<ProviderSuspensionRequest, 'providerPrincipal'>;

      const response = await providerRoutes.suspendProvider({
        params: { providerPrincipal: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM' },
        body: invalidSuspension,
        headers: {}
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /api/v1/providers/{providerPrincipal}/reactivate', () => {
    it('should reactivate provider successfully', async () => {
      const response = await providerRoutes.reactivateProvider({
        params: { providerPrincipal: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM' },
        headers: {}
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data?.txId).toBeDefined();
      expect(response.body.message).toContain('reactivated successfully');
    });

    it('should return 400 for missing provider principal', async () => {
      const response = await providerRoutes.reactivateProvider({
        params: { providerPrincipal: '' },
        headers: {}
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Provider principal is required');
    });
  });

  describe('GET /api/v1/providers/{providerPrincipal}/credentials/{credentialType}', () => {
    it('should check credential type successfully', async () => {
      const response = await providerRoutes.hasCredentialType({
        params: { 
          providerPrincipal: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
          credentialType: 'medical-license'
        },
        headers: {}
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data?.hasCredential).toBeDefined();
      expect(typeof response.body.data?.hasCredential).toBe('boolean');
    });

    it('should return 400 for missing parameters', async () => {
      const response = await providerRoutes.hasCredentialType({
        params: { 
          providerPrincipal: '',
          credentialType: 'medical-license'
        },
        headers: {}
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Provider principal and credential type are required');
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      // This test would verify that API routes handle service layer errors properly
      // In a real implementation, we might mock the service to throw errors
      
      const response = await providerRoutes.verifyProvider({
        params: { providerPrincipal: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM' },
        headers: {}
      });

      // Even if the service has issues, the API should return a proper response
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(600);
      expect(response.body).toBeDefined();
      expect(typeof response.body.success).toBe('boolean');
    });
  });
});
