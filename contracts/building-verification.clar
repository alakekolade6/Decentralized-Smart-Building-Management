;; Building Verification Contract
;; Validates commercial properties and their ownership

(define-data-var admin principal tx-sender)

;; Map of verified buildings
(define-map verified-buildings
  { building-id: (string-ascii 36) }
  {
    owner: principal,
    address: (string-ascii 100),
    square-footage: uint,
    verified: bool,
    verification-date: uint
  }
)

;; Add a new building to the verification system
(define-public (register-building (building-id (string-ascii 36)) (address (string-ascii 100)) (square-footage uint))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u403))
    (ok (map-insert verified-buildings
      { building-id: building-id }
      {
        owner: tx-sender,
        address: address,
        square-footage: square-footage,
        verified: false,
        verification-date: u0
      }
    ))
  )
)

;; Verify a building
(define-public (verify-building (building-id (string-ascii 36)))
  (let (
    (building (unwrap! (map-get? verified-buildings { building-id: building-id }) (err u404)))
  )
    (begin
      (asserts! (is-eq tx-sender (var-get admin)) (err u403))
      (ok (map-set verified-buildings
        { building-id: building-id }
        (merge building {
          verified: true,
          verification-date: block-height
        })
      ))
    )
  )
)

;; Transfer building ownership
(define-public (transfer-ownership (building-id (string-ascii 36)) (new-owner principal))
  (let (
    (building (unwrap! (map-get? verified-buildings { building-id: building-id }) (err u404)))
  )
    (begin
      (asserts! (is-eq tx-sender (get owner building)) (err u403))
      (ok (map-set verified-buildings
        { building-id: building-id }
        (merge building { owner: new-owner })
      ))
    )
  )
)

;; Read-only function to check if a building is verified
(define-read-only (is-building-verified (building-id (string-ascii 36)))
  (match (map-get? verified-buildings { building-id: building-id })
    building (ok (get verified building))
    (err u404)
  )
)

;; Read-only function to get building details
(define-read-only (get-building-details (building-id (string-ascii 36)))
  (map-get? verified-buildings { building-id: building-id })
)
