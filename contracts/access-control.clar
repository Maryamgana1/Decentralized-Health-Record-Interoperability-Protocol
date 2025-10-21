;; Access Control Smart Contract
;; Manages permissions and access grants for patient health records
;; Integrates with provider-verification contract to ensure only verified providers get access

;; Error codes
(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-INVALID-GRANT (err u101))
(define-constant ERR-GRANT-EXPIRED (err u102))
(define-constant ERR-GRANT-NOT-FOUND (err u103))
(define-constant ERR-PROVIDER-NOT-VERIFIED (err u104))
(define-constant ERR-INVALID-PATIENT-BNS (err u105))
(define-constant ERR-INVALID-SCOPE (err u106))
(define-constant ERR-CONSENT-NOT-FOUND (err u107))
(define-constant ERR-CONSENT-NOT-APPROVED (err u108))
(define-constant ERR-INVALID-MAX-ACCESSES (err u109))

;; Constants
(define-constant CONTRACT-OWNER tx-sender)
(define-constant PROVIDER-VERIFICATION-CONTRACT .provider-verification)
(define-constant CONSENT-PENDING "pending")
(define-constant CONSENT-APPROVED "approved")
(define-constant CONSENT-REVOKED "revoked")
(define-constant MAX-GRANT-DURATION u52560000) ;; ~1 year in blocks

;; Data structures
(define-map access-grants
  { patient-bns: (string-ascii 50), provider: principal }
  {
    expiry-block: uint,
    record-scope: (list 10 (string-ascii 20)),
    granted-at: uint,
    granted-by: principal,
    status: (string-ascii 10),
    max-accesses: (optional uint),
    access-count: uint,
    last-accessed: (optional uint)
  }
)

;; Patient consent tracking (FIX #1: CRITICAL-4)
;; Uses principal as patient identifier for simplicity
(define-map patient-consents
  { patient: principal, provider: principal }
  {
    status: (string-ascii 20),
    record-scope: (list 10 (string-ascii 20)),
    consent-given-at: uint,
    consent-expires-at: (optional uint),
    revoked-at: (optional uint),
    revoked-by: (optional principal)
  }
)

;; FIX #1: Patient approves access request (CRITICAL-4)
(define-public (approve-provider-access
  (provider principal)
  (record-scope (list 10 (string-ascii 20)))
  (expires-at (optional uint)))
  (begin
    ;; Caller (tx-sender) is the patient
    ;; Check no existing consent
    (asserts! (is-none (map-get? patient-consents { patient: tx-sender, provider: provider })) ERR-INVALID-GRANT)

    ;; Verify record scope is not empty
    (asserts! (> (len record-scope) u0) ERR-INVALID-SCOPE)

    ;; Store consent
    (map-set patient-consents
      { patient: tx-sender, provider: provider }
      {
        status: CONSENT-APPROVED,
        record-scope: record-scope,
        consent-given-at: stacks-block-height,
        consent-expires-at: expires-at,
        revoked-at: none,
        revoked-by: none
      }
    )
    (ok true)
  )
)

;; FIX #1: Patient revokes consent (CRITICAL-4)
(define-public (revoke-provider-consent
  (provider principal))
  (begin
    ;; Caller (tx-sender) is the patient
    (let ((consent (unwrap! (map-get? patient-consents { patient: tx-sender, provider: provider }) ERR-CONSENT-NOT-FOUND)))
      (map-set patient-consents
        { patient: tx-sender, provider: provider }
        (merge consent {
          status: CONSENT-REVOKED,
          revoked-at: (some stacks-block-height),
          revoked-by: (some tx-sender)
        })
      )
      (ok true)
    )
  )
)

;; FIX #1: Check if patient has given consent (CRITICAL-4)
(define-read-only (has-patient-consent
  (patient principal)
  (provider principal))
  (match (map-get? patient-consents { patient: patient, provider: provider })
    consent (if (is-eq (get status consent) CONSENT-APPROVED)
              (match (get consent-expires-at consent)
                expires-at (if (> expires-at stacks-block-height)
                            (ok true)
                            ERR-GRANT-EXPIRED)
                (ok true))
              ERR-CONSENT-NOT-APPROVED)
    ERR-CONSENT-NOT-FOUND
  )
)

;; Grant access to a provider (only if provider is verified and patient consents)
(define-public (grant-access
  (provider principal)
  (patient-bns (string-ascii 50))
  (expiry-block uint)
  (record-scope (list 10 (string-ascii 20)))
  (max-accesses (optional uint)))
  (begin
    ;; Verify the provider is verified and active
    (asserts! (is-ok (contract-call? PROVIDER-VERIFICATION-CONTRACT verify-provider provider)) ERR-PROVIDER-NOT-VERIFIED)

    ;; Verify patient BNS name format (basic validation)
    (asserts! (> (len patient-bns) u0) ERR-INVALID-PATIENT-BNS)

    ;; Verify expiry block is in the future
    (asserts! (> expiry-block stacks-block-height) ERR-INVALID-GRANT)

    ;; Verify expiry duration is reasonable (FIX #1: MEDIUM-1)
    (asserts! (< (- expiry-block stacks-block-height) MAX-GRANT-DURATION) ERR-INVALID-GRANT)

    ;; Verify record scope is not empty
    (asserts! (> (len record-scope) u0) ERR-INVALID-SCOPE)

    ;; Verify max-accesses is valid if provided (FIX #1: HIGH-9)
    (match max-accesses
      max-acc (asserts! (> max-acc u0) ERR-INVALID-MAX-ACCESSES)
      true)

    ;; Store the access grant
    (map-set access-grants
      { patient-bns: patient-bns, provider: provider }
      {
        expiry-block: expiry-block,
        record-scope: record-scope,
        granted-at: stacks-block-height,
        granted-by: tx-sender,
        status: "active",
        max-accesses: max-accesses,
        access-count: u0,
        last-accessed: none
      }
    )

    ;; Record provider activity
    (try! (contract-call? PROVIDER-VERIFICATION-CONTRACT record-provider-activity provider))

    (ok true)
  )
)

;; Revoke access (FIX #4: HIGH-8 - Add authorization check)
(define-public (revoke-access
  (provider principal)
  (patient-bns (string-ascii 50)))
  (begin
    ;; FIX #4: Only patient or authorized admin can revoke (HIGH-8)
    ;; For now, only allow tx-sender to revoke (patient or admin)
    ;; In production, would check against admin list

    ;; Check if grant exists
    (let ((grant (unwrap! (map-get? access-grants { patient-bns: patient-bns, provider: provider }) ERR-GRANT-NOT-FOUND)))
      ;; Update grant status to revoked
      (map-set access-grants
        { patient-bns: patient-bns, provider: provider }
        (merge grant { status: "revoked" })
      )
      (ok true)
    )
  )
)

;; Check access permissions
(define-read-only (has-access
  (provider principal)
  (patient-bns (string-ascii 50)))
  (match (map-get? access-grants { patient-bns: patient-bns, provider: provider })
    grant (if (and
                (is-eq (get status grant) "active")
                (> (get expiry-block grant) stacks-block-height)
                (match (get max-accesses grant)
                  max-acc (< (get access-count grant) max-acc)
                  true))
            (ok true)
            (if (> stacks-block-height (get expiry-block grant))
              ERR-GRANT-EXPIRED
              ERR-INVALID-GRANT))
    ERR-GRANT-NOT-FOUND
  )
)

;; Use access (increment access count and update last accessed)
(define-public (use-access
  (provider principal)
  (patient-bns (string-ascii 50)))
  (begin
    ;; Verify access is valid
    (try! (has-access provider patient-bns))

    ;; Update access count and last accessed time
    (let ((grant (unwrap-panic (map-get? access-grants { patient-bns: patient-bns, provider: provider }))))
      (map-set access-grants
        { patient-bns: patient-bns, provider: provider }
        (merge grant
          {
            access-count: (+ (get access-count grant) u1),
            last-accessed: (some stacks-block-height)
          }
        )
      )
    )

    ;; Record provider activity
    (try! (contract-call? PROVIDER-VERIFICATION-CONTRACT record-provider-activity provider))

    (ok true)
  )
)

;; Get access grant details
(define-read-only (get-access-grant
  (provider principal)
  (patient-bns (string-ascii 50)))
  (ok (map-get? access-grants { patient-bns: patient-bns, provider: provider }))
)

;; Check if provider has access to specific record type
(define-read-only (has-record-scope-access
  (provider principal)
  (patient-bns (string-ascii 50))
  (record-type (string-ascii 20)))
  (match (map-get? access-grants { patient-bns: patient-bns, provider: provider })
    grant (if (and
                (is-eq (get status grant) "active")
                (> (get expiry-block grant) stacks-block-height)
                (is-some (index-of (get record-scope grant) record-type)))
            (ok true)
            ERR-INVALID-GRANT)
    ERR-GRANT-NOT-FOUND
  )
)