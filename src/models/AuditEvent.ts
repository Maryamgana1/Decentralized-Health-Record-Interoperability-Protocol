import { AuditEventType } from './types';

/**
 * Audit Event interface representing immutable logs of system access events
 * Requirement 5.1: System creates immutable log entry on Bitcoin blockchain
 * Requirement 5.3: System shows provider identity, access duration, timestamp, and scope
 */
export interface AuditEvent {
  /** Unique identifier for the audit event */
  id: string;
  
  /** BNS name of the patient whose records were accessed */
  patientBNS: string;
  
  /** Stacks principal address of the provider or entity */
  providerPrincipal: string;
  
  /** Type of audit event */
  eventType: AuditEventType;
  
  /** Timestamp when the event occurred */
  timestamp: Date;
  
  /** Block height when the event was recorded */
  blockHeight: number;
  
  /** List of record IDs that were accessed */
  recordsAccessed: string[];
  
  /** Bitcoin transaction ID for immutable settlement (optional) */
  bitcoinTxId?: string;
  
  /** Access grant ID associated with this event */
  accessGrantId?: string;
  
  /** IP address of the accessor (for security monitoring) */
  ipAddress?: string;
  
  /** User agent string (for security monitoring) */
  userAgent?: string;
  
  /** Additional metadata about the event */
  metadata?: {
    recordTypes?: string[];
    dataSize?: number;
    duration?: number;
    success?: boolean;
    errorCode?: string;
    errorMessage?: string;
  };
  
  /** Cryptographic hash of the event data for integrity */
  eventHash: string;
  
  /** Digital signature of the event */
  signature?: string;
}