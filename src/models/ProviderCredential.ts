/**
 * Provider Credential interface representing healthcare provider verification and credentials
 * Integrates with the provider-verification smart contract for decentralized credential management
 */

export type CredentialType = 
  | 'medical-license'
  | 'board-certification'
  | 'hospital-privileges'
  | 'dea-registration'
  | 'npi-number'
  | 'specialty-certification'
  | 'malpractice-insurance'
  | 'continuing-education'
  | 'telemedicine-license'
  | 'research-certification';

export type VerificationStatus = 
  | 'pending'
  | 'verified'
  | 'expired'
  | 'suspended'
  | 'revoked'
  | 'under-review';

export type ProviderStatus = 
  | 'active'
  | 'suspended'
  | 'revoked'
  | 'inactive';

/**
 * Provider Credential interface representing a healthcare provider's credentials
 */
export interface ProviderCredential {
  /** Stacks principal address of the healthcare provider */
  providerPrincipal: string;
  
  /** Professional license number */
  licenseNumber: string;
  
  /** Types of credentials held by the provider */
  credentialTypes: CredentialType[];
  
  /** Block height when credentials were issued */
  issuedAt: number;
  
  /** Block height when credentials expire */
  expiresAt: number;
  
  /** Authority that issued the credentials */
  issuingAuthority: string;
  
  /** Current verification status */
  verificationStatus: VerificationStatus;
  
  /** Block height when last verified */
  lastVerified: number;
  
  /** Reason for suspension (if applicable) */
  suspensionReason?: string;
  
  /** Timestamp when credential was created */
  createdAt: Date;
  
  /** Timestamp when credential was last updated */
  updatedAt?: Date;
}

/**
 * Provider Status interface representing the current status and activity of a provider
 */
export interface ProviderStatus {
  /** Stacks principal address of the healthcare provider */
  providerPrincipal: string;
  
  /** Block height when provider registered */
  registrationDate: number;
  
  /** Block height of last activity */
  lastActivity: number;
  
  /** Number of times provider has accessed records */
  accessCount: number;
  
  /** Current status of the provider */
  status: ProviderStatus;
  
  /** Principal who last updated the status */
  updatedBy: string;
  
  /** Timestamp when status was created */
  createdAt: Date;
  
  /** Timestamp when status was last updated */
  updatedAt?: Date;
}

/**
 * Verification History interface representing a record of credential verification
 */
export interface VerificationHistory {
  /** Unique identifier for the verification event */
  id: string;
  
  /** Stacks principal address of the healthcare provider */
  providerPrincipal: string;
  
  /** Principal who performed the verification */
  verifiedBy: string;
  
  /** Block height when verification was performed */
  verificationDate: number;
  
  /** Hash of the credential data that was verified */
  credentialHash: string;
  
  /** Result of the verification */
  verificationResult: VerificationStatus;
  
  /** Optional notes about the verification */
  notes?: string;
  
  /** Timestamp when verification was recorded */
  createdAt: Date;
}

/**
 * Valid Credential Type interface representing system-recognized credential types
 */
export interface ValidCredentialType {
  /** The credential type identifier */
  credentialType: CredentialType;
  
  /** Human-readable description of the credential */
  description: string;
  
  /** Whether this credential is required for patient record access */
  requiredForAccess: boolean;
  
  /** Block height when this credential type was added */
  createdAt: number;
}

/**
 * Provider Registration Request interface for new provider registration
 */
export interface ProviderRegistrationRequest {
  /** Stacks principal address of the healthcare provider */
  providerPrincipal: string;
  
  /** Professional license number */
  licenseNumber: string;
  
  /** Types of credentials held by the provider */
  credentialTypes: CredentialType[];
  
  /** Block height when credentials expire */
  expiresAt: number;
  
  /** Authority that issued the credentials */
  issuingAuthority: string;
  
  /** Supporting documentation or evidence */
  supportingDocuments?: {
    documentType: string;
    documentHash: string;
    documentUrl?: string;
  }[];
  
  /** Contact information for verification */
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
  };
}

/**
 * Provider Credential Update Request interface for updating existing credentials
 */
export interface ProviderCredentialUpdateRequest {
  /** Stacks principal address of the healthcare provider */
  providerPrincipal: string;
  
  /** New expiry block height */
  newExpiresAt: number;
  
  /** Updated credential types */
  newCredentialTypes: CredentialType[];
  
  /** Reason for the update */
  updateReason: string;
  
  /** Supporting documentation for the update */
  supportingDocuments?: {
    documentType: string;
    documentHash: string;
    documentUrl?: string;
  }[];
}

/**
 * Provider Suspension Request interface for suspending a provider
 */
export interface ProviderSuspensionRequest {
  /** Stacks principal address of the healthcare provider */
  providerPrincipal: string;
  
  /** Reason for suspension */
  reason: string;
  
  /** Effective date of suspension */
  effectiveDate: Date;
  
  /** Expected duration of suspension (if temporary) */
  expectedDuration?: string;
  
  /** Authority requesting the suspension */
  requestingAuthority: string;
}

/**
 * Provider Verification Response interface for verification queries
 */
export interface ProviderVerificationResponse {
  /** Whether the provider is verified and can access records */
  isVerified: boolean;
  
  /** Provider's current credentials */
  credentials?: ProviderCredential;
  
  /** Provider's current status */
  status?: ProviderStatus;
  
  /** Reason if verification failed */
  failureReason?: string;
  
  /** Timestamp of the verification check */
  verifiedAt: Date;
}
