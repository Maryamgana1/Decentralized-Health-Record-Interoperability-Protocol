import { AccessGrantStatus } from './types';

/**
 * Access Grant interface representing permissions granted to healthcare providers
 * Requirement 3.1: Patient initiates access grant with provider, duration, and scope
 * Requirement 3.2: System records permission on Stacks blockchain
 */
export interface AccessGrant {
  /** Unique identifier for the access grant */
  id: string;
  
  /** BNS name of the patient granting access */
  patientBNS: string;
  
  /** Stacks principal address of the healthcare provider */
  providerPrincipal: string;
  
  /** Block height when access was granted */
  grantedAt: number;
  
  /** Block height when access expires */
  expiresAt: number;
  
  /** Scope of records the provider can access */
  recordScope: string[];
  
  /** Current status of the access grant */
  status: AccessGrantStatus;
  
  /** Optional description or reason for the grant */
  description?: string;
  
  /** Provider's public key for record decryption */
  providerPublicKey: string;
  
  /** Timestamp when grant was created */
  createdAt: Date;
  
  /** Timestamp when grant was last updated */
  updatedAt?: Date;
  
  /** Block height when access was revoked (if applicable) */
  revokedAt?: number;
  
  /** Reason for revocation (if applicable) */
  revocationReason?: string;
  
  /** Transaction ID of the grant on Stacks blockchain */
  txId: string;
  
  /** Maximum number of times the provider can access records */
  maxAccesses?: number;
  
  /** Number of times the provider has accessed records */
  accessCount: number;
}