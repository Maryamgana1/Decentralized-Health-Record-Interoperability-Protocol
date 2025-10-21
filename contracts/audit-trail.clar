;; Audit Trail Smart Contract
;; Records immutable audit events for health record access
;; FIX #2: Complete implementation (CRITICAL-3, CRITICAL-5)

;; Error codes
(define-constant ERR-INVALID-EVENT (err u200))
(define-constant ERR-UNAUTHORIZED-LOGGER (err u201))
(define-constant ERR-EVENT-NOT-FOUND (err u202))

;; Data structures
;; FIX #2: Store audit events with full details
(define-map audit-events
  { event-id: (string-ascii 36) }
  {
    patient-bns: (string-ascii 50),
    provider: principal,
    event-type: (string-ascii 20),
    block-height: uint,
    record-scope: (list 10 (string-ascii 20)),
    details: (optional (string-ascii 500))
  }
)

;; FIX #2: Index events by patient for efficient retrieval
(define-map patient-event-index
  { patient-bns: (string-ascii 50), event-number: uint }
  { event-id: (string-ascii 36) }
)

;; FIX #2: Track total events per patient
(define-map patient-event-count
  { patient-bns: (string-ascii 50) }
  { count: uint }
)

;; FIX #2: Log an audit event with full implementation (CRITICAL-3, CRITICAL-5)
(define-public (log-event
  (event-id (string-ascii 36))
  (patient-bns (string-ascii 50))
  (provider principal)
  (event-type (string-ascii 20))
  (record-scope (list 10 (string-ascii 20)))
  (details (optional (string-ascii 500))))
  (begin
    ;; FIX #2: Only access-control contract can log (HIGH-10)
    (asserts! (is-eq contract-caller .access-control) ERR-UNAUTHORIZED-LOGGER)

    ;; FIX #2: Validate inputs
    (asserts! (> (len event-id) u0) ERR-INVALID-EVENT)
    (asserts! (is-none (map-get? audit-events { event-id: event-id })) ERR-INVALID-EVENT)
    (asserts! (> (len patient-bns) u0) ERR-INVALID-EVENT)
    (asserts! (> (len event-type) u0) ERR-INVALID-EVENT)

    ;; FIX #2: Store the event
    (map-set audit-events
      { event-id: event-id }
      {
        patient-bns: patient-bns,
        provider: provider,
        event-type: event-type,
        block-height: stacks-block-height,
        record-scope: record-scope,
        details: details
      }
    )

    ;; FIX #2: Update patient event index
    (let ((current-count (default-to u0 (get count (map-get? patient-event-count { patient-bns: patient-bns })))))
      (map-set patient-event-index
        { patient-bns: patient-bns, event-number: current-count }
        { event-id: event-id }
      )
      (map-set patient-event-count
        { patient-bns: patient-bns }
        { count: (+ current-count u1) }
      )
    )

    (ok true)
  )
)

;; FIX #2: Get total audit events for a patient
(define-read-only (get-patient-audit-trail
  (patient-bns (string-ascii 50)))
  (match (map-get? patient-event-count { patient-bns: patient-bns })
    count-data (ok (get count count-data))
    (ok u0)
  )
)

;; FIX #2: Get specific event details
(define-read-only (get-event-details (event-id (string-ascii 36)))
  (ok (map-get? audit-events { event-id: event-id }))
)

;; FIX #2: Get event ID by patient and index
(define-read-only (get-patient-event-id
  (patient-bns (string-ascii 50))
  (event-number uint))
  (ok (map-get? patient-event-index { patient-bns: patient-bns, event-number: event-number }))
)
