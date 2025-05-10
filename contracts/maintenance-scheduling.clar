;; Maintenance Scheduling Contract
;; Coordinates building upkeep

(define-data-var admin principal tx-sender)

;; Map of maintenance tasks
(define-map maintenance-tasks
  { building-id: (string-ascii 36), task-id: (string-ascii 36) }
  {
    system-id: (string-ascii 36),
    description: (string-ascii 100),
    scheduled-date: uint,
    completed: bool,
    completion-date: uint,
    assigned-to: principal
  }
)

;; Schedule a maintenance task
(define-public (schedule-task
    (building-id (string-ascii 36))
    (task-id (string-ascii 36))
    (system-id (string-ascii 36))
    (description (string-ascii 100))
    (scheduled-date uint)
    (assigned-to principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u403))
    (ok (map-insert maintenance-tasks
      { building-id: building-id, task-id: task-id }
      {
        system-id: system-id,
        description: description,
        scheduled-date: scheduled-date,
        completed: false,
        completion-date: u0,
        assigned-to: assigned-to
      }
    ))
  )
)

;; Mark task as completed
(define-public (complete-task (building-id (string-ascii 36)) (task-id (string-ascii 36)))
  (let (
    (task (unwrap! (map-get? maintenance-tasks { building-id: building-id, task-id: task-id }) (err u404)))
  )
    (begin
      (asserts! (or (is-eq tx-sender (var-get admin)) (is-eq tx-sender (get assigned-to task))) (err u403))
      (ok (map-set maintenance-tasks
        { building-id: building-id, task-id: task-id }
        (merge task {
          completed: true,
          completion-date: block-height
        })
      ))
    )
  )
)

;; Reassign a task
(define-public (reassign-task (building-id (string-ascii 36)) (task-id (string-ascii 36)) (new-assignee principal))
  (let (
    (task (unwrap! (map-get? maintenance-tasks { building-id: building-id, task-id: task-id }) (err u404)))
  )
    (begin
      (asserts! (is-eq tx-sender (var-get admin)) (err u403))
      (ok (map-set maintenance-tasks
        { building-id: building-id, task-id: task-id }
        (merge task { assigned-to: new-assignee })
      ))
    )
  )
)

;; Read-only function to get task details
(define-read-only (get-task-details (building-id (string-ascii 36)) (task-id (string-ascii 36)))
  (map-get? maintenance-tasks { building-id: building-id, task-id: task-id })
)

;; Read-only function to check if task is overdue
(define-read-only (is-task-overdue (building-id (string-ascii 36)) (task-id (string-ascii 36)))
  (match (map-get? maintenance-tasks { building-id: building-id, task-id: task-id })
    task (ok (and (not (get completed task)) (> block-height (get scheduled-date task))))
    (err u404)
  )
)
