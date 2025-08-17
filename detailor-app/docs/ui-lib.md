## UI Library and Theming

### Branding and Tokens
- Global CSS variables are injected by `src/lib/BrandProvider.tsx` (mounted in `src/app/layout.tsx`).
- Do not use Tailwind fixed color utilities; use semantic variables like `bg-[var(--color-primary)]`, `text-[var(--color-text-muted)]`.
- Shade generation and WCAG contrast handled in `src/lib/color.ts`.

### Components
- StatCard, ChartCard, DataTable, BookingCalendar: consume CSS variables only, support light/dark.
- DashboardShell: uses tokenized colors; no layout shift on sidebar toggle.

### Booking: EnterpriseBookingFlow
Path: `src/components/booking/EnterpriseBookingFlow.tsx`

Props:
- `currentStep: 'services' | 'vehicle' | 'datetime' | 'details' | 'payment' | 'confirmation'`
- `onStepChange(step)`, `services`, `addons`, `bookingData`, `onDataChange(data)`, `businessName`, `brandColor?`
- `onCheckout?(mode: 'full' | 'deposit')`, `onComplete()`

Behavior:
- Service/add-on selection with live pricing via quotes API.
- Persisted state (see `/book/new`), mobile bottom-sheet summary, keyboard/a11y-friendly.
- Payment step supports full or deposit checkout. Deposit preview is computed from tenant prefs (`/api/settings/tenant`), displayed when applicable, and disables the deposit option when not valid.

### Migration Checklist (Live)
- [x] Move `BrandProvider` to root layout
- [x] Replace hardcoded colors across admin pages
- [x] Pre-commit hook to block Tailwind fixed colors
- [x] Booking flow: tokenized, persisted, Stripe checkout (full/deposit)
- [ ] Storybook brand switcher
- [ ] Finalize light/dark shade scales and AA audit
- [ ] E2E tests for booking scenarios


