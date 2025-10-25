// SECURITY: Input validation utilities for edge functions

/**
 * Validates and sanitizes string inputs
 */
export const validateString = (
  value: unknown,
  fieldName: string,
  options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
  } = {}
): string => {
  const { required = true, minLength, maxLength, pattern } = options;

  // Check if value exists
  if (value === null || value === undefined || value === '') {
    if (required) {
      throw new Error(`${fieldName} is required`);
    }
    return '';
  }

  // Check type
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }

  // Trim whitespace
  const trimmed = value.trim();

  // Check length
  if (minLength && trimmed.length < minLength) {
    throw new Error(`${fieldName} must be at least ${minLength} characters`);
  }
  if (maxLength && trimmed.length > maxLength) {
    throw new Error(`${fieldName} must be at most ${maxLength} characters`);
  }

  // Check pattern
  if (pattern && !pattern.test(trimmed)) {
    throw new Error(`${fieldName} has invalid format`);
  }

  return trimmed;
};

/**
 * Validates UUID format
 */
export const validateUUID = (value: unknown, fieldName: string): string => {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return validateString(value, fieldName, { pattern: uuidPattern });
};

/**
 * Validates email format
 */
export const validateEmail = (value: unknown): string => {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return validateString(value, 'email', { pattern: emailPattern, maxLength: 255 });
};

/**
 * Validates integer within range
 */
export const validateInteger = (
  value: unknown,
  fieldName: string,
  options: {
    required?: boolean;
    min?: number;
    max?: number;
  } = {}
): number => {
  const { required = true, min, max } = options;

  if (value === null || value === undefined) {
    if (required) {
      throw new Error(`${fieldName} is required`);
    }
    return 0;
  }

  const num = typeof value === 'string' ? parseInt(value, 10) : Number(value);

  if (isNaN(num) || !Number.isInteger(num)) {
    throw new Error(`${fieldName} must be a valid integer`);
  }

  if (min !== undefined && num < min) {
    throw new Error(`${fieldName} must be at least ${min}`);
  }
  if (max !== undefined && num > max) {
    throw new Error(`${fieldName} must be at most ${max}`);
  }

  return num;
};

/**
 * Validates enum value
 */
export const validateEnum = <T extends string>(
  value: unknown,
  fieldName: string,
  allowedValues: readonly T[]
): T => {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }
  if (!allowedValues.includes(value as T)) {
    throw new Error(
      `${fieldName} must be one of: ${allowedValues.join(', ')}`
    );
  }
  return value as T;
};

/**
 * Sanitizes HTML to prevent XSS attacks
 */
export const sanitizeHTML = (html: string): string => {
  // Remove all script tags and their content
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]*/gi, '');
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  return sanitized;
};

/**
 * Rate limiting helper
 */
export const checkRateLimit = async (
  supabase: any,
  userId: string,
  action: string,
  maxAttempts: number,
  windowMinutes: number
): Promise<boolean> => {
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);
  
  const { count, error } = await supabase
    .from('rate_limits')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('action', action)
    .gte('created_at', windowStart.toISOString());

  if (error) {
    console.error('Rate limit check error:', error);
    return true; // Allow on error to not block users
  }

  return (count || 0) < maxAttempts;
};
