/**
 * Security configuration for production environment
 */

export interface SecurityConfig {
  enableCSP: boolean;
  enableHSTS: boolean;
  enableXSSProtection: boolean;
  enableContentTypeOptions: boolean;
  enableFrameOptions: boolean;
  allowedOrigins: string[];
  maxFileSize: number;
  allowedFileTypes: string[];
}

export const securityConfig: SecurityConfig = {
  enableCSP: true,
  enableHSTS: true,
  enableXSSProtection: true,
  enableContentTypeOptions: true,
  enableFrameOptions: true,
  allowedOrigins: [
    'https://yourdomain.com',
    'https://www.yourdomain.com',
    // Add your production domains here
  ],
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ],
};

/**
 * Content Security Policy configuration
 */
export const cspConfig = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Required for Vite in development
    'https://cdn.jsdelivr.net',
    'https://unpkg.com',
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for Tailwind CSS
    'https://fonts.googleapis.com',
  ],
  'font-src': [
    "'self'",
    'https://fonts.gstatic.com',
  ],
  'img-src': [
    "'self'",
    'data:',
    'https://*.supabase.co',
    'https://*.supabase.in',
  ],
  'connect-src': [
    "'self'",
    'https://*.supabase.co',
    'https://*.supabase.in',
    'wss://*.supabase.co',
    'wss://*.supabase.in',
  ],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
};

/**
 * Security headers for production
 */
export const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

/**
 * Validate file upload security
 */
export function validateFileUpload(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > securityConfig.maxFileSize) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${securityConfig.maxFileSize / (1024 * 1024)}MB`,
    };
  }

  // Check file type
  if (!securityConfig.allowedFileTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed`,
    };
  }

  return { valid: true };
}

/**
 * Sanitize user input for display
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validate Supabase URL format
 */
export function validateSupabaseUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'https:' && urlObj.hostname.includes('supabase');
  } catch {
    return false;
  }
}

/**
 * Validate Supabase anon key format
 */
export function validateSupabaseAnonKey(key: string): boolean {
  try {
    // Supabase anon keys are JWT tokens
    const parts = key.split('.');
    return parts.length === 3 && parts.every(part => part.length > 0);
  } catch {
    return false;
  }
}


