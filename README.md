# Decentralized Health Record Interoperability Protocol

A patient-centric, blockchain-based health records management system that gives patients complete control over their medical data while enabling secure, auditable access for healthcare providers and insurance companies.

## Overview

This project solves the persistent problem of health record fragmentation and lack of interoperability between healthcare providers. By leveraging the Stacks blockchain for access control and identity management while storing encrypted health records in decentralized off-chain storage, patients maintain sovereignty over their medical data through their BNS (Bitcoin Name System) identities.

## Key Features

- **Patient Sovereignty**: Complete patient control over health data using BNS identity
- **Privacy by Design**: Sensitive medical data never touches the blockchain
- **Cryptographic Security**: End-to-end encryption with patient-controlled keys
- **Immutable Audit Trail**: All access events recorded on Bitcoin via Stacks
- **Healthcare Interoperability**: Standard APIs and FHIR-compatible data formats
- **Time-Limited Access**: Granular, temporary permissions for providers and insurers
- **Decentralized Storage**: Encrypted records stored in Gaia or IPFS

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Patient     │    │   Healthcare    │    │   Insurance     │
│   (BNS Owner)   │    │    Provider     │    │    Company      │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   Healthcare API        │
                    │      Gateway            │
                    └────────────┬────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
┌─────────▼───────┐    ┌─────────▼───────┐    ┌─────────▼───────┐
│ Stacks Blockchain│    │  Off-Chain      │    │   Application   │
│                 │    │   Storage       │    │     Layer       │
│ • BNS Identity  │    │                 │    │                 │
│ • Access Control│    │ • Gaia Storage  │    │ • Patient App   │
│ • Audit Trail   │    │ • IPFS Support  │    │ • Provider App  │
│ • Smart Contract│    │ • Encrypted     │    │ • Admin Portal  │
└─────────────────┘    │   Records       │    └─────────────────┘
                       └─────────────────┘
```

## Technology Stack

- **Blockchain**: Stacks (Bitcoin Layer 2)
- **Smart Contracts**: Clarity
- **Identity**: Bitcoin Name System (BNS)
- **Storage**: Gaia Hub / IPFS
- **Testing**: Vitest with Clarinet SDK
- **Languages**: TypeScript, Clarity
- **Standards**: HL7 FHIR for healthcare data

## Project Structure

```
├── contracts/              # Clarity smart contracts
├── tests/                  # Test files for contracts and services
├── settings/               # Network configuration files
├── .specifications/        # Feature specifications
│   └── specs/
│       └── patient-health-records/  # Feature specifications
├── package.json            # Node.js dependencies
├── Clarinet.toml          # Clarinet configuration
├── tsconfig.json          # TypeScript configuration
└── vitest.config.js       # Test configuration
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Clarinet](https://github.com/hirosystems/clarinet) for Stacks development
- [Git](https://git-scm.com/)

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd Decentralized-Health-Record-Interoperability-Protocol
```

2. Install dependencies:

```bash
npm install
```

3. Verify Clarinet installation:

```bash
clarinet --version
```

### Development

#### Running Tests

Run all tests:

```bash
npm test
```

Run tests with coverage and cost analysis:

```bash
npm run test:report
```

Watch mode for continuous testing:

```bash
npm run test:watch
```

#### Smart Contract Development

The project uses Clarinet for Stacks smart contract development. Smart contracts are written in Clarity and stored in the `contracts/` directory.

To add a new contract, update `Clarinet.toml`:

```toml
[contracts.your-contract]
path = "contracts/your-contract.clar"
epoch = "latest"
```

#### Testing Framework

Tests are written using Vitest with the Clarinet SDK integration. The testing environment provides:

- Simulated Stacks blockchain (Simnet)
- Custom Clarity matchers
- Coverage and cost reporting
- Automatic setup and teardown

## Core Components

### 1. Identity Management

- BNS-based patient identity verification
- Cryptographic key generation and management
- Secure authentication and authorization

### 2. Access Control Smart Contract

- Time-limited provider access grants
- Granular record scope permissions
- Automatic access expiration
- Immutable permission audit trail

### 3. Health Record Storage

- AES-256-GCM encryption
- Decentralized storage (Gaia/IPFS)
- Content integrity verification
- Metadata management

### 4. Audit System

- Immutable access logging
- Bitcoin settlement for audit integrity
- Comprehensive audit trail queries
- Privacy-preserving audit proofs

### 5. Healthcare API

- RESTful API with JWT authentication
- FHIR-compatible data formats
- Rate limiting and abuse prevention
- Integration-ready endpoints

## Security Features

- **End-to-End Encryption**: Patient-controlled encryption keys
- **Zero-Knowledge Architecture**: Sensitive data never on blockchain
- **Time-Based Access Control**: Automatic permission expiration
- **Immutable Audit Trail**: Tamper-proof access logging
- **Secure Key Management**: Key rotation and recovery mechanisms
- **Privacy by Design**: GDPR-compliant data handling

## API Endpoints

### Patient Operations

- `POST /api/v1/patients/register` - Register with BNS identity
- `POST /api/v1/records/upload` - Upload encrypted health records
- `GET /api/v1/audit/{patientBNS}` - Get access audit trail

### Provider Operations

- `POST /api/v1/access/request` - Request patient record access
- `GET /api/v1/records/{patientBNS}` - Retrieve authorized records
- `POST /api/v1/access/revoke` - Revoke active access

### Insurance Operations

- `POST /api/v1/insurance/access` - Request claim-specific access
- `GET /api/v1/records/scope/{category}` - Get scoped record access

## Development Roadmap

The project follows a comprehensive specification-driven development approach. Current implementation status can be tracked in `.kiro/specs/patient-health-records/tasks.md`.

### Phase 1: Core Infrastructure

- [x] Project setup and configuration
- [ ] BNS identity management
- [ ] Access control smart contracts
- [ ] Health record encryption and storage

### Phase 2: Access Management

- [ ] Provider access functionality
- [ ] Audit trail implementation
- [ ] Patient web interface
- [ ] Healthcare API gateway

### Phase 3: Integration & Security

- [ ] Insurance company integration
- [ ] Security hardening
- [ ] Comprehensive error handling
- [ ] Integration testing suite

### Phase 4: Production Readiness

- [ ] System monitoring
- [ ] Deployment automation
- [ ] Documentation and API specs

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes and add tests
4. Run the test suite: `npm test`
5. Commit your changes: `git commit -m 'Add your feature'`
6. Push to the branch: `git push origin feature/your-feature`
7. Submit a pull request

## Testing

The project uses a comprehensive testing strategy:

- **Unit Tests**: Individual component testing
- **Integration Tests**: Cross-component functionality
- **Smart Contract Tests**: Clarity contract validation
- **Security Tests**: Encryption and access control
- **End-to-End Tests**: Complete user workflows

The testing environment provides:

- Simulated Stacks blockchain
- Custom Clarity matchers
- Coverage and cost reporting
- Automatic setup and teardown
## Support

For questions, issues, or contributions:

1. Check existing [Issues](../../issues)
2. Review the [specification documents](.kiro/specs/patient-health-records/)
3. Create a new issue with detailed information

## Acknowledgments

- Built on [Stacks](https://stacks.co/) blockchain infrastructure
- Uses [Clarinet](https://github.com/hirosystems/clarinet) for smart contract development
- Integrates with [Bitcoin Name System (BNS)](https://docs.stacks.co/build-apps/references/bns)
- Follows [HL7 FHIR](https://www.hl7.org/fhir/) standards for healthcare interoperability
