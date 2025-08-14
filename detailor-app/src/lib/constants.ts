// Centralised constants per System Bible §1.10

export const USER_ROLES = {
  CUSTOMER: 'customer',
  STAFF: 'staff',
  ADMIN: 'admin',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
} as const;

export type BookingStatus = typeof BOOKING_STATUS[keyof typeof BOOKING_STATUS];

export const APP_PATHS = {
  HOME: '/',
  DASHBOARD: '/admin/dashboard',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_BOOKINGS: '/admin/bookings',
  ADMIN_QUOTES: '/admin/quotes',
  ADMIN_SETTINGS: '/admin/settings',
  CUSTOMER_DASHBOARD: '/customer/dashboard',
  CUSTOMER_BOOKINGS: '/bookings/me',
  BOOKINGS: '/bookings',
  QUOTES: '/quotes',
  SETTINGS: '/settings',
} as const;


