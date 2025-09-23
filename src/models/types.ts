// Common types used across the health records system

export type HealthRecordType = 
  | 'lab-results'
  | 'prescriptions'
  | 'imaging'
  | 'clinical-notes'
  | 'immunizations'
  | 'allergies'
  | 'medications'
  | 'procedures'
  | 'diagnoses'
  | 'vital-signs';

export type AuditEventType =
  | 'access_granted'
  | 'access_used'
  | 'access_revoked'
  | 'record_uploaded'
  | 'record_updated'
  | 'record_deleted'
  | 'provider_registered'
  | 'provider_verified'
  | 'provider_suspended'
  | 'provider_reactivated'
  | 'credentials_updated'
  | 'credentials_expired';

export type AccessGrantStatus = 
  | 'active'
  | 'expired'
  | 'revoked';

export interface StorageConfig {
  provider: 'gaia' | 'ipfs';
  hubUrl?: string;
  encryptionEnabled: boolean;
  backupEnabled: boolean;
}

export interface RecordMetadata {
  recordType: HealthRecordType;
  timestamp: Date;
  provider?: string;
  facility?: string;
  tags?: string[];
  fileSize: number;
  mimeType: string;
}