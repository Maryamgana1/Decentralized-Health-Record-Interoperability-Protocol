import { 
  ProviderRegistrationRequest,
  ProviderCredentialUpdateRequest,
  ProviderSuspensionRequest,
  CredentialType
} from '../../models/ProviderCredential';
import { ProviderVerificationService } from '../../services/verification/ProviderVerificationService';

/**
 * Provider API Routes
 * Handles HTTP endpoints for provider registration, verification, and management
 */
export class ProviderRoutes {
  private verificationService: ProviderVerificationService;

  constructor(contractAddress: string, networkUrl?: string) {
    this.verificationService = new ProviderVerificationService(contractAddress, networkUrl);
  }

  /**
   * POST /api/v1/providers/register
   * Register a new healthcare provider
   */
  async registerProvider(request: {
    body: ProviderRegistrationRequest;
    headers: Record<string, string>;
  }): Promise<{
    status: number;
    body: {
      success: boolean;
      data?: { txId: string };
      error?: string;
      message?: string;
    };
  }> {
    try {
      // Validate request body
      if (!request.body) {
        return {
          status: 400,
          body: {
            success: false,
            error: 'Request body is required'
          }
        };
      }

      // Register the provider
      const result = await this.verificationService.registerProvider(request.body);

      if (result.success) {
        return {
          status: 201,
          body: {
            success: true,
            data: { txId: result.txId! },
            message: 'Provider registered successfully'
          }
        };
      } else {
        return {
          status: 400,
          body: {
            success: false,
            error: result.error || 'Registration failed'
          }
        };
      }
    } catch (error) {
      return {
        status: 500,
        body: {
          success: false,
          error: 'Internal server error'
        }
      };
    }
  }

  /**
   * GET /api/v1/providers/{providerPrincipal}/verify
   * Verify a provider's credentials and status
   */
  async verifyProvider(request: {
    params: { providerPrincipal: string };
    headers: Record<string, string>;
  }): Promise<{
    status: number;
    body: {
      success: boolean;
      data?: any;
      error?: string;
    };
  }> {
    try {
      const { providerPrincipal } = request.params;

      if (!providerPrincipal) {
        return {
          status: 400,
          body: {
            success: false,
            error: 'Provider principal is required'
          }
        };
      }

      const verification = await this.verificationService.verifyProvider(providerPrincipal);

      return {
        status: 200,
        body: {
          success: true,
          data: verification
        }
      };
    } catch (error) {
      return {
        status: 500,
        body: {
          success: false,
          error: 'Internal server error'
        }
      };
    }
  }

  /**
   * GET /api/v1/providers/{providerPrincipal}/credentials
   * Get provider credentials
   */
  async getProviderCredentials(request: {
    params: { providerPrincipal: string };
    headers: Record<string, string>;
  }): Promise<{
    status: number;
    body: {
      success: boolean;
      data?: any;
      error?: string;
    };
  }> {
    try {
      const { providerPrincipal } = request.params;

      if (!providerPrincipal) {
        return {
          status: 400,
          body: {
            success: false,
            error: 'Provider principal is required'
          }
        };
      }

      const credentials = await this.verificationService.getProviderCredentials(providerPrincipal);

      if (credentials) {
        return {
          status: 200,
          body: {
            success: true,
            data: credentials
          }
        };
      } else {
        return {
          status: 404,
          body: {
            success: false,
            error: 'Provider not found'
          }
        };
      }
    } catch (error) {
      return {
        status: 500,
        body: {
          success: false,
          error: 'Internal server error'
        }
      };
    }
  }

  /**
   * GET /api/v1/providers/{providerPrincipal}/status
   * Get provider status
   */
  async getProviderStatus(request: {
    params: { providerPrincipal: string };
    headers: Record<string, string>;
  }): Promise<{
    status: number;
    body: {
      success: boolean;
      data?: any;
      error?: string;
    };
  }> {
    try {
      const { providerPrincipal } = request.params;

      if (!providerPrincipal) {
        return {
          status: 400,
          body: {
            success: false,
            error: 'Provider principal is required'
          }
        };
      }

      const status = await this.verificationService.getProviderStatus(providerPrincipal);

      if (status) {
        return {
          status: 200,
          body: {
            success: true,
            data: status
          }
        };
      } else {
        return {
          status: 404,
          body: {
            success: false,
            error: 'Provider not found'
          }
        };
      }
    } catch (error) {
      return {
        status: 500,
        body: {
          success: false,
          error: 'Internal server error'
        }
      };
    }
  }

  /**
   * PUT /api/v1/providers/{providerPrincipal}/credentials
   * Update provider credentials
   */
  async updateProviderCredentials(request: {
    params: { providerPrincipal: string };
    body: Omit<ProviderCredentialUpdateRequest, 'providerPrincipal'>;
    headers: Record<string, string>;
  }): Promise<{
    status: number;
    body: {
      success: boolean;
      data?: { txId: string };
      error?: string;
      message?: string;
    };
  }> {
    try {
      const { providerPrincipal } = request.params;

      if (!providerPrincipal) {
        return {
          status: 400,
          body: {
            success: false,
            error: 'Provider principal is required'
          }
        };
      }

      if (!request.body) {
        return {
          status: 400,
          body: {
            success: false,
            error: 'Request body is required'
          }
        };
      }

      const updateRequest: ProviderCredentialUpdateRequest = {
        ...request.body,
        providerPrincipal
      };

      const result = await this.verificationService.updateProviderCredentials(updateRequest);

      if (result.success) {
        return {
          status: 200,
          body: {
            success: true,
            data: { txId: result.txId! },
            message: 'Provider credentials updated successfully'
          }
        };
      } else {
        return {
          status: 400,
          body: {
            success: false,
            error: result.error || 'Update failed'
          }
        };
      }
    } catch (error) {
      return {
        status: 500,
        body: {
          success: false,
          error: 'Internal server error'
        }
      };
    }
  }

  /**
   * POST /api/v1/providers/{providerPrincipal}/suspend
   * Suspend a provider
   */
  async suspendProvider(request: {
    params: { providerPrincipal: string };
    body: Omit<ProviderSuspensionRequest, 'providerPrincipal'>;
    headers: Record<string, string>;
  }): Promise<{
    status: number;
    body: {
      success: boolean;
      data?: { txId: string };
      error?: string;
      message?: string;
    };
  }> {
    try {
      const { providerPrincipal } = request.params;

      if (!providerPrincipal) {
        return {
          status: 400,
          body: {
            success: false,
            error: 'Provider principal is required'
          }
        };
      }

      if (!request.body) {
        return {
          status: 400,
          body: {
            success: false,
            error: 'Request body is required'
          }
        };
      }

      const suspensionRequest: ProviderSuspensionRequest = {
        ...request.body,
        providerPrincipal
      };

      const result = await this.verificationService.suspendProvider(suspensionRequest);

      if (result.success) {
        return {
          status: 200,
          body: {
            success: true,
            data: { txId: result.txId! },
            message: 'Provider suspended successfully'
          }
        };
      } else {
        return {
          status: 400,
          body: {
            success: false,
            error: result.error || 'Suspension failed'
          }
        };
      }
    } catch (error) {
      return {
        status: 500,
        body: {
          success: false,
          error: 'Internal server error'
        }
      };
    }
  }

  /**
   * POST /api/v1/providers/{providerPrincipal}/reactivate
   * Reactivate a suspended provider
   */
  async reactivateProvider(request: {
    params: { providerPrincipal: string };
    headers: Record<string, string>;
  }): Promise<{
    status: number;
    body: {
      success: boolean;
      data?: { txId: string };
      error?: string;
      message?: string;
    };
  }> {
    try {
      const { providerPrincipal } = request.params;

      if (!providerPrincipal) {
        return {
          status: 400,
          body: {
            success: false,
            error: 'Provider principal is required'
          }
        };
      }

      const result = await this.verificationService.reactivateProvider(providerPrincipal);

      if (result.success) {
        return {
          status: 200,
          body: {
            success: true,
            data: { txId: result.txId! },
            message: 'Provider reactivated successfully'
          }
        };
      } else {
        return {
          status: 400,
          body: {
            success: false,
            error: result.error || 'Reactivation failed'
          }
        };
      }
    } catch (error) {
      return {
        status: 500,
        body: {
          success: false,
          error: 'Internal server error'
        }
      };
    }
  }

  /**
   * GET /api/v1/providers/{providerPrincipal}/credentials/{credentialType}
   * Check if provider has specific credential type
   */
  async hasCredentialType(request: {
    params: { providerPrincipal: string; credentialType: string };
    headers: Record<string, string>;
  }): Promise<{
    status: number;
    body: {
      success: boolean;
      data?: { hasCredential: boolean };
      error?: string;
    };
  }> {
    try {
      const { providerPrincipal, credentialType } = request.params;

      if (!providerPrincipal || !credentialType) {
        return {
          status: 400,
          body: {
            success: false,
            error: 'Provider principal and credential type are required'
          }
        };
      }

      const hasCredential = await this.verificationService.hasCredentialType(
        providerPrincipal, 
        credentialType as CredentialType
      );

      return {
        status: 200,
        body: {
          success: true,
          data: { hasCredential }
        }
      };
    } catch (error) {
      return {
        status: 500,
        body: {
          success: false,
          error: 'Internal server error'
        }
      };
    }
  }
}
