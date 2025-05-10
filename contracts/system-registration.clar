;; System Registration Contract
;; Records details of building infrastructure systems

(define-data-var admin principal tx-sender)

;; Map of building systems
(define-map building-systems
  { building-id: (string-ascii 36), system-id: (string-ascii 36) }
  {
    system-type: (string-ascii 20),
    manufacturer: (string-ascii 50),
    model: (string-ascii 50),
    installation-date: uint,
    last-maintenance: uint
  }
)

;; Register a new system for a building
(define-public (register-system
    (building-id (string-ascii 36))
    (system-id (string-ascii 36))
    (system-type (string-ascii 20))
    (manufacturer (string-ascii 50))
    (model (string-ascii 50))
    (installation-date uint))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u403))
    (ok (map-insert building-systems
      { building-id: building-id, system-id: system-id }
      {
        system-type: system-type,
        manufacturer: manufacturer,
        model: model,
        installation-date: installation-date,
        last-maintenance: installation-date
      }
    ))
  )
)

;; Update system maintenance record
(define-public (update-maintenance (building-id (string-ascii 36)) (system-id (string-ascii 36)))
  (let (
    (system (unwrap! (map-get? building-systems { building-id: building-id, system-id: system-id }) (err u404)))
  )
    (begin
      (asserts! (is-eq tx-sender (var-get admin)) (err u403))
      (ok (map-set building-systems
        { building-id: building-id, system-id: system-id }
        (merge system { last-maintenance: block-height })
      ))
    )
  )
)

;; Read-only function to get system details
(define-read-only (get-system-details (building-id (string-ascii 36)) (system-id (string-ascii 36)))
  (map-get? building-systems { building-id: building-id, system-id: system-id })
)

;; Read-only function to check maintenance status
(define-read-only (get-maintenance-status (building-id (string-ascii 36)) (system-id (string-ascii 36)))
  (match (map-get? building-systems { building-id: building-id, system-id: system-id })
    system (ok (- block-height (get last-maintenance system)))
    (err u404)
  )
)
