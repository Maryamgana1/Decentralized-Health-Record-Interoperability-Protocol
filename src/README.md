# Patient Health Records System - Source Code Structure

This directory contains the core implementation of the Patient Health Records system.

## Directory Structure

```
src/
├── models/           # Data models and TypeScript interfaces
│   ├── PatientProfile.ts    # Patient identity and profile data
│   ├── HealthRecord.ts      # Encrypted health record structure
│   ├── AccessGrant.ts       # Provider access permissions
│   ├── AuditEvent.ts        # Audit trail event logging
│   ├── types.ts             # Common types and enums
│   └── index.ts             # Model exports
├── services/         # Business logic and service layers
│   ├── identity/            # BNS identity and key management
│   ├── storage/             # Health record storage adapters
│   ├── encryption/          # Encryption and decryption services
│   ├── audit/               # Audit logging and querying
│   ├── access/              # Provider access control
│   └── index.ts             # Service exports
├── api/              # REST API gateway and endpoints
│   ├── routes/              # API route definitions
│   ├── middleware/          # Authentication, validation, etc.
│   ├── types.ts             # API request/response types
│   └── index.ts             # API exports
└── index.ts          # Main entry point
```

## Key Components

### Models
- **PatientProfile**: Represents patient identity linked to BNS names
- **HealthRecord**: Encrypted health data with integrity verification
- **AccessGrant**: Time-limited provider permissions with scope control
- **AuditEvent**: Immutable access logs for transparency

### Services
- **Identity**: BNS verification and cryptographic key management
- **Storage**: Decentralized storage adapters (Gaia, IPFS)
- **Encryption**: AES-256-GCM encryption for health records
- **Audit**: Immutable logging with Bitcoin settlement
- **Access**: Provider permission validation and enforcement

### API
- **Routes**: RESTful endpoints for patient and provider interactions
- **Middleware**: Authentication, rate limiting, and error handling
- **Types**: Request/response interfaces for type safety

## Requirements Addressed

This structure addresses the following requirements:
- **1.2**: Patient registration with BNS identity (PatientProfile)
- **2.3**: Content hash generation for integrity (HealthRecord)
- **7.2**: Strong encryption and secure key management (services/encryption, services/identity)