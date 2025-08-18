# Smart Contracts

This directory contains the Clarity smart contracts for the Patient Health Records system.

## Contracts

### access-control.clar
Manages access permissions and grants for healthcare providers.

**Key Functions:**
- `grant-access`: Grant time-limited access to providers
- `revoke-access`: Revoke provider access permissions
- `has-access`: Check if provider has valid access

### audit-trail.clar
Records immutable audit events for all system interactions.

**Key Functions:**
- `log-event`: Record access events on blockchain
- `get-patient-audit-trail`: Retrieve patient's audit history

## Configuration

These contracts are configured in `Clarinet.toml` and will be deployed to the Stacks blockchain for decentralized access control and audit logging.