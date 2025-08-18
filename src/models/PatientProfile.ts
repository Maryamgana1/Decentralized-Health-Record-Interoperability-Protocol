import { StorageConfig } from './types';

/**
 * Patient Profile interface representing a patient's identity and configuration
 * Requirement 1.2: Patient completes registration with unique profile linked to BNS name
 */
export interface PatientProfile {
  /** BNS name serving as the patient's sovereign identity */
  bnsName: string;
  
  /** Public key for encryption and verification */
  publicKey: string;
  
  /** Block height when the patient registered */
  registrationBlock: number;
  
  /** Hash of the patient's encryption key for verification */
  encryptionKeyHash: string;
  
  /** Patient's storage preferences and configuration */
  storagePreferences: StorageConfig;
  
  /** Optional profile metadata */
  metadata?: {
    displayName?: string;
    email?: string;
    phoneNumber?: string;
    emergencyContact?: string;
    preferredLanguage?: string;
    timezone?: string;
  };
  
  /** Timestamp when profile was created */
  createdAt: Date;
  
  /** Timestamp when profile was last updated */
  updatedAt: Date;
}