/**
 * Provider Verification Integration Example
 * 
 * This example demonstrates how to integrate the Provider Verification System
 * with a healthcare application for complete provider credential management.
 */

import { ProviderVerificationService } from '../src/services/verification/ProviderVerificationService';
import { ProviderRoutes } from '../src/api/routes/providers';
import { 
  ProviderRegistrationRequest, 
  ProviderCredentialUpdateRequest,
  CredentialType 
} from '../src/models/ProviderCredential';

// Configuration
const CONTRACT_ADDRESS = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.provider-verification';
const NETWORK_URL = 'https://stacks-node-api.mainnet.stacks.co';

/**
 * Healthcare Provider Management System
 * Demonstrates complete integration with provider verification
 */
export class HealthcareProviderManager {
  private verificationService: ProviderVerificationService;
  private apiRoutes: ProviderRoutes;

  constructor() {
    this.verificationService = new ProviderVerificationService(CONTRACT_ADDRESS, NETWORK_URL);
    this.apiRoutes = new ProviderRoutes(CONTRACT_ADDRESS, NETWORK_URL);
  }

  /**
   * Complete provider onboarding workflow
   */
  async onboardProvider(providerData: {
    principal: string;
    licenseNumber: string;
    specialties: string[];
    issuingAuthority: string;
    licenseExpiry: Date;
    contactInfo: {
      email: string;
      phone: string;
      address: string;
    };
  }) {
    try {
      console.log('Starting provider onboarding for:', providerData.principal);

      // Step 1: Validate provider data
      await this.validateProviderData(providerData);

      // Step 2: Map specialties to credential types
      const credentialTypes = this.mapSpecialtiesToCredentials(providerData.specialties);

      // Step 3: Create registration request
      const registrationRequest: ProviderRegistrationRequest = {
        providerPrincipal: providerData.principal,
        licenseNumber: providerData.licenseNumber,
        credentialTypes,
        expiresAt: Math.floor(providerData.licenseExpiry.getTime() / 1000),
        issuingAuthority: providerData.issuingAuthority,
        contactInfo: providerData.contactInfo
      };

      // Step 4: Register provider on blockchain
      const registrationResult = await this.verificationService.registerProvider(registrationRequest);
      
      if (!registrationResult.success) {
        throw new Error(`Registration failed: ${registrationResult.error}`);
      }

      console.log('Provider registered successfully. Transaction ID:', registrationResult.txId);

      // Step 5: Verify registration
      const verification = await this.verificationService.verifyProvider(providerData.principal);
      
      if (!verification.isVerified) {
        throw new Error(`Verification failed: ${verification.failureReason}`);
      }

      console.log('Provider onboarding completed successfully');
      return {
        success: true,
        txId: registrationResult.txId,
        verification
      };

    } catch (error) {
      console.error('Provider onboarding failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Provider credential renewal workflow
   */
  async renewProviderCredentials(
    providerPrincipal: string,
    newExpiryDate: Date,
    additionalCredentials?: CredentialType[]
  ) {
    try {
      console.log('Starting credential renewal for:', providerPrincipal);

      // Step 1: Get current credentials
      const currentCredentials = await this.verificationService.getProviderCredentials(providerPrincipal);
      
      if (!currentCredentials) {
        throw new Error('Provider not found');
      }

      // Step 2: Prepare update request
      const updateRequest: ProviderCredentialUpdateRequest = {
        providerPrincipal,
        newExpiresAt: Math.floor(newExpiryDate.getTime() / 1000),
        newCredentialTypes: additionalCredentials 
          ? [...currentCredentials.credentialTypes, ...additionalCredentials]
          : currentCredentials.credentialTypes,
        updateReason: 'Credential renewal and potential expansion'
      };

      // Step 3: Update credentials
      const updateResult = await this.verificationService.updateProviderCredentials(updateRequest);
      
      if (!updateResult.success) {
        throw new Error(`Update failed: ${updateResult.error}`);
      }

      console.log('Credentials renewed successfully. Transaction ID:', updateResult.txId);
      return {
        success: true,
        txId: updateResult.txId
      };

    } catch (error) {
      console.error('Credential renewal failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Provider access validation for patient records
   */
  async validateProviderAccess(
    providerPrincipal: string,
    requiredCredentials: CredentialType[] = ['medical-license']
  ): Promise<{
    hasAccess: boolean;
    reason?: string;
    credentials?: any;
  }> {
    try {
      // Step 1: Verify provider status
      const verification = await this.verificationService.verifyProvider(providerPrincipal);
      
      if (!verification.isVerified) {
        return {
          hasAccess: false,
          reason: verification.failureReason || 'Provider verification failed'
        };
      }

      // Step 2: Check required credentials
      for (const requiredCredential of requiredCredentials) {
        const hasCredential = await this.verificationService.hasCredentialType(
          providerPrincipal, 
          requiredCredential
        );
        
        if (!hasCredential) {
          return {
            hasAccess: false,
            reason: `Missing required credential: ${requiredCredential}`
          };
        }
      }

      return {
        hasAccess: true,
        credentials: verification.credentials
      };

    } catch (error) {
      return {
        hasAccess: false,
        reason: error instanceof Error ? error.message : 'Access validation failed'
      };
    }
  }

  /**
   * Provider suspension workflow
   */
  async suspendProvider(
    providerPrincipal: string,
    reason: string,
    requestingAuthority: string
  ) {
    try {
      console.log('Suspending provider:', providerPrincipal);

      const suspensionRequest = {
        providerPrincipal,
        reason,
        effectiveDate: new Date(),
        requestingAuthority
      };

      const result = await this.verificationService.suspendProvider(suspensionRequest);
      
      if (!result.success) {
        throw new Error(`Suspension failed: ${result.error}`);
      }

      console.log('Provider suspended successfully. Transaction ID:', result.txId);
      return {
        success: true,
        txId: result.txId
      };

    } catch (error) {
      console.error('Provider suspension failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get provider dashboard data
   */
  async getProviderDashboard(providerPrincipal: string) {
    try {
      const [credentials, status, verification] = await Promise.all([
        this.verificationService.getProviderCredentials(providerPrincipal),
        this.verificationService.getProviderStatus(providerPrincipal),
        this.verificationService.verifyProvider(providerPrincipal)
      ]);

      return {
        credentials,
        status,
        verification,
        isActive: verification.isVerified && status?.status === 'active'
      };

    } catch (error) {
      console.error('Failed to get provider dashboard:', error);
      return null;
    }
  }

  /**
   * Validate provider data before registration
   */
  private async validateProviderData(providerData: any): Promise<void> {
    if (!providerData.principal || providerData.principal.trim().length === 0) {
      throw new Error('Provider principal is required');
    }

    if (!providerData.licenseNumber || providerData.licenseNumber.trim().length === 0) {
      throw new Error('License number is required');
    }

    if (!providerData.specialties || providerData.specialties.length === 0) {
      throw new Error('At least one specialty is required');
    }

    if (!providerData.licenseExpiry || providerData.licenseExpiry <= new Date()) {
      throw new Error('Valid license expiry date is required');
    }

    if (!providerData.issuingAuthority || providerData.issuingAuthority.trim().length === 0) {
      throw new Error('Issuing authority is required');
    }
  }

  /**
   * Map medical specialties to credential types
   */
  private mapSpecialtiesToCredentials(specialties: string[]): CredentialType[] {
    const credentialMap: Record<string, CredentialType> = {
      'internal-medicine': 'medical-license',
      'cardiology': 'board-certification',
      'surgery': 'board-certification',
      'pediatrics': 'board-certification',
      'psychiatry': 'board-certification',
      'radiology': 'board-certification',
      'emergency-medicine': 'board-certification',
      'telemedicine': 'telemedicine-license'
    };

    const credentials: CredentialType[] = ['medical-license']; // Always include basic license
    
    specialties.forEach(specialty => {
      const credential = credentialMap[specialty.toLowerCase()];
      if (credential && !credentials.includes(credential)) {
        credentials.push(credential);
      }
    });

    return credentials;
  }
}

/**
 * Example usage of the Healthcare Provider Manager
 */
async function exampleUsage() {
  const manager = new HealthcareProviderManager();

  // Example 1: Onboard a new provider
  const onboardingResult = await manager.onboardProvider({
    principal: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    licenseNumber: 'MD123456',
    specialties: ['internal-medicine', 'cardiology'],
    issuingAuthority: 'State Medical Board',
    licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    contactInfo: {
      email: 'doctor@example.com',
      phone: '+1-555-0123',
      address: '123 Medical Center Dr, Healthcare City, HC 12345'
    }
  });

  console.log('Onboarding result:', onboardingResult);

  // Example 2: Validate provider access
  const accessValidation = await manager.validateProviderAccess(
    'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    ['medical-license', 'board-certification']
  );

  console.log('Access validation:', accessValidation);

  // Example 3: Get provider dashboard
  const dashboard = await manager.getProviderDashboard('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');
  console.log('Provider dashboard:', dashboard);
}

// Export for use in other modules
export { exampleUsage };
