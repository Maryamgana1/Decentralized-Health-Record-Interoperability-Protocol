import { HealthRecordType, RecordMetadata } from './types';

/**
 * Health Record interface representing encrypted patient health data
 * Requirement 2.1: Patient uploads health records with encryption
 * Requirement 2.3: System generates unique content hash for data integrity
 */
export interface HealthRecord {
  /** Unique identifier for the health record */
  id: string;
  
  /** BNS name of the patient who owns this record */
  patientBNS: string;
  
  /** Type of health record (lab results, prescriptions, etc.) */
  recordType: HealthRecordType;
  
  /** Encrypted content of the health record */
  encryptedContent: string;
  
  /** SHA-256 hash of the original content for integrity verification */
  contentHash: string;
  
  /** Metadata about the record */
  metadata: RecordMetadata;
  
  /** Storage location reference (Gaia URL, IPFS hash, etc.) */
  storageLocation: string;
  
  /** Timestamp when the record was created */
  createdAt: Date;
  
  /** Timestamp when the record was last updated */
  updatedAt?: Date;
  
  /** Version number for record updates */
  version: number;
  
  /** Optional backup storage locations */
  backupLocations?: string[];
  
  /** Encryption algorithm used */
  encryptionAlgorithm: string;
  
  /** Initialization vector for encryption */
  iv: string;
}