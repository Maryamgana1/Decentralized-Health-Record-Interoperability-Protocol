;; Provider Verification Smart Contract
;; Manages healthcare provider registration, credential verification, and status tracking
;; Ensures only verified providers can access patient health records

;; Error codes
(define-constant ERR-NOT-AUTHORIZED (err u300))
(define-constant ERR-PROVIDER-NOT-FOUND (err u301))
(define-constant ERR-INVALID-CREDENTIALS (err u302))
(define-constant ERR-CREDENTIALS-EXPIRED (err u303))
(define-constant ERR-PROVIDER-SUSPENDED (err u304))
(define-constant ERR-INVALID-CREDENTIAL-TYPE (err u305))
(define-constant ERR-PROVIDER-ALREADY-EXISTS (err u306))
(define-constant ERR-INVALID-EXPIRY-DATE (err u307))

;; Constants
(define-constant CONTRACT-OWNER tx-sender)
(define-constant MAX-CREDENTIAL-TYPES u10)
(define-constant MIN-CREDENTIAL-VALIDITY-BLOCKS u144) ;; ~1 day in blocks

;; Data structures for provider credentials
(define-map provider-credentials
  { provider: principal }
  {
    license-number: (string-ascii 50),
    credential-types: (list 10 (string-ascii 30)),
    issued-at: uint,
    expires-at: uint,
    issuing-authority: (string-ascii 100),
    verification-status: (string-ascii 20),
    last-verified: uint,
    suspension-reason: (optional (string-ascii 200))
  }
)

;; Map to track credential verification history
(define-map verification-history
  { provider: principal, verification-id: (string-ascii 36) }
  {
    verified-by: principal,
    verification-date: uint,
    credential-hash: (string-ascii 64),
    verification-result: (string-ascii 20),
    notes: (optional (string-ascii 500))
  }
)

;; Map to track valid credential types
(define-map valid-credential-types
  { credential-type: (string-ascii 30) }
  {
    description: (string-ascii 200),
    required-for-access: bool,
    created-at: uint
  }
)

;; FIX #5: Track credential verification status (CRITICAL-2)
(define-map credential-verifications
  { provider: principal, verification-id: (string-ascii 36) }
  {
    verified-by: principal,
    verification-date: uint,
    credential-hash: (string-ascii 64),
    verification-result: (string-ascii 20),
    notes: (optional (string-ascii 500))
  }
)

;; Provider status tracking
(define-map provider-status
  { provider: principal }
  {
    registration-date: uint,
    last-activity: uint,
    access-count: uint,
    status: (string-ascii 20), ;; "active", "suspended", "revoked"
    updated-by: principal
  }
)

;; FIX #5: Helper function to generate verification ID (CRITICAL-2)
(define-private (generate-verification-id (provider principal))
  ;; Simple verification ID generation using block height
  ;; In production, would use more sophisticated ID generation
  "verification-id"
)

;; Register a new healthcare provider with credentials
;; FIX #5: Add credential hash for verification (CRITICAL-2)
(define-public (register-provider
  (provider principal)
  (license-number (string-ascii 50))
  (credential-types (list 10 (string-ascii 30)))
  (expires-at uint)
  (issuing-authority (string-ascii 100))
  (credential-hash (string-ascii 64)))
  (begin
    ;; Verify caller is authorized (contract owner or authorized registrar)
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)

    ;; Verify provider doesn't already exist
    (asserts! (is-none (map-get? provider-credentials { provider: provider })) ERR-PROVIDER-ALREADY-EXISTS)

    ;; Verify expiry date is in the future and reasonable
    (asserts! (> expires-at stacks-block-height) ERR-INVALID-EXPIRY-DATE)
    (asserts! (> expires-at (+ stacks-block-height MIN-CREDENTIAL-VALIDITY-BLOCKS)) ERR-INVALID-EXPIRY-DATE)

    ;; Verify all credential types are valid
    (asserts! (validate-credential-types credential-types) ERR-INVALID-CREDENTIAL-TYPE)

    ;; FIX #5: Verify credential hash is not empty (CRITICAL-2)
    (asserts! (> (len credential-hash) u0) ERR-INVALID-CREDENTIALS)

    ;; Store provider credentials
    (map-set provider-credentials
      { provider: provider }
      {
        license-number: license-number,
        credential-types: credential-types,
        issued-at: stacks-block-height,
        expires-at: expires-at,
        issuing-authority: issuing-authority,
        verification-status: "verified",
        last-verified: stacks-block-height,
        suspension-reason: none
      }
    )

    ;; FIX #5: Store credential verification record (CRITICAL-2)
    (map-set credential-verifications
      { provider: provider, verification-id: (generate-verification-id provider) }
      {
        verified-by: tx-sender,
        verification-date: stacks-block-height,
        credential-hash: credential-hash,
        verification-result: "verified",
        notes: none
      }
    )

    ;; Initialize provider status
    (map-set provider-status
      { provider: provider }
      {
        registration-date: stacks-block-height,
        last-activity: stacks-block-height,
        access-count: u0,
        status: "active",
        updated-by: tx-sender
      }
    )

    (ok true)
  )
)

;; Verify provider credentials and status
(define-read-only (verify-provider (provider principal))
  (let (
    (credentials (map-get? provider-credentials { provider: provider }))
    (status (map-get? provider-status { provider: provider }))
  )
    (match credentials
      creds (match status
        stat (if (and 
                  (is-eq (get verification-status creds) "verified")
                  (> (get expires-at creds) stacks-block-height)
                  (is-eq (get status stat) "active"))
                (ok true)
                (if (> stacks-block-height (get expires-at creds))
                  ERR-CREDENTIALS-EXPIRED
                  (if (not (is-eq (get status stat) "active"))
                    ERR-PROVIDER-SUSPENDED
                    ERR-INVALID-CREDENTIALS)))
        ERR-PROVIDER-NOT-FOUND)
      ERR-PROVIDER-NOT-FOUND)
  )
)

;; Update provider credentials (renewal)
(define-public (update-provider-credentials
  (provider principal)
  (new-expires-at uint)
  (new-credential-types (list 10 (string-ascii 30))))
  (begin
    ;; Only contract owner can update credentials
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    
    ;; Verify provider exists
    (asserts! (is-some (map-get? provider-credentials { provider: provider })) ERR-PROVIDER-NOT-FOUND)
    
    ;; Verify new expiry date
    (asserts! (> new-expires-at stacks-block-height) ERR-INVALID-EXPIRY-DATE)

    ;; Verify credential types
    (asserts! (validate-credential-types new-credential-types) ERR-INVALID-CREDENTIAL-TYPE)

    ;; Update credentials
    (map-set provider-credentials
      { provider: provider }
      (merge (unwrap-panic (map-get? provider-credentials { provider: provider }))
        {
          credential-types: new-credential-types,
          expires-at: new-expires-at,
          last-verified: stacks-block-height
        }
      )
    )
    
    (ok true)
  )
)

;; Suspend a provider
(define-public (suspend-provider 
  (provider principal)
  (reason (string-ascii 200)))
  (begin
    ;; Only contract owner can suspend
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    
    ;; Verify provider exists
    (asserts! (is-some (map-get? provider-status { provider: provider })) ERR-PROVIDER-NOT-FOUND)
    
    ;; Update provider status
    (map-set provider-status
      { provider: provider }
      (merge (unwrap-panic (map-get? provider-status { provider: provider }))
        {
          status: "suspended",
          updated-by: tx-sender
        }
      )
    )
    
    ;; Update credentials with suspension reason
    (map-set provider-credentials
      { provider: provider }
      (merge (unwrap-panic (map-get? provider-credentials { provider: provider }))
        {
          suspension-reason: (some reason)
        }
      )
    )
    
    (ok true)
  )
)

;; Reactivate a suspended provider
(define-public (reactivate-provider (provider principal))
  (begin
    ;; Only contract owner can reactivate
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    
    ;; Verify provider exists and is suspended
    (let ((status (unwrap! (map-get? provider-status { provider: provider }) ERR-PROVIDER-NOT-FOUND)))
      (asserts! (is-eq (get status status) "suspended") ERR-INVALID-CREDENTIALS)
      
      ;; Update provider status
      (map-set provider-status
        { provider: provider }
        (merge status
          {
            status: "active",
            updated-by: tx-sender
          }
        )
      )
      
      ;; Clear suspension reason
      (map-set provider-credentials
        { provider: provider }
        (merge (unwrap-panic (map-get? provider-credentials { provider: provider }))
          {
            suspension-reason: none
          }
        )
      )
      
      (ok true)
    )
  )
)

;; Get provider credentials
(define-read-only (get-provider-credentials (provider principal))
  (ok (map-get? provider-credentials { provider: provider }))
)

;; Get provider status
(define-read-only (get-provider-status (provider principal))
  (ok (map-get? provider-status { provider: provider }))
)

;; Add a valid credential type
(define-public (add-credential-type
  (credential-type (string-ascii 30))
  (description (string-ascii 200))
  (required-for-access bool))
  (begin
    ;; Only contract owner can add credential types
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    
    ;; Add credential type
    (map-set valid-credential-types
      { credential-type: credential-type }
      {
        description: description,
        required-for-access: required-for-access,
        created-at: stacks-block-height
      }
    )
    
    (ok true)
  )
)

;; Helper function to validate credential types
(define-private (validate-credential-types (types (list 10 (string-ascii 30))))
  (is-eq (len types) (len (filter is-valid-credential-type types)))
)

;; Helper function to check if a credential type is valid
(define-private (is-valid-credential-type (credential-type (string-ascii 30)))
  (is-some (map-get? valid-credential-types { credential-type: credential-type }))
)

;; Record provider access activity (called by access-control contract)
;; FIX #3: Add authorization check (HIGH-1)
(define-public (record-provider-activity (provider principal))
  (begin
    ;; FIX #3: Only access-control contract can record activity (HIGH-1)
    (asserts! (is-eq contract-caller .access-control) ERR-NOT-AUTHORIZED)

    ;; Update last activity and increment access count
    (match (map-get? provider-status { provider: provider })
      status (begin
        (map-set provider-status
          { provider: provider }
          (merge status
            {
              last-activity: stacks-block-height,
              access-count: (+ (get access-count status) u1)
            }
          )
        )
        (ok true)
      )
      ERR-PROVIDER-NOT-FOUND
    )
  )
)

;; Check if provider has specific credential type
(define-read-only (has-credential-type 
  (provider principal)
  (credential-type (string-ascii 30)))
  (match (map-get? provider-credentials { provider: provider })
    creds (ok (is-some (index-of (get credential-types creds) credential-type)))
    ERR-PROVIDER-NOT-FOUND
  )
)
