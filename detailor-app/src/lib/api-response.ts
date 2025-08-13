import { NextResponse } from 'next/server';

// Standard API response interface matching System Bible
interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    page?: number;
    total?: number;
    warning?: string;
    info?: string;
    [key: string]: any;
  };
}

/**
 * Creates a successful API response following the System Bible format
 */
export function createSuccessResponse<T>(
  data: T,
  meta?: Partial<APIResponse['meta']>
): NextResponse {
  const response: APIResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };

  return NextResponse.json(response);
}

/**
 * Creates an error API response following the System Bible format
 */
export function createErrorResponse(
  code: string,
  message: string,
  details?: any,
  status: number = 400,
  meta?: Partial<APIResponse['meta']>
): NextResponse {
  const response: APIResponse = {
    success: false,
    error: {
      code,
      message,
      details,
    },
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };

  return NextResponse.json(response, { status });
}

/**
 * Creates a paginated success response
 */
export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  total: number,
  meta?: Partial<APIResponse['meta']>
): NextResponse {
  const response: APIResponse<T[]> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      page,
      total,
      ...meta,
    },
  };

  return NextResponse.json(response);
}

// Common error codes for consistency
export const API_ERROR_CODES = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  ADMIN_ONLY: 'ADMIN_ONLY',
  INVALID_TOKEN: 'INVALID_TOKEN',
  
  // Data Validation
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  
  // Database
  DATABASE_ERROR: 'DATABASE_ERROR',
  RECORD_NOT_FOUND: 'RECORD_NOT_FOUND',
  CONSTRAINT_VIOLATION: 'CONSTRAINT_VIOLATION',
  TABLE_MISSING: 'TABLE_MISSING',
  
  // Business Logic
  LIMIT_EXCEEDED: 'LIMIT_EXCEEDED',
  FEATURE_NOT_AVAILABLE: 'FEATURE_NOT_AVAILABLE',
  OPERATION_NOT_ALLOWED: 'OPERATION_NOT_ALLOWED',
  
  // External Services
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  PAYMENT_ERROR: 'PAYMENT_ERROR',
  EMAIL_ERROR: 'EMAIL_ERROR',
  
  // General
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
  RATE_LIMITED: 'RATE_LIMITED',
} as const;

export type APIErrorCode = typeof API_ERROR_CODES[keyof typeof API_ERROR_CODES];