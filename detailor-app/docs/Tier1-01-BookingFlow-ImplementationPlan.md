# Tier 1 – 01 Booking Flow (/book/new) — Complete Implementation Plan

## Scope & Goals
- Replace all mock/hardcoded data with live Supabase-backed data (tenant-scoped, RLS-compliant).
- Complete each step (Service → Vehicle → Schedule → Details → Payment) with robust loading, validation, error recovery, persistence, mobile, and a11y.
- Ensure end-to-end guest and authenticated flows including payment, booking creation, admin visibility, and confirmation.
- Deliver test coverage across 10 defined scenarios (incl. mobile and slow network).

Success = A non-technical user can book on mobile end-to-end using real data, errors recover gracefully, payment succeeds or offers clear recovery, and booking appears in admin.

---

## PHASE 1: Data Foundation (Backend)

### 1. Verify Supabase Tables & Policies
- [ ] `services`: structure, tenant_id index, visibility, price fields
- [ ] `add_ons`: structure, tenant_id, name, price, category, description
- [ ] `service_addons`: service_id, addon_id, tenant-scoped, unique index
- [ ] `pricing_rules` (or equivalent): multipliers, VAT, travel policy
- [ ] `work_patterns` & `blackouts`: correctness and sample data
- [ ] RLS: all reads/writes tenant-scoped; roles honored

### 2. Seed Missing Data (Tenant-Scoped)
```sql
-- Example tenant variable
-- SELECT id INTO tenant_id FROM public.tenants WHERE slug = 'demo';

-- Add-ons (id auto)
INSERT INTO public.add_ons (tenant_id, name, description, price_delta, duration_delta_min, compatibility)
VALUES
  (:tenant_id, 'Interior Protection', 'Fabric/leather protection', 25, 0, '{}'),
  (:tenant_id, 'Premium Wax', 'Long-lasting paint protection', 35, 0, '{}'),
  (:tenant_id, 'Carpet Shampoo', 'Deep upholstery clean', 20, 30, '{}'),
  (:tenant_id, 'Headlight Restoration', 'Restore clarity', 30, 30, '{}'),
  (:tenant_id, 'Engine Bay Clean', 'Degrease and protect', 25, 20, '{}'),
  (:tenant_id, 'Clay Bar Treatment', 'Contaminant removal', 40, 30, '{}');

-- Service ↔ Add-on mapping (example)
-- INSERT INTO public.service_addons (service_id, addon_id, sort_order) VALUES (...);
```
- [ ] Map add-ons to actual services via `service_addons`.
- [ ] VAT config in pricing rules (e.g., 20%).
- [ ] Travel surcharge policy if applicable.

### 3. Indexes & Performance
- [ ] Indexes on `tenant_id`, `service_id`, `addon_id`, `start_at` (bookings), and availability tables.
- [ ] Materialized view or function for availability computation if needed.

---

## PHASE 2: Frontend Steps (Fix Everything)

### Step 1: Service Selection
- [ ] Load real services: GET `/api/services?tenant_id=X`
- [ ] Load real add-ons: GET `/api/add-ons?service_id=...` (joins through `service_addons`)
- [ ] Show DB prices (service base, add-on deltas)
- [ ] Real-time totals with VAT using POST `/api/quotes`
- [ ] Loading skeletons, empty states (no services configured)
- [ ] Persist selections to state + localStorage
- [ ] Mobile: cards with ≥44px tap targets
- [ ] A11y: labels, focus rings, keyboard selection

### Step 2: Vehicle Info
- [ ] Authenticated: dropdown of saved vehicles; “Add new” inline
- [ ] Guest: full vehicle form (make/model/year/size) with validation
- [ ] Optional registration lookup integration (feature-flag)
- [ ] Size tier detection for pricing multipliers
- [ ] Persist to localStorage
- [ ] Mobile-optimized forms and inputs
- [ ] A11y: field labels, inline error announcements

### Step 3: Schedule Selection
- [ ] Load availability from `work_patterns` + blackout + conflicts: GET `/api/availability?date=...&service_id=...`
- [ ] Disable unavailable slots; show duration
- [ ] Timezone handling; travel time policy (if enabled)
- [ ] Calendar vs list mode (responsive)
- [ ] Real-time conflict prevention (polling or realtime invalidation)
- [ ] A11y: SR announcements when changing day/month; arrow-key navigation

### Step 4: Customer Details
- [ ] Authenticated: prefill from profile; editable
- [ ] Guest: full form with validation; email confirm field; phone formatting
- [ ] Marketing consent + GDPR notice
- [ ] Address autocomplete (feature-flag)
- [ ] Save guest details for later account creation
- [ ] A11y: inline errors with SR announcements

### Step 5: Payment
- [ ] Real pricing breakdown (base, add-ons, size multiplier, travel, VAT)
- [ ] Payment options: full, deposit, pay-on-completion (config-driven)
- [ ] Stripe checkout session creation with robust error handling; store intent id for recovery
- [ ] Accepted card types + trust signals; SR-only explanation
- [ ] On success: redirect to confirmation; on failure: retry path

---

## PHASE 3: Cross-Cutting Concerns

### State Management
- [x] Persist step + fields in localStorage; restore on refresh (baseline added)
- [ ] Clear state only after confirmed booking creation
- [x] Warn on navigation away mid-flow (baseline added)
- [ ] Handle browser back/forward with step sync

### Error Handling
- [ ] Network failure: retry with details; backoff
- [ ] Validation errors: inline, per field
- [ ] Payment failures: clear next steps and retry
- [ ] Availability conflicts: suggest nearest alternatives
- [ ] Session timeout: save + allow resume
- [ ] Rate limiting: show queue/retry copy

### Guest vs Auth
- [ ] Guest: create customer, vehicle, address before booking
- [ ] Auth: link to existing records
- [ ] Post-booking: offer account creation to guests
- [ ] Session upgrade: don’t lose state on login

### Mobile Optimization
- [ ] Step indicator usable on small viewports
- [ ] Touch-optimized controls; bottom-sheet summary for small screens
- [ ] Date/time pickers are mobile-friendly

### Accessibility
- [x] Focus management on step change (baseline added)
- [ ] SR announcements for step transitions and errors
- [ ] Keyboard-only completion validated
- [ ] High-contrast support via CSS variables

---

## PHASE 4: API & Integration Plan

### API Endpoints (App Router)
- [ ] `GET /api/services?tenant_id` → list services (tenant-scoped)
- [ ] `GET /api/add-ons?service_id` → list add-ons for a service via join
- [ ] `GET /api/availability?date&service_id` → computed slots
- [ ] `POST /api/quotes` → price calc (service + addons + size + travel + VAT)
- [ ] `POST /api/bookings` → create booking (customer/vehicle/address ids or guest flow)
- [x] `POST /api/payments/checkout-booking` → Stripe session
- [x] `GET /api/payments/verify-session` → verify status

### Supabase Queries
- [ ] Availability computation function (respect work patterns, blackouts, conflicts)
- [ ] Conflict detection (overlaps on resources)
- [ ] Guest creation flows (customer, vehicle, address) and linkage
- [ ] Booking creation (tenant-scoped), invoice creation post-payment

---

## PHASE 5: Testing & Verification

### Scenarios
1. [ ] Guest completes booking end-to-end (mobile + desktop)
2. [ ] Refresh at each step persists data and step position
3. [ ] Network fails during payment → recovery path works
4. [ ] Double-booking prevented in real time
5. [ ] Mobile user completes on 375px viewport
6. [ ] Accessibility: keyboard-only completion across steps
7. [ ] Large datasets: 50+ services, 100+ add-ons render and perform
8. [ ] Slow network (3G) simulation: UX remains usable
9. [ ] Payment decline recovery with clear guidance
10. [ ] Browser back/forward navigation maintains consistency

### Artifacts to Produce
- [ ] List of Supabase seeds/changes
- [ ] API endpoints created/modified summary
- [ ] Test results with links to CI
- [ ] Screenshots mobile/desktop
- [ ] Accessibility audit (axe) results

---

## Task Tracker (Atomic Tasks)

### Backend
- [ ] Create/verify `GET /api/services` endpoint (tenant-scoped)
- [ ] Create `GET /api/add-ons` endpoint (joins `service_addons`)
- [ ] Create `GET /api/availability` endpoint (date range support)
- [ ] Create `POST /api/quotes` endpoint (VAT, travel, multipliers)
- [ ] Create/verify `POST /api/bookings` endpoint (guest+auth)
- [ ] Seed add-ons and service mappings; ensure RLS; add indexes

### Frontend (src/app/book/new/page.tsx and related)
- [ ] Service step: integrate services/add-ons APIs; totals with VAT
- [ ] Vehicle step: auth vehicles dropdown + add new; guest form validation
- [ ] Schedule step: availability feed; conflict/error handling; mobile calendar/list toggle
- [ ] Details step: prefill; validation; marketing consent; GDPR
- [ ] Payment step: pricing breakdown; options; Stripe error handling; trust UI
- [ ] State: finalize clear-after-success; handle back/forward
- [ ] A11y: SR announcements; error aria-live regions
- [ ] Mobile layout: step indicator, bottom sheet summary

### Admin/Confirmation
- [ ] Confirmation page: ensure booking creation paths (guest/auth) finalized; clear localStorage
- [ ] Admin bookings page: verify new bookings visibility; reschedule/cancel toasts

---

## Acceptance Criteria (Go/No-Go)
- Uses real Supabase data (no mock data anywhere)
- Works on mobile (≥375px) and desktop
- Handles all error cases with recovery paths
- Successful payments and admin visibility of bookings
- Confirmation to user and optional emails (follow-up)
- State persists through refresh and navigation
- Keyboard-accessible end-to-end

---

## Notes & Rollout
- Use a feature flag to keep legacy fallback until new flow proven.
- Ship in increments: services/add-ons → schedule → payment → polish.
- Maintain migration/backout plan.
