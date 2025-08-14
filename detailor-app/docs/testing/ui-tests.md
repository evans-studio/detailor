## UI Testing Overview

This document summarizes the UI test strategy and the new tests added. The focus is on stable selectors, outcome-driven assertions, and maintainability as the UI evolves.

### Strategy

- **Stable selectors**: Added `data-testid` attributes to frequently tested components and key UI elements.
- **Robust queries**: Prefer roles, labels, and test IDs over brittle text queries.
- **Outcome-focused**: Assert the presence of values or behaviors (e.g., “a KPI value is shown”) rather than exact strings.
- **Navigation mocking**: Mock `usePathname` in tests that render `DashboardShell` to avoid null pathname issues.

### Pages updated with test IDs

- `admin/settings/services` (`src/app/admin/settings/services/page.tsx`)
  - `add-service-button`, `service-form`, `service-name-input`, `service-description-textarea`, `service-duration-input`, `service-price-input`, `create-service-button`
  - `services-list`, per-card `service-card-<id>`
  - Within each card: `service-name`, `service-description`, `service-price`

- `admin/dashboard` (`src/app/admin/dashboard/page.tsx`)
  - KPI row container: `kpi-row`
  - KPI cards: `kpi-bookings-today`, `kpi-revenue-mtd`, `kpi-total-customers`, `kpi-active-jobs`
  - KPI values use `*-value` suffix (e.g., `kpi-bookings-today-value`)
  - Sections: `upcoming-bookings`, `recent-activity`, `live-jobs`

- `admin/bookings` (`src/app/admin/bookings/page.tsx`)
  - Per booking card: `booking-card-<id>`
  - Within each card: `booking-service`, `booking-customer`, `booking-vehicle`, `booking-address`, `booking-total`

 - `admin/customers` (`src/app/admin/customers/page.tsx`)
  - Per customer card: `customer-card-<id>`
  - Within each card: `customer-name`, `customer-email`, `customer-phone`, `customer-total-bookings`, `customer-total-spent`

### New/updated tests

- `src/__tests__/ui/settings/services.page.test.tsx`
  - Renders services list
  - Create flow via `add-service-button` and `service-form`

- `src/__tests__/ui/dashboard/admin.dashboard.page.test.tsx`
  - Renders KPI cards and key sections
  - Outcome-based assertion: KPI value is numeric (stable as API data changes)

- `src/__tests__/ui/bookings/bookings.page.test.tsx`
  - Renders booking list with key info
  - Outcome-based assertions using `booking-service` and `booking-customer`

- `src/__tests__/ui/customers/customers.page.test.tsx`
  - Renders customer grid/cards with key info
  - Outcome-based assertions using `customer-*` test IDs

### Mocking guidelines

- For tests that render `DashboardShell`, mock `usePathname` from `next/navigation` to a route under test (e.g., `/admin/bookings`).
- Use `fetch` mocks per test to simulate API responses. Prefer concise success payloads aligned with API response shape.

### How to run

```bash
npm test
```

### Future coverage (recommended next)

- Add test IDs and tests for: `admin/customers`, `admin/quotes`, `admin/messages`, `admin/settings/*` (working hours, payment, branding, team), jobs/staff views, analytics.
- Introduce MSW for centralized API mocks and scenario coverage (loading, empty, error states).
- Centralize `usePathname` mocking in a shared test setup file.
- Basic a11y checks for critical pages (roles, names, labels).
- CI gates: run tests on PRs and enforce minimum coverage thresholds.


