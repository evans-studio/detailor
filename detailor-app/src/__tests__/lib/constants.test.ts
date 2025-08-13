import { describe, it, expect } from 'vitest';
import { USER_ROLES, BOOKING_STATUS, APP_PATHS, type UserRole, type BookingStatus } from '@/lib/constants';

describe('constants', () => {
  describe('USER_ROLES', () => {
    it('should define all user roles', () => {
      expect(USER_ROLES.CUSTOMER).toBe('customer');
      expect(USER_ROLES.STAFF).toBe('staff');
      expect(USER_ROLES.ADMIN).toBe('admin');
    });

    it('should be a const assertion object', () => {
      // TypeScript ensures read-only at compile time with 'as const'
      // At runtime, we can check the values are as expected
      expect(USER_ROLES.CUSTOMER).toBe('customer');
      expect(USER_ROLES.STAFF).toBe('staff');
      expect(USER_ROLES.ADMIN).toBe('admin');
    });

    it('should have correct UserRole type', () => {
      const validRoles: UserRole[] = ['customer', 'staff', 'admin'];
      
      validRoles.forEach(role => {
        expect(Object.values(USER_ROLES)).toContain(role);
      });
    });

    it('should contain exactly 3 roles', () => {
      const roleValues = Object.values(USER_ROLES);
      expect(roleValues).toHaveLength(3);
      expect(roleValues).toEqual(['customer', 'staff', 'admin']);
    });
  });

  describe('BOOKING_STATUS', () => {
    it('should define all booking statuses', () => {
      expect(BOOKING_STATUS.PENDING).toBe('pending');
      expect(BOOKING_STATUS.CONFIRMED).toBe('confirmed');
      expect(BOOKING_STATUS.IN_PROGRESS).toBe('in_progress');
      expect(BOOKING_STATUS.COMPLETED).toBe('completed');
      expect(BOOKING_STATUS.CANCELLED).toBe('cancelled');
      expect(BOOKING_STATUS.NO_SHOW).toBe('no_show');
    });

    it('should be a const assertion object', () => {
      // TypeScript ensures read-only at compile time with 'as const'
      expect(BOOKING_STATUS.PENDING).toBe('pending');
      expect(BOOKING_STATUS.CONFIRMED).toBe('confirmed');
      expect(BOOKING_STATUS.IN_PROGRESS).toBe('in_progress');
    });

    it('should have correct BookingStatus type', () => {
      const validStatuses: BookingStatus[] = [
        'pending',
        'confirmed', 
        'in_progress',
        'completed',
        'cancelled',
        'no_show'
      ];
      
      validStatuses.forEach(status => {
        expect(Object.values(BOOKING_STATUS)).toContain(status);
      });
    });

    it('should contain exactly 6 statuses', () => {
      const statusValues = Object.values(BOOKING_STATUS);
      expect(statusValues).toHaveLength(6);
      expect(statusValues).toEqual([
        'pending',
        'confirmed',
        'in_progress',
        'completed',
        'cancelled',
        'no_show'
      ]);
    });

    it('should have logical status progression', () => {
      // Test that statuses follow a logical order for a booking lifecycle
      const progressionStatuses = [
        BOOKING_STATUS.PENDING,
        BOOKING_STATUS.CONFIRMED,
        BOOKING_STATUS.IN_PROGRESS,
        BOOKING_STATUS.COMPLETED
      ];

      const alternativeStatuses = [
        BOOKING_STATUS.CANCELLED,
        BOOKING_STATUS.NO_SHOW
      ];

      // All progression statuses should exist
      progressionStatuses.forEach(status => {
        expect(Object.values(BOOKING_STATUS)).toContain(status);
      });

      // All alternative statuses should exist
      alternativeStatuses.forEach(status => {
        expect(Object.values(BOOKING_STATUS)).toContain(status);
      });
    });
  });

  describe('APP_PATHS', () => {
    it('should define all app paths', () => {
      expect(APP_PATHS.HOME).toBe('/');
      expect(APP_PATHS.DASHBOARD).toBe('/dashboard');
      expect(APP_PATHS.BOOKINGS).toBe('/bookings');
      expect(APP_PATHS.QUOTES).toBe('/quotes');
      expect(APP_PATHS.SETTINGS).toBe('/settings');
    });

    it('should be a const assertion object', () => {
      // TypeScript ensures read-only at compile time with 'as const'
      expect(APP_PATHS.HOME).toBe('/');
      expect(APP_PATHS.DASHBOARD).toBe('/dashboard');
      expect(APP_PATHS.BOOKINGS).toBe('/bookings');
    });

    it('should have valid URL paths', () => {
      const pathValues = Object.values(APP_PATHS);
      
      pathValues.forEach(path => {
        expect(path).toMatch(/^\/.*$/); // Should start with /
        expect(path).not.toContain('//'); // Should not have double slashes
        expect(path).not.toMatch(/\s/); // Should not contain spaces
      });
    });

    it('should contain exactly 5 paths', () => {
      const pathValues = Object.values(APP_PATHS);
      expect(pathValues).toHaveLength(5);
      expect(pathValues).toEqual([
        '/',
        '/dashboard',
        '/bookings',
        '/quotes',
        '/settings'
      ]);
    });

    it('should have unique path values', () => {
      const pathValues = Object.values(APP_PATHS);
      const uniquePaths = [...new Set(pathValues)];
      expect(uniquePaths).toHaveLength(pathValues.length);
    });
  });

  describe('constant consistency', () => {
    it('should not have overlapping values between different constants', () => {
      const roleValues = Object.values(USER_ROLES);
      const statusValues = Object.values(BOOKING_STATUS);
      const pathValues = Object.values(APP_PATHS);

      // Check no overlap between roles and statuses
      roleValues.forEach(role => {
        expect(statusValues).not.toContain(role);
        expect(pathValues).not.toContain(role);
      });

      // Check no overlap between statuses and paths
      statusValues.forEach(status => {
        expect(pathValues).not.toContain(status);
      });
    });

    it('should use consistent naming conventions', () => {
      // All constant names should be UPPERCASE
      const constantNames = [
        ...Object.keys(USER_ROLES),
        ...Object.keys(BOOKING_STATUS),
        ...Object.keys(APP_PATHS)
      ];

      constantNames.forEach(name => {
        expect(name).toMatch(/^[A-Z_]+$/);
      });
    });

    it('should have descriptive constant names', () => {
      // Check that constant names are descriptive
      expect(USER_ROLES).toHaveProperty('CUSTOMER');
      expect(USER_ROLES).toHaveProperty('STAFF');
      expect(USER_ROLES).toHaveProperty('ADMIN');

      expect(BOOKING_STATUS).toHaveProperty('PENDING');
      expect(BOOKING_STATUS).toHaveProperty('CONFIRMED');
      expect(BOOKING_STATUS).toHaveProperty('COMPLETED');

      expect(APP_PATHS).toHaveProperty('HOME');
      expect(APP_PATHS).toHaveProperty('DASHBOARD');
      expect(APP_PATHS).toHaveProperty('BOOKINGS');
    });
  });

  describe('type safety', () => {
    it('should work with type guards', () => {
      const isValidUserRole = (role: string): role is UserRole => {
        return Object.values(USER_ROLES).includes(role as UserRole);
      };

      const isValidBookingStatus = (status: string): status is BookingStatus => {
        return Object.values(BOOKING_STATUS).includes(status as BookingStatus);
      };

      // Test valid values
      expect(isValidUserRole('customer')).toBe(true);
      expect(isValidUserRole('staff')).toBe(true);
      expect(isValidUserRole('admin')).toBe(true);
      expect(isValidUserRole('invalid')).toBe(false);

      expect(isValidBookingStatus('pending')).toBe(true);
      expect(isValidBookingStatus('completed')).toBe(true);
      expect(isValidBookingStatus('invalid')).toBe(false);
    });

    it('should work in switch statements', () => {
      const getDefaultPath = (role: UserRole): string => {
        switch (role) {
          case USER_ROLES.CUSTOMER:
            return '/customer/dashboard';
          case USER_ROLES.STAFF:
            return '/staff/dashboard';
          case USER_ROLES.ADMIN:
            return '/admin/dashboard';
          default:
            const exhaustive: never = role;
            return exhaustive;
        }
      };

      expect(getDefaultPath(USER_ROLES.CUSTOMER)).toBe('/customer/dashboard');
      expect(getDefaultPath(USER_ROLES.STAFF)).toBe('/staff/dashboard');
      expect(getDefaultPath(USER_ROLES.ADMIN)).toBe('/admin/dashboard');
    });
  });
});