## API & Backend Compliance Tracker (System Bible)

This document analyzes and tracks our API/backend against the System Bible. It highlights gaps that can lead to poor user experience and defines concrete verification steps and acceptance criteria.

### Goals
- Ensure every endpoint adheres to the standard response schema
- Enforce coherent auth/tenant behavior (no 400s for auth issues; clear 401/403 with codes)
- Guarantee robust validation, rate limiting, and idempotency on sensitive routes
- Provide relationship-enriched data for UI without N+1
- Maintain realtime cache invalidation consistency

### System Bible Standard (reference)
Response format for all endpoints:
```json
{
  "success": true,
  "data": {},
  "error": { "code": "", "message": "", "details": {} },
  "meta": { "timestamp": "ISO8601", "pagination": {}, "version": "" }
}
```

### Cross‑cutting compliance checklist
- [x] Response schema helpers used: `createSuccessResponse`, `createErrorResponse`
- [ ] No raw `NextResponse.json` for business responses (OK for health/special cases)
- [x] Unauthorized → HTTP 401 with `UNAUTHORIZED`; Forbidden → HTTP 403 with `FORBIDDEN`
- [x] Missing tenant/session fallbacks: accept `x-tenant-id` header or `df-tenant` cookie where read access is allowed (bootstrap)
- [ ] All POST/PATCH/DELETE validate body via Zod; friendly `INVALID_INPUT` errors
- [ ] Sensitive routes rate-limited with `checkRateLimit`
- [ ] Idempotency keys for mutation endpoints that can be retried (emails/SMS/refunds/webhooks)
- [ ] Pagination for list endpoints; return `meta.pagination`
- [x] Relationship-enriched responses where UI requires names/labels
- [x] Realtime invalidation consistent (`useRealtimeAdminUpdates` → cache invalidations)
- [ ] Clear, consistent `API_ERROR_CODES` usage across routes
- [ ] Proper HTTP caching semantics where applicable (guest/public)
- [ ] Structured logging + Sentry capture for 5xx

### Current risk highlights (bad UX potential)
- [!] Mixed error codes/status across older endpoints → confusing UI, retry logic breaks
- [!] Some routes still use `NextResponse.json` directly (inconsistent envelope)
- [!] Incomplete input validation → cryptic DB errors surfacing as 500s
- [!] Missing pagination on large lists (bookings, invoices, customers) → slow initial loads
- [>] Inconsistent idempotency for mutations (refunds, messaging bulk) → double submissions risk
- [>] Partial tenant fallback coverage → first-load 401s if cookies lag
- [>] Missing rate limiting on a few sensitive endpoints → abuse potential

### Endpoint inventory (by domain)

Auth/session & tenant
- [x] `POST /api/session/set` (cookies, df-tenant, df-role)
- [x] `GET /api/tenant/me` (auth → tenant; fallback via header/cookie; 401/404 correct)
- [ ] `GET /api/profiles/me` (response schema & errors consistent)

Settings & admin
- [x] `GET/PATCH /api/settings/tenant` (Zod, consistent errors)
- [x] `GET/POST /api/admin/availability/work-patterns` (envelope OK; NextResponse used → migrate to helpers)
- [x] `GET/POST/PATCH/DELETE /api/admin/services[/**]` (validation+errors OK)
- [x] `GET/POST/DELETE /api/admin/availability/blackouts` (envelope OK)

Catalog & guest
- [x] `GET /api/guest/services` (tenant param/header required; normalized duration)
- [x] `GET /api/guest/availability/slots` (envelope consistent)
- [ ] `POST /api/guest/quotes` (validate+codes)

Bookings & jobs
- [x] `GET/POST /api/bookings` (enriched relations; tenant fallback for read)
- [x] `GET /api/bookings/[id]` (envelope OK)
- [x] `GET /api/jobs` (tenant fallback; staff scoping; envelope OK)
- [x] `POST /api/jobs/[id]/start|complete|evidence` (envelope OK)

Invoices & payments
- [x] `GET /api/invoices`, `GET /api/invoices/[id]` (envelope OK)
- [x] `POST /api/payments/checkout-booking|checkout-invoice` (validated; rate-limited)
- [x] `POST /api/payments/refund` (rate-limit; idempotency key check TBD)
- [x] `POST /api/webhooks/stripe` (reconcile invoice; idempotent logic)
- [x] `POST /api/payments/mark-paid` (demo; envelope OK)

Messaging
- [x] `POST /api/messages/send` (rate-limit; sanitize; helpers used)
- [x] `GET/PATCH /api/messaging/rules` (envelope OK)
- [x] `POST /api/messaging/run` (idempotency for send; envelope OK)

Analytics
- [x] `GET /api/analytics/kpis` (tenant fallback; 401 for missing)
- [ ] `GET /api/analytics/revenue` (uses `NextResponse.json` → migrate to helpers)
- [ ] Other analytics endpoints (CLV, service-popularity, etc.) ensure helpers+codes

Utilities & health
- [x] `GET /api/activities/recent` (tenant fallback; helpers)
- [x] `GET /api/health-check` (OK to keep direct `NextResponse.json`, but ensure schema parity)

### Migration queue (high priority)
- [ ] Replace `NextResponse.json` with helpers in:
  - ~~`admin/availability/work-patterns/route.ts` (all paths)~~ ✅
  - ~~`analytics/revenue/route.ts` (GET)~~ ✅ (+ rate limit)
  - ~~`admin/services/route.ts` (GET, POST)~~ ✅
  - ~~`quotes/route.ts` (GET, POST)~~ ✅
  - Any remaining legacy endpoints (grep audit)
- [ ] Normalize error codes & statuses across:
  - All analytics endpoints → 401/403/404/422/409/429/500 with clear codes
  - Guest endpoints → `MISSING_REQUIRED_FIELD` + 400 for missing tenant_id
- [ ] Add Zod validation where missing (quotes, bulk/messaging, exports)
- [ ] Add pagination for list endpoints (bookings, invoices, customers, payments)
  - ✅ Bookings, Invoices, Customers, Payments (page/pageSize/total via meta.pagination)
- [ ] Add rate limiting on: refunds, exports, analytics heavy endpoints
  - ✅ Refunds (5/5m), Exports (10/min), Analytics revenue (30/min)
- [ ] Ensure idempotency for: refunds, bulk messaging, webhook handlers (re‑entrancy)
  - ✅ Refunds via `Idempotency-Key` header respected; returns prior result if exists

### Verification protocol (per endpoint class)
Auth/Tenant
- [ ] Missing auth → 401 `UNAUTHORIZED`
- [ ] Missing tenant (no cookie/header) → 401 with hint detail
- [ ] With `x-tenant-id` header → success path

Read endpoints
- [ ] Success: `success=true`, `data` present, `meta.timestamp`
- [ ] Empty result: `success=true`, `data=[]`, no errors
- [ ] Invalid filters: 400 `INVALID_INPUT` (zod details)

Mutation endpoints
- [ ] Invalid input → 400 `INVALID_INPUT` (which field, why)
- [ ] Conflict (e.g., booking overlap) → 409 `CONFLICT`
- [ ] Rate limit exceeded → 429 `RATE_LIMITED`
- [ ] Idempotent retry returns same result / no double side‑effects

Realtime
- [ ] Mutations trigger appropriate cache invalidations (bookings, jobs, invoices, payments, messages)
- [ ] Multi‑user reflects updates within 5s

### Acceptance criteria
- All routes return System Bible envelope
- Auth/tenant failures never return 400/500; they return specific 401/403/404
- All input validated via Zod with clear field‑level messages
- Pagination documented and implemented on heavy lists
- Rate limiting present on sensitive endpoints
- Idempotency implemented where needed; safe for retries
- Realtime invalidations configured for all tenant tables

### Action log (high‑signal)
- [x] Added tenant fallback (x-tenant-id / df-tenant) to: `/api/tenant/me`, `/api/analytics/kpis`, `/api/jobs`, `/api/bookings`, `/api/activities/recent`
- [x] Updated frontend to send `x-tenant-id` from dashboard/jobs/invoices when df-tenant present
- [x] Standardized success response in `POST /api/messages/send`
- [ ] Migrate `NextResponse.json` in `analytics/revenue` and `admin/availability/work-patterns` to helpers
  - ✅ Done in both; added rate limiting to revenue
  - ✅ Converted `admin/services` and `quotes` to helpers
  - ✅ Added pagination to bookings, invoices, customers endpoints
  - ✅ Added pagination to payments list and rate limiting to payments export
  - ✅ Added rate limiting to export endpoints; added idempotency to refunds
- [ ] Add pagination to invoices/bookings/customers lists (BE+FE)
- [ ] Normalize error codes across analytics and guest endpoints

---

### How to use this tracker
- Use checkboxes to record compliance
- Link PRs to action log entries
- Keep risk section updated; prioritize items harming UX or causing auth flakiness


