## System‑Wide UI ↔ Backend Disconnect – Execution Tracker

This document tracks progress to fully resolve the UI not showing existing backend data and to standardize fetch → bind → save across the platform.

### Scope and success criteria
- [x] Standardize all data fetching to `api()` or `json.success` checks and read from `json.data`.
- [x] Ensure every page loads existing data on mount, binds to controlled state, saves, and persists after refresh.
- [x] Return relationship‑enriched responses (names, not IDs) where the UI displays relations.
- [x] Realtime subscriptions invalidate caches so multiple users see updates quickly.
- [ ] Loading and error states on all key lists/forms.
- [ ] Verification testing protocol executed for each view.

### Cross‑cutting standards (apply everywhere)
- [x] Use `json.success` and `json.data` (System Bible) and surface `json.error.message`.
- [x] React Query: invalidate relevant keys on mutation; avoid stale data.
- [x] Realtime: subscribe with `useRealtimeAdminUpdates(tenantId)`; derive `tenantId` from `df-tenant` cookie with `/api/tenant/me` fallback.
- [ ] Global UX: show skeletons/spinners on load; disable save buttons while saving; show error toasts.

### Verification protocol (run per page)
- [ ] Create → Refresh → Still there
- [ ] Edit → Open in new tab → Shows changes
- [ ] Delete → Refresh → Still gone
- [ ] Multi‑user: Change in A → Visible in B without manual refresh (or within 5s)

### Relationship data requirements
- [x] Bookings API returns: `customer_name`, `service_name`, `vehicle_name`, `address` (flattened)
- [x] Booking detail also shows related names, not IDs
- [ ] Forms that need services/staff/customers load options via proper endpoints

---

## Work items by area

### Admin Settings
- Business details (`/admin/settings`)
  - [ ] Fetch on mount via `/api/settings/tenant`
  - [ ] Bind controlled inputs; show errors; disable save while saving
  - [ ] Save via `PATCH /api/settings/tenant`; invalidate/refetch
- [ ] Verification protocol completed (pending QA)

- Branding (`/admin/settings/branding`)
  - [x] Robust fetch: prefer `json.data.tenant`
  - [x] Save validation (check `json.success`)
  - [ ] Show loading/error; disable save while saving
  - [ ] Verification protocol completed

- Payments (`/admin/settings/payments`)
  - [x] Deposit defaults load/save (`tenants.business_prefs.deposit_percent`, `deposit_min_gbp`)
  - [ ] Show loading/error; disable save while saving
  - [ ] Verification protocol completed

- Working hours (`/admin/settings/booking`)
  - [x] Load week grid from `/api/admin/availability/work-patterns`
  - [x] Save per‑day upsert; persist `service_radius_km`
  - [ ] Verification protocol completed (onboarding → settings consistency)

- Blackouts (`/admin/settings/availability/blackouts`)
  - [x] List via `GET /api/admin/availability/blackouts`
  - [x] Add/remove via POST/DELETE; invalidate
  - [x] Loading/error, and verification protocol (pending QA)

### Services
- Admin Services (`/admin/settings/services`)
  - [x] Queries/mutations standardized to `json.success`
  - [ ] Onboarding POSTs to `/api/admin/services` verified
  - [ ] Verification protocol completed

-### Customers & Inventory
- Customers (`/admin/customers`)
  - [x] Fetch/bind with loading/error; tenant-aware realtime
  - [ ] Save and verification complete
- Inventory (`/admin/inventory`)
  - [x] Standardized to `json.success` with errors handled
  - [ ] Verification protocol completed

### Bookings & Jobs
- Bookings list (`/admin/bookings`)
  - [x] Use `json.success`; parse `json.data.bookings`
  - [x] Loading and error states with retry
- [x] Realtime: pass actual tenant ID to `useRealtimeAdminUpdates`
  - [x] Relationship data displayed (names, not IDs)
  - [ ] Verification protocol completed

- Booking detail (`/bookings/[id]`)
  - [x] Ensure relationship data shown (names/labels)
  - [x] Deposit and balance collection wired
  - [x] Loading/error states with retry
  - [ ] Verification protocol completed

- Jobs (`/admin/jobs`, `/api/jobs`)
  - [ ] Lists and detail views follow fetch‑bind‑save; show loading/error
  - [ ] Start/Complete flow verified with activity logs; realtime invalidations
  - [ ] Verification protocol completed

### Invoices & Payments
- Invoices list/detail
  - [x] List: standardized fetch, loading/error; PDF link
  - [x] Webhook reconciliation and receipt emails
  - [ ] Verification protocol completed

- Payments (`/payments`)
  - [x] Fetch, filters, refund actions with loading/error; verification pending

### Messaging
- Conversations/send (`/admin/messages`)
  - [x] Queries standardized; send rate‑limited with surfaced errors
  - [x] Loading/error states; tenant-aware realtime; verification pending

- Triggers (`/admin/messaging/triggers`)
  - [x] Rules load/save and Run Now via `/api/messaging/run`
  - [ ] Loading/error; verification completed

### Staff Mobile
- Today/Upcoming/Past (`/staff/*`)
  - [x] Use standardized `fetchJobs`; loading/error states; tenant-aware realtime
  - [x] Start/Complete actions disable buttons, confirm success; realtime invalidations
  - [ ] Verification protocol completed (multi‑user sync)

### Public booking flow
- New booking (`/book/new`) & confirmation
  - [x] API calls check `json.success`; throw with `json.error.message`
  - [ ] Loading/error states; verification completed

---

## Critical validation scenarios (must pass)
- Onboarding → Settings hours parity
  - [ ] Set Monday 09:00–17:00 in onboarding → See same in settings → Change to 10:00–18:00 → Save → Refresh shows 10:00–18:00

- Cross‑page data flow
  - [ ] Add a Service in settings → Booking form options include it → Price recalculates accordingly

- Multi‑user realtime
  - [ ] Update booking in browser A → Browser B reflects change within 5s (or after automatic invalidation)

- Payments lifecycle
  - [ ] Deposit checkout → webhook → invoice updated; UI shows updated balance
  - [ ] Balance checkout → webhook → invoice paid; booking `payment_status` becomes `paid`

---

## Progress log (high‑signal)
- [x] `/api/bookings` returns relationship‑enriched data; UI now shows names/labels
- [x] `/admin/bookings` uses `json.success`, robust loading/error, and displays enriched fields
- [x] Working Hours UI implemented with load/save via `/api/admin/availability/work-patterns`
- [x] Branding settings fetch/save hardened
- [x] Deposit/balance flows implemented; webhook reconciles and sends receipts
- [x] Messaging run endpoint and triggers UI implemented; message send rate‑limited
- [ ] Realtime tenant wiring across admin pages (pending)
- [ ] Complete verification protocol per page (pending)

---

## How to use this tracker
- Update checkboxes as items are completed.
- For each page, do the Verification protocol and note issues inline.
- Keep Progress log high‑signal; link commits next to items as they land.


