;; Access Control Smart Contract
;; Manages permissions and access grants for patient health records

;; Error codes
(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-INVALID-GRANT (err u101))
(define-constant ERR-GRANT-EXPIRED (err u102))
(define-constant ERR-GRANT-NOT-FOUND (err u103))

;; Data structures
(define-map access-grants
  { patient-bns: (string-ascii 50), provider: principal }
  {
    expiry-block: uint,
    record-scope: (list 10 (string-ascii 20)),
    granted-at: uint,
    status: (string-ascii 10)
  }
)

;; Grant access to a provider
(define-public (grant-access 
  (provider principal) 
  (patient-bns (string-ascii 50))
  (expiry-block uint)
  (record-scope (list 10 (string-ascii 20))))
  (ok true)
)

;; Revoke access
(define-public (revoke-access 
  (provider principal)
  (patient-bns (string-ascii 50)))
  (ok true)
)

;; Check access permissions
(define-read-only (has-access 
  (provider principal)
  (patient-bns (string-ascii 50)))
  (ok false)
)