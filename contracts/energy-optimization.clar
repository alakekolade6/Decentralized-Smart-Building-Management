;; Energy Optimization Contract
;; Manages efficient resource usage

(define-data-var admin principal tx-sender)

;; Map of energy consumption records
(define-map energy-consumption
  { building-id: (string-ascii 36), timestamp: uint }
  {
    electricity-kwh: uint,
    gas-therms: uint,
    water-gallons: uint,
    temperature: int,
    optimization-active: bool
  }
)

;; Record energy consumption
(define-public (record-consumption
    (building-id (string-ascii 36))
    (electricity-kwh uint)
    (gas-therms uint)
    (water-gallons uint)
    (temperature int))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u403))
    (ok (map-insert energy-consumption
      { building-id: building-id, timestamp: block-height }
      {
        electricity-kwh: electricity-kwh,
        gas-therms: gas-therms,
        water-gallons: water-gallons,
        temperature: temperature,
        optimization-active: false
      }
    ))
  )
)

;; Toggle optimization status
(define-public (toggle-optimization (building-id (string-ascii 36)) (timestamp uint) (active bool))
  (let (
    (consumption (unwrap! (map-get? energy-consumption { building-id: building-id, timestamp: timestamp }) (err u404)))
  )
    (begin
      (asserts! (is-eq tx-sender (var-get admin)) (err u403))
      (ok (map-set energy-consumption
        { building-id: building-id, timestamp: timestamp }
        (merge consumption { optimization-active: active })
      ))
    )
  )
)

;; Read-only function to get latest consumption
(define-read-only (get-latest-consumption (building-id (string-ascii 36)))
  (map-get? energy-consumption { building-id: building-id, timestamp: block-height })
)

;; Read-only function to check if optimization is active
(define-read-only (is-optimization-active (building-id (string-ascii 36)) (timestamp uint))
  (match (map-get? energy-consumption { building-id: building-id, timestamp: timestamp })
    consumption (ok (get optimization-active consumption))
    (err u404)
  )
)
