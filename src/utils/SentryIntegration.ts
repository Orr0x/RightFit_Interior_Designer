/**
 * Sentry Error Tracking Integration
 *
 * This module provides integration between the Logger and Sentry error tracking service.
 *
 * ## Setup Instructions
 *
 * 1. Install Sentry:
 * ```bash
 * npm install @sentry/react
 * ```
 *
 * 2. Initialize in main.tsx:
 * ```typescript
 * import { initializeSentry } from '@/utils/SentryIntegration';
 *
 * // Initialize Sentry in production only
 * if (import.meta.env.PROD) {
 *   initializeSentry({
 *     dsn: import.meta.env.VITE_SENTRY_DSN,
 *     environment: import.meta.env.MODE,
 *   });
 * }
 * ```
 *
 * 3. Add environment variable to .env.production:
 * ```
 * VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
 * ```
 *
 * ## Usage
 *
 * Once initialized, the Logger will automatically send errors to Sentry in production.
 * No code changes needed - it works through the ErrorTracker interface.
 */

import { Logger, ErrorTracker } from './Logger';

interface SentryConfig {
  dsn: string;
  environment?: string;
  release?: string;
  tracesSampleRate?: number;
  beforeSend?: (event: any) => any;
}

/**
 * Sentry Error Tracker implementation
 *
 * This class bridges the Logger with Sentry's error tracking.
 */
class SentryErrorTracker implements ErrorTracker {
  private Sentry: any;

  constructor(sentryInstance: any) {
    this.Sentry = sentryInstance;
  }

  public captureError(entry: {
    timestamp: string;
    level: string;
    message: string;
    context?: Record<string, unknown>;
    error?: Error;
  }): void {
    if (!this.Sentry) {
      console.error('[SentryErrorTracker] Sentry not initialized');
      return;
    }

    // Add context to Sentry scope
    this.Sentry.withScope((scope: any) => {
      // Add custom context
      if (entry.context) {
        Object.entries(entry.context).forEach(([key, value]) => {
          scope.setContext(key, { value });
        });
      }

      // Add level
      scope.setLevel(entry.level);

      // Add timestamp
      scope.setTag('timestamp', entry.timestamp);

      // Capture the error
      if (entry.error) {
        this.Sentry.captureException(entry.error);
      } else {
        this.Sentry.captureMessage(entry.message, entry.level);
      }
    });
  }
}

/**
 * Initialize Sentry error tracking
 *
 * This function should be called once at app startup, before any errors occur.
 * Only call this in production environments.
 *
 * @param config Sentry configuration
 * @returns void
 *
 * @example
 * ```typescript
 * if (import.meta.env.PROD) {
 *   initializeSentry({
 *     dsn: import.meta.env.VITE_SENTRY_DSN,
 *     environment: import.meta.env.MODE,
 *     tracesSampleRate: 0.1, // 10% of transactions
 *   });
 * }
 * ```
 */
export function initializeSentry(config: SentryConfig): void {
  // Dynamic import to avoid bundling Sentry in development
  import('@sentry/react')
    .then((Sentry) => {
      // Initialize Sentry
      Sentry.init({
        dsn: config.dsn,
        environment: config.environment || 'production',
        release: config.release,
        tracesSampleRate: config.tracesSampleRate || 0.1,
        beforeSend: config.beforeSend,

        // Integrations
        integrations: [
          Sentry.browserTracingIntegration(),
          Sentry.replayIntegration({
            maskAllText: false,
            blockAllMedia: false,
          }),
        ],

        // Performance monitoring
        tracesSampleRate: 1.0,

        // Session replay
        replaysSessionSampleRate: 0.1, // 10% of sessions
        replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
      });

      // Connect Logger to Sentry
      const tracker = new SentryErrorTracker(Sentry);
      Logger.initErrorTracking(tracker);

      console.log('✅ Sentry initialized and connected to Logger');
    })
    .catch((error) => {
      console.error('❌ Failed to initialize Sentry:', error);
      console.error('   Make sure @sentry/react is installed: npm install @sentry/react');
    });
}

/**
 * Set user context for Sentry
 *
 * Call this after user login to associate errors with specific users.
 *
 * @param user User information
 *
 * @example
 * ```typescript
 * setSentryUser({
 *   id: user.id,
 *   email: user.email,
 *   username: user.username,
 * });
 * ```
 */
export function setSentryUser(user: { id?: string; email?: string; username?: string }): void {
  import('@sentry/react')
    .then((Sentry) => {
      Sentry.setUser(user);
    })
    .catch(() => {
      // Sentry not installed, ignore
    });
}

/**
 * Clear user context from Sentry
 *
 * Call this after user logout.
 */
export function clearSentryUser(): void {
  import('@sentry/react')
    .then((Sentry) => {
      Sentry.setUser(null);
    })
    .catch(() => {
      // Sentry not installed, ignore
    });
}

/**
 * Add breadcrumb to Sentry
 *
 * Breadcrumbs help understand the sequence of events leading to an error.
 *
 * @param message Breadcrumb message
 * @param category Breadcrumb category (e.g., 'navigation', 'user-action', 'http')
 * @param level Breadcrumb level
 *
 * @example
 * ```typescript
 * addSentryBreadcrumb('User clicked save button', 'user-action', 'info');
 * ```
 */
export function addSentryBreadcrumb(
  message: string,
  category: string = 'default',
  level: 'debug' | 'info' | 'warning' | 'error' = 'info'
): void {
  import('@sentry/react')
    .then((Sentry) => {
      Sentry.addBreadcrumb({
        message,
        category,
        level,
        timestamp: Date.now() / 1000,
      });
    })
    .catch(() => {
      // Sentry not installed, ignore
    });
}
