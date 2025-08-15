# COMPREHENSIVE DASHBOARD COMPONENT LIBRARY SPECIFICATION

## CRITICAL: Complete Component Library with Branding System

### THE PROBLEM
Your agent is getting lost in individual file updates instead of creating a systematic, reusable component library that automatically handles branding. Let's give them a clear, structured approach.

## COMPLETE COMPONENT LIBRARY STRUCTURE

### FOUNDATION LAYER

#### 1. THEME PROVIDER SETUP
Location: `src/components/theme/ThemeProvider.tsx`

This component must wrap the entire app at root layout level. It should fetch tenant branding once on mount, generate all color shades from the primary brand color, inject CSS variables into document root, provide theme context to all children, and handle theme updates without page refresh.

#### 2. CSS VARIABLES SYSTEM
Location: `src/styles/theme-variables.css`

Define comprehensive CSS variables for every color need: primary with shades 50-900, secondary with shades, accent colors, semantic colors for success/warning/error/info, surface colors for backgrounds and cards, text colors for primary/secondary/muted/inverse, border colors for default/light/dark, shadow colors for elevation, and focus/hover/active state colors.

#### 3. SHADE GENERATOR UTILITY
Location: `src/lib/theme/shade-generator.ts`

Create functions that take a hex color and generate 9 shades from lightest to darkest, ensure proper contrast ratios for text on backgrounds, handle both light and dark mode variants, validate WCAG AA compliance, and provide fallbacks for edge cases.

### CORE DASHBOARD COMPONENTS

#### 1. STAT CARD COMPONENT
Location: `src/components/dashboard/StatCard.tsx`

Props: title, value, change, changeType, icon, loading
Features: Uses CSS variables for all colors, shows skeleton while loading, handles empty/error states, supports trending indicators, and is fully accessible.

#### 2. CHART CARD COMPONENT
Location: `src/components/dashboard/ChartCard.tsx`

Props: title, data, chartType, height, loading
Features: Themed chart colors from CSS variables, supports line/bar/pie charts, responsive sizing, loading skeleton, and empty state handling.

#### 3. DATA TABLE COMPONENT
Location: `src/components/dashboard/DataTable.tsx`

Props: columns, data, onRowClick, loading, emptyMessage
Features: Themed header using primary color, striped rows with surface variants, hover states with brand color, pagination controls, and sort indicators.

#### 4. ACTION CARD COMPONENT
Location: `src/components/dashboard/ActionCard.tsx`

Props: title, description, actions, status, icon
Features: Status badge with semantic colors, action buttons with brand colors, hover/focus states, loading states for actions, and responsive layout.

#### 5. TIMELINE COMPONENT
Location: `src/components/dashboard/Timeline.tsx`

Props: events, orientation, showConnector
Features: Brand-colored connectors, status indicators, time stamps, expandable details, and mobile-responsive.

#### 6. METRIC GRID COMPONENT
Location: `src/components/dashboard/MetricGrid.tsx`

Props: metrics, columns, loading
Features: Responsive grid layout, consistent spacing, loading skeletons, empty states, and drill-down support.

### SPECIALIZED DASHBOARD WIDGETS

#### 1. BOOKING CALENDAR WIDGET
Location: `src/components/dashboard/BookingCalendar.tsx`

Features: Month/week/day views, brand-colored events, status indicators, click to view details, real-time updates.

Accessibility:
- Keyboard support: Space to pick up/cancel event, Arrow keys to move by day, Enter/Space on a day cell to drop.
- Screen reader: live announcements on move/drop and on month changes; `aria-grabbed` on events; instructions provided via visually hidden text.

#### 2. REVENUE CHART WIDGET
Location: `src/components/dashboard/RevenueChart.tsx`

Features: Period selector, comparison mode, trend analysis, export functionality, and themed visualization.

#### 3. ACTIVITY FEED WIDGET
Location: `src/components/dashboard/ActivityFeed.tsx`

Features: Real-time updates, user avatars, action descriptions, timestamps, and filterable by type.

#### 4. QUICK ACTIONS WIDGET
Location: `src/components/dashboard/QuickActions.tsx`

Features: Common action shortcuts, keyboard accessible, customizable per role, usage analytics, and branded buttons.

### COMPOSITE LAYOUTS

#### 1. DASHBOARD GRID LAYOUT
Location: `src/components/layouts/DashboardGrid.tsx`

Props: children, columns, gap, responsive
Features: Responsive breakpoints, consistent spacing, drag-and-drop support, save layout preferences.

#### 2. METRICS HEADER LAYOUT
Location: `src/components/layouts/MetricsHeader.tsx`

Props: title, subtitle, metrics, actions
Features: Page title section, KPI cards row, action buttons, and filters/date range.

#### 3. SPLIT VIEW LAYOUT
Location: `src/components/layouts/SplitView.tsx`

Props: sidebar, main, sidebarWidth
Features: Resizable panels, collapse sidebar, mobile drawer, and persistent state.

### IMPLEMENTATION GUIDE FOR AGENT

#### PHASE 1: FOUNDATION (4 hours)
Create ThemeProvider with complete color system. Build shade generator with contrast validation. Set up CSS variables file with all tokens. Test with multiple brand colors.

#### PHASE 2: CORE COMPONENTS (6 hours)
Build StatCard with full theming. Create DataTable with branded headers. Implement ChartCard with dynamic colors. Add ActionCard with status variants. Include loading and empty states for all.

#### PHASE 3: SPECIALIZED WIDGETS (4 hours)
Build BookingCalendar with brand colors. Create RevenueChart with themed data. Implement ActivityFeed with real-time updates. Add QuickActions with role awareness.

#### PHASE 4: LAYOUTS (2 hours)
Create DashboardGrid with responsive behavior. Build MetricsHeader for consistent pages. Implement SplitView for complex layouts. Test all layouts with different content.

#### PHASE 5: INTEGRATION (2 hours)
Replace existing dashboard components. Update all pages to use new library. Remove all hardcoded colors. Verify theming works everywhere.

### USAGE EXAMPLES FOR EACH COMPONENT

#### STAT CARD USAGE
Used for KPIs on dashboard, summary metrics on detail pages, real-time counters, and comparison metrics.

#### DATA TABLE USAGE
Customer lists, booking lists, service catalogs, payment history, and any tabular data.

#### CHART CARD USAGE
Revenue trends, booking analytics, performance metrics, and comparison charts.

#### ACTION CARD USAGE
Pending actions, task cards, approval requests, and status updates.

### TESTING REQUIREMENTS

Each component needs tests for: renders with default props, applies theme colors correctly, handles loading state, shows empty state, responds to interactions, maintains accessibility, works in dark mode, and updates with theme changes.

### MIGRATION STRATEGY

Start with new pages using library. Gradually replace existing components. Maintain backward compatibility initially. Remove old components once migrated. Document breaking changes.

### CRITICAL SUCCESS FACTORS

No hardcoded colors anywhere in components. All components use CSS variables exclusively. Theme changes apply instantly without refresh. Components work with any brand color. Maintain WCAG AA compliance always. Performance remains fast with theming. Components are fully typed with TypeScript. Storybook documentation for all.



## THE OUTCOME:

With this library, changing a tenant's brand color will instantly update every dashboard, every chart, every table, and every component across the entire platform. True white-label achieved!


## MIGRATION CHECKLIST (Live)

- Replace page KPIs with `StatCard`
  - [x] Admin Dashboard
  - [ ] Analytics summary tiles (if any)
- Replace charts with `ChartCard`/`RevenueChart`
  - [x] Admin Dashboard (Revenue)
  - [x] Analytics (Revenue, Services, CLV)
  - [ ] Other analytics segments (as added)
- Replace calendars with `BookingCalendar`
  - [x] Admin Dashboard overview calendar
  - [ ] Dedicated calendar views (if separate)
- Replace tables with `DataTable`
  - [x] Invoices
  - [x] Bookings list views
  - [ ] Customers (where a table is used; grid remains grid)
- Tokenize remaining pages
  - [x] Auth Sign-in page
  - [x] Website/Homepage admin
  - [x] Messages subpages (bulk/history/schedules/templates/triggers)
  - [x] Inventory, Reviews


## USAGE EXAMPLES

### StatCard

```tsx
<StatCard title="Monthly Revenue" value="£12,345" change={"+8%"} changeType="increase" />
```

### ChartCard (Line/Bar/Pie)

```tsx
<ChartCard
  title="Revenue"
  type="line"
  categories={["Mon","Tue","Wed"]}
  series={[{ name: 'Revenue', data: [120, 180, 200] }]}
  height={260}
/>
```

### RevenueChart (with period + comparison)

```tsx
<RevenueChart
  data={[{ date: '2025-01-01', revenue: 1000, revenue_prev: 900 }]}
  period="30d"
  onPeriodChange={(p) => setPeriod(p)}
  comparison
/>
```

### BookingCalendar

```tsx
<BookingCalendar
  events={[{ id: 'e1', title: 'Wash', start: new Date(), end: new Date(Date.now()+3600000), status: 'confirmed' }]}
  onEventDrop={(id, start, end) => {/* persist */}}
  onEventClick={(id) => {/* open detail */}}
/>
```

### DataTable

```tsx
<DataTable
  columns=[
    { key: 'number', header: 'Number' },
    { key: 'total', header: 'Total', render: (row) => `£${row.total.toFixed(2)}` }
  ]
  data={invoices}
/>
```


## RISK GUARDRAILS IMPLEMENTED

- Chart performance: `ChartCard` memoized with deep comparison of `series` and `categories`.
- Theming performance: CSS variable updates are diffed to avoid unnecessary reflows.
- Dark mode: shade generation is mode-aware; foreground colors adjusted for AA contrast.


## NEXT STEPS

- Migrate customers list table variants to `DataTable` where appropriate (grid remains grid).
- Theming hardening: minimize SSR FOUC (inline base tokens in `head`, cache per-tenant palette); ensure neutrals map `muted-foreground` to `--color-text-muted`.
  - SSR FOUC minimized: base tokens inlined in `app/layout.tsx`; per-tenant palette caching added (sessionStorage + in-memory) in `use-tenant-brand` with `brand-updated` cache busting.
- Add tests for month-change SR announcement and focus return after drop. [Done]
- Expand chart tests for bar/pie multi-series and legend a11y.