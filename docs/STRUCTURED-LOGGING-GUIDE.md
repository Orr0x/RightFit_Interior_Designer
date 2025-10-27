# Structured Logging Guide

**Status**: ✅ Implemented (Story 1.13)
**Date**: 2025-10-27

---

## Overview

The application uses structured logging with environment-aware behavior:

- **Development mode**: All logs visible with color coding
- **Production mode**: Only errors logged, sent to error tracking service

---

## Quick Start

### Basic Usage

```typescript
import { Logger } from '@/utils/Logger';

// Debug-level logging (development only)
Logger.debug('Coordinate calculation', { x: 10, y: 20 });

// Info-level logging (development only)
Logger.info('Component loaded successfully');

// Warning-level logging (development only)
Logger.warn('Using fallback value', { reason: 'API timeout' });

// Error-level logging (all environments)
Logger.error('Failed to load data', error, { userId: 123 });
```

### Performance Logging

```typescript
const startTime = performance.now();
// ... expensive operation ...
const duration = performance.now() - startTime;

Logger.perf('Coordinate transformation', duration, { elementCount: 100 });
```

### Grouped Logging

```typescript
Logger.group('Element Rendering');
Logger.debug('Rendering base cabinet', { id: 'BC-001' });
Logger.debug('Rendering wall cabinet', { id: 'WC-002' });
Logger.groupEnd();
```

---

## Log Levels

### DEBUG (development only)
Use for detailed diagnostic information that helps with debugging.

**Examples:**
- Coordinate calculations
- Algorithm steps
- State transitions
- Cache hits/misses

**Color**: Gray, italic

### INFO (development only)
Use for general informational messages about application progress.

**Examples:**
- Component loaded
- Operation completed
- Configuration loaded
- Connection established

**Color**: Blue, bold

### WARN (development only)
Use for potentially problematic situations that don't prevent operation.

**Examples:**
- Using fallback values
- Deprecated API usage
- Performance degradation
- Missing optional configuration

**Color**: Orange, bold

### ERROR (all environments)
Use for error conditions that require attention.

**Examples:**
- Network failures
- Database errors
- Invalid user input
- Unexpected exceptions

**Color**: Red, bold

**Production Behavior**: Sent to error tracking service (Sentry)

---

## Migration from console.*

The entire codebase has been migrated from `console.*` to `Logger.*`:

| Old Code | New Code | When to Use |
|----------|----------|-------------|
| `console.log()` | `Logger.debug()` | Debug-level info |
| `console.info()` | `Logger.info()` | Informational messages |
| `console.warn()` | `Logger.warn()` | Warnings |
| `console.error()` | `Logger.error()` | Errors |
| `console.group()` | `Logger.group()` | Group start |
| `console.groupEnd()` | `Logger.groupEnd()` | Group end |

**Migration Stats:**
- 552 console statements replaced
- 61 files modified
- Zero console statements in production build

---

## Production Build Configuration

The production build strips all Logger calls except errors:

**vite.config.ts:**
```typescript
build: {
  esbuildOptions: {
    drop: ['console', 'debugger'],
    pure: ['Logger.debug', 'Logger.info', 'Logger.warn'],
  },
}
```

This ensures:
- Zero debug/info/warn logs in production bundle
- Smaller production bundle size
- No internal logic exposed to users
- Only errors sent to tracking service

---

## Error Tracking Integration

### Setup Sentry (Optional)

1. Install Sentry:
```bash
npm install @sentry/react
```

2. Add environment variable to `.env.production`:
```
VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id
```

3. Initialize in `main.tsx`:
```typescript
import { initializeSentry, setSentryUser } from '@/utils/SentryIntegration';

if (import.meta.env.PROD) {
  initializeSentry({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1, // 10% of transactions
  });
}

// After user login
setSentryUser({
  id: user.id,
  email: user.email,
  username: user.username,
});
```

4. Logger automatically sends errors to Sentry in production.

### Sentry Features

- **Error tracking**: Automatic error capture
- **Session replay**: 10% of sessions, 100% with errors
- **Performance monitoring**: 10% of transactions
- **Breadcrumbs**: Track user actions leading to errors
- **User context**: Associate errors with users

---

## Best Practices

### DO ✅

- Use `Logger.debug()` for algorithm steps and calculations
- Use `Logger.info()` for successful operations
- Use `Logger.warn()` for recoverable issues
- Use `Logger.error()` with Error objects for exceptions
- Include context objects with relevant data
- Group related logs with `Logger.group()`

### DON'T ❌

- Don't use `console.*` directly (use Logger instead)
- Don't log sensitive data (passwords, tokens, API keys)
- Don't log in tight loops (use performance monitoring instead)
- Don't log huge objects (log summaries or counts)
- Don't use `Logger.error()` for non-error conditions

---

## Examples from Codebase

### Before Migration

```typescript
// Old code (removed)
console.log('Calculating position for element', element.id);
console.log('roomWidth:', roomWidth, 'roomDepth:', roomDepth);
console.warn('Using default Z position for', element.type);
console.error('Failed to load component', error);
```

### After Migration

```typescript
// New code (structured logging)
Logger.debug('Calculating position for element', {
  elementId: element.id,
  roomWidth,
  roomDepth
});

Logger.warn('Using default Z position', {
  elementType: element.type,
  fallbackValue: defaultZ
});

Logger.error('Failed to load component', error, {
  componentId: component.id,
  retryCount: 3
});
```

---

## Testing Logger

### Unit Tests

```bash
npm run test:run -- Logger.test.ts
```

**Coverage**: 26 tests, 100% coverage

### Development Mode Test

1. Start dev server: `npm run dev`
2. Open browser console
3. Logs should be visible with color coding:
   - [DEBUG] - Gray
   - [INFO] - Blue
   - [WARN] - Orange
   - [ERROR] - Red

### Production Mode Test

1. Build production: `npm run build`
2. Preview: `npm run preview`
3. Open browser console
4. Only errors should be visible (if any occur)
5. Verify bundle size reduced

---

## Troubleshooting

### Logger not working in tests

**Problem**: Tests fail because `import.meta.env.MODE` is 'test'

**Solution**: Logger already handles test mode (logs in both development and test)

### Logs not showing in development

**Problem**: No logs visible in browser console

**Solution**: Check that `import.meta.env.MODE === 'development'`

### Errors not sent to Sentry

**Problem**: Errors not appearing in Sentry dashboard

**Solution**:
1. Verify `VITE_SENTRY_DSN` is set correctly
2. Check `initializeSentry()` was called
3. Ensure `import.meta.env.PROD === true`
4. Check browser network tab for Sentry requests

### Production bundle still has console statements

**Problem**: `console.log` appears in production bundle

**Solution**: Verify `vite.config.ts` has `drop: ['console']`

---

## Related Documentation

- [Logger.ts](../src/utils/Logger.ts) - Logger implementation
- [SentryIntegration.ts](../src/utils/SentryIntegration.ts) - Sentry integration
- [Story 1.13](./stories/1.13-structured-logging.md) - Story card
- [PRD Section 4.13](./prd.md#story-113) - Requirements

---

**Last Updated**: 2025-10-27
**Story**: 1.13 - Remove Production Console Logs and Implement Structured Logging
