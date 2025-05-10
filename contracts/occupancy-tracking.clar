;; Occupancy Tracking Contract
;; Monitors space utilization within buildings

(define-data-var admin principal tx-sender)

;; Map of building spaces
(define-map building-spaces
  { building-id: (string-ascii 36), space-id: (string-ascii 36) }
  {
    space-name: (string-ascii 50),
    capacity: uint,
    current-occupancy: uint,
    last-updated: uint
  }
)

;; Register a new space in a building
(define-public (register-space
    (building-id (string-ascii 36))
    (space-id (string-ascii 36))
    (space-name (string-ascii 50))
    (capacity uint))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u403))
    (ok (map-insert building-spaces
      { building-id: building-id, space-id: space-id }
      {
        space-name: space-name,
        capacity: capacity,
        current-occupancy: u0,
        last-updated: block-height
      }
    ))
  )
)

;; Update occupancy count
(define-public (update-occupancy (building-id (string-ascii 36)) (space-id (string-ascii 36)) (occupancy uint))
  (let (
    (space (unwrap! (map-get? building-spaces { building-id: building-id, space-id: space-id }) (err u404)))
  )
    (begin
      (asserts! (is-eq tx-sender (var-get admin)) (err u403))
      (asserts! (<= occupancy (get capacity space)) (err u400))
      (ok (map-set building-spaces
        { building-id: building-id, space-id: space-id }
        (merge space {
          current-occupancy: occupancy,
          last-updated: block-height
        })
      ))
    )
  )
)

;; Read-only function to get space details
(define-read-only (get-space-details (building-id (string-ascii 36)) (space-id (string-ascii 36)))
  (map-get? building-spaces { building-id: building-id, space-id: space-id })
)

;; Read-only function to check occupancy percentage
(define-read-only (get-occupancy-percentage (building-id (string-ascii 36)) (space-id (string-ascii 36)))
  (match (map-get? building-spaces { building-id: building-id, space-id: space-id })
    space (ok (/ (* (get current-occupancy space) u100) (get capacity space)))
    (err u404)
  )
)
