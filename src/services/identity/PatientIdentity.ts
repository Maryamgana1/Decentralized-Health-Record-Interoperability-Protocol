import { PatientProfile } from '@/models/PatientProfile';
import { StorageConfig } from '@/models/types';
import { BNSResolver, IBNSResolver, BNSNameInfo } from './BNSResolver';
import { KeyManager, IKeyManager, KeyPair } from './KeyManager';

/**
 * Patient Identity management service
 * Requirement 1.1: Verify BNS name ownership on Stacks blockchain
 * Requirement 1.2: Create unique patient profile linked to BNS name
 * Requirement 1.4: Generate encryption keys for patient health records
 */

export interface IdentityVerificationResult {
  isValid: boolean;
  bnsInfo?: BNSNameInfo;
  error?: string;
}

export interface PatientRegistration {
  bnsName: string;
  principal: string;
  passphrase?: string;
  storagePreferences?: Partial<StorageConfig>;
  metadata?: {
    displayName?: string;
    email?: string;
    phoneNumber?: string;
    emergencyContact?: string;
    preferredLanguage?: string;
    timezone?: string;
  };
}

export interface IPatientIdentity {
  /**
   * Verify a BNS name and check ownership
   * @param bnsName - The BNS name to verify
   * @param principal - The Stacks principal claiming ownership
   * @returns Promise resolving to verification result
   */
  verifyIdentity(bnsName: string, principal: string): Promise<IdentityVerificationResult>;

  /**
   * Register a new patient with BNS identity
   * @param registration - Patient registration information
   * @returns Promise resolving to the created patient profile
   */
  registerPatient(registration: PatientRegistration): Promise<PatientProfile>;

  /**
   * Get patient profile by BNS name
   * @param bnsName - The patient's BNS name
   * @returns Promise resolving to patient profile or null if not found
   */
  getPatientProfile(bnsName: string): Promise<PatientProfile | null>;

  /**
   * Update patient profile
   * @param bnsName - The patient's BNS name
   * @param updates - Partial profile updates
   * @returns Promise resolving to updated profile
   */
  updatePatientProfile(bnsName: string, updates: Partial<PatientProfile>): Promise<PatientProfile>;

  /**
   * Rotate patient's encryption keys
   * @param bnsName - The patient's BNS name
   * @param newPassphrase - Optional new passphrase
   * @returns Promise resolving to updated profile with new keys
   */
  rotatePatientKeys(bnsName: string, newPassphrase?: string): Promise<PatientProfile>;

  /**
   * Validate patient identity and ownership
   * @param bnsName - The BNS name to validate
   * @param principal - The principal to verify
   * @returns Promise resolving to true if valid
   */
  validatePatientIdentity(bnsName: string, principal: string): Promise<boolean>;
}

export class PatientIdentity implements IPatientIdentity {
  private bnsResolver: IBNSResolver;
  private keyManager: IKeyManager;
  private patientProfiles: Map<string, PatientProfile> = new Map();

  constructor(bnsResolver?: IBNSResolver, keyManager?: IKeyManager) {
    this.bnsResolver = bnsResolver || new BNSResolver();
    this.keyManager = keyManager || new KeyManager();
  }

  async verifyIdentity(bnsName: string, principal: string): Promise<IdentityVerificationResult> {
    try {
      // Verify BNS name exists
      const bnsInfo = await this.bnsResolver.verifyBNSName(bnsName);
      if (!bnsInfo) {
        return {
          isValid: false,
          error: `BNS name ${bnsName} not found`
        };
      }

      // Verify ownership
      const isOwner = await this.bnsResolver.verifyOwnership(bnsName, principal);
      if (!isOwner) {
        return {
          isValid: false,
          bnsInfo,
          error: `Principal ${principal} does not own BNS name ${bnsName}`
        };
      }

      return {
        isValid: true,
        bnsInfo
      };
    } catch (error) {
      return {
        isValid: false,
        error: `Identity verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async registerPatient(registration: PatientRegistration): Promise<PatientProfile> {
    try {
      // Verify identity first
      const verification = await this.verifyIdentity(registration.bnsName, registration.principal);
      if (!verification.isValid) {
        throw new Error(verification.error || 'Identity verification failed');
      }

      // Check if patient is already registered
      const existingProfile = await this.getPatientProfile(registration.bnsName);
      if (existingProfile) {
        throw new Error(`Patient with BNS name ${registration.bnsName} is already registered`);
      }

      // Generate encryption keys
      const keyPair = await this.keyManager.generateKeyPair(
        registration.bnsName,
        registration.passphrase
      );

      // Create default storage preferences
      const defaultStorageConfig: StorageConfig = {
        provider: 'gaia',
        encryptionEnabled: true,
        backupEnabled: true,
        ...registration.storagePreferences
      };

      // Create patient profile
      const profile: PatientProfile = {
        bnsName: registration.bnsName,
        publicKey: keyPair.publicKey,
        registrationBlock: verification.bnsInfo?.blockHeight || 0,
        encryptionKeyHash: keyPair.keyHash,
        storagePreferences: defaultStorageConfig,
        metadata: registration.metadata,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Store profile (in a real implementation, this would be persisted)
      this.patientProfiles.set(registration.bnsName, profile);

      return profile;
    } catch (error) {
      throw new Error(`Patient registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPatientProfile(bnsName: string): Promise<PatientProfile | null> {
    try {
      // In a real implementation, this would query a database
      return this.patientProfiles.get(bnsName) || null;
    } catch (error) {
      console.error('Error getting patient profile:', error);
      return null;
    }
  }

  async updatePatientProfile(bnsName: string, updates: Partial<PatientProfile>): Promise<PatientProfile> {
    try {
      const existingProfile = await this.getPatientProfile(bnsName);
      if (!existingProfile) {
        throw new Error(`Patient profile not found for BNS name: ${bnsName}`);
      }

      // Prevent updating critical fields
      const { bnsName: _, publicKey: __, registrationBlock: ___, encryptionKeyHash: ____, ...allowedUpdates } = updates;

      const updatedProfile: PatientProfile = {
        ...existingProfile,
        ...allowedUpdates,
        updatedAt: new Date()
      };

      this.patientProfiles.set(bnsName, updatedProfile);
      return updatedProfile;
    } catch (error) {
      throw new Error(`Failed to update patient profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async rotatePatientKeys(bnsName: string, newPassphrase?: string): Promise<PatientProfile> {
    try {
      const existingProfile = await this.getPatientProfile(bnsName);
      if (!existingProfile) {
        throw new Error(`Patient profile not found for BNS name: ${bnsName}`);
      }

      // Generate new key pair
      const newKeyPair = await this.keyManager.generateKeyPair(bnsName, newPassphrase);

      // Update profile with new keys
      const updatedProfile: PatientProfile = {
        ...existingProfile,
        publicKey: newKeyPair.publicKey,
        encryptionKeyHash: newKeyPair.keyHash,
        updatedAt: new Date()
      };

      this.patientProfiles.set(bnsName, updatedProfile);
      return updatedProfile;
    } catch (error) {
      throw new Error(`Failed to rotate patient keys: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async validatePatientIdentity(bnsName: string, principal: string): Promise<boolean> {
    try {
      const verification = await this.verifyIdentity(bnsName, principal);
      return verification.isValid;
    } catch (error) {
      console.error('Error validating patient identity:', error);
      return false;
    }
  }
}