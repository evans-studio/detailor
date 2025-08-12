// Security utilities for input sanitization and validation

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  // Remove script tags and their content
  let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove dangerous HTML attributes (more comprehensive)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, ''); // Remove event handlers
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^"'\s>]+/gi, ''); // Remove unquoted event handlers
  sanitized = sanitized.replace(/javascript:/gi, ''); // Remove javascript: protocols
  sanitized = sanitized.replace(/vbscript:/gi, ''); // Remove vbscript: protocols
  sanitized = sanitized.replace(/data:/gi, ''); // Remove data: protocols (except in specific contexts)
  
  // Remove dangerous tags
  const dangerousTags = ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'];
  dangerousTags.forEach(tag => {
    const regex = new RegExp(`<\\/?${tag}\\b[^>]*>`, 'gi');
    sanitized = sanitized.replace(regex, '');
  });
  
  return sanitized.trim();
}

/**
 * Sanitize text input for safe database storage
 */
export function sanitizeText(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  // Remove null bytes and control characters
  let sanitized = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Normalize whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  
  return sanitized;
}

/**
 * Validate and sanitize email addresses
 */
export function sanitizeEmail(email: string): string | null {
  if (!email || typeof email !== 'string') return null;
  
  // Basic email regex (more permissive than RFC 5322 but secure)
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  const sanitized = sanitizeText(email.toLowerCase());
  
  if (!emailRegex.test(sanitized)) {
    return null;
  }
  
  return sanitized;
}

/**
 * Validate and sanitize phone numbers
 */
export function sanitizePhone(phone: string): string | null {
  if (!phone || typeof phone !== 'string') return null;
  
  // Remove all non-digit characters except + at the beginning
  let sanitized = phone.replace(/[^\d+]/g, '');
  
  // Ensure + is only at the beginning
  if (sanitized.includes('+')) {
    const parts = sanitized.split('+').filter(part => part.length > 0);
    sanitized = (phone.startsWith('+') ? '+' : '') + parts.join('');
  }
  
  // Basic validation - should be between 7 and 15 digits (international standard)
  const digitsOnly = sanitized.replace(/[^0-9]/g, '');
  if (digitsOnly.length < 7 || digitsOnly.length > 15) {
    return null;
  }
  
  return sanitized;
}

/**
 * Validate UUID format
 */
export function isValidUuid(uuid: string): boolean {
  if (!uuid || typeof uuid !== 'string') return false;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Sanitize SQL-like inputs to prevent injection
 */
export function sanitizeSqlInput(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  // Remove common SQL injection patterns
  let sanitized = input.replace(/['";\\]/g, ''); // Remove quotes and backslashes
  sanitized = sanitized.replace(/--/g, ''); // Remove SQL comments
  sanitized = sanitized.replace(/\/\*.*?\*\//g, ''); // Remove multi-line comments
  sanitized = sanitized.replace(/\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b/gi, '');
  
  return sanitizeText(sanitized);
}

/**
 * Rate limiting helper
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(identifier: string, maxRequests: number = 100, windowMs: number = 60000): boolean {
  const now = Date.now();
  const key = identifier;
  
  const current = rateLimitMap.get(key);
  
  if (!current || now > current.resetTime) {
    // Reset or create new entry
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (current.count >= maxRequests) {
    return false; // Rate limit exceeded
  }
  
  current.count++;
  return true;
}

/**
 * Validate file upload security
 */
export function validateFileUpload(filename: string, allowedTypes: string[] = []): { valid: boolean; error?: string } {
  if (!filename || typeof filename !== 'string') {
    return { valid: false, error: 'Invalid filename' };
  }
  
  // Check for dangerous file extensions
  const dangerousExtensions = [
    'exe', 'bat', 'cmd', 'com', 'pif', 'scr', 'vbs', 'js', 'jar', 
    'php', 'asp', 'aspx', 'jsp', 'py', 'pl', 'rb', 'sh'
  ];
  
  const parts = filename.split('.');
  const extension = parts.length > 1 ? parts.pop()?.toLowerCase() : undefined;
  
  if (!extension) {
    return { valid: false, error: 'File must have an extension' };
  }
  
  if (dangerousExtensions.includes(extension)) {
    return { valid: false, error: 'File type not allowed' };
  }
  
  if (allowedTypes.length > 0 && !allowedTypes.includes(extension)) {
    return { valid: false, error: `Only ${allowedTypes.join(', ')} files are allowed` };
  }
  
  // Check for path traversal in filename
  if (filename.includes('../') || filename.includes('..\\')) {
    return { valid: false, error: 'Invalid filename' };
  }
  
  return { valid: true };
}

/**
 * Generate secure random token
 */
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    result += chars[randomIndex];
  }
  
  return result;
}