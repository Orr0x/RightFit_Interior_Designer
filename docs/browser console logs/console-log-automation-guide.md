# Automating Console Log Sharing with Claude Code

This guide provides several methods to automatically share console logs with Claude Code, eliminating the need for manual copy-pasting or creating unnecessary files.

## Browser-Based Applications

### Option 1: Browser DevTools Protocol (Recommended for Web Apps)
Use Chrome/Edge's remote debugging protocol to capture console logs programmatically.

**Setup:**
```bash
# Launch Chrome with remote debugging enabled
chrome --remote-debugging-port=9222
```

**Benefits:**
- Real-time log capture
- No browser extensions needed
- Works with existing development workflow

**Use Case:** Best for debugging web applications where you need browser console logs.

---

### Option 2: Browser Extension with Local Endpoint
Create a simple browser extension that intercepts console logs and exposes them via a local endpoint.

**Implementation Steps:**
1. Extension intercepts `console.log`, `console.error`, etc.
2. Logs are posted to `localhost:3000/logs` endpoint
3. Claude Code can query this endpoint on demand

**Benefits:**
- Clean integration
- Persistent across page reloads
- Can filter/format logs before sending

**Use Case:** Best when you need fine-grained control over which logs to capture.

---

## Node.js/Backend Applications

### Option 3: Direct Output Piping
Pipe your application's console output directly to a file or clipboard.

**macOS:**
```bash
node your-app.js 2>&1 | tee >(pbcopy)
```

**Windows (Git Bash):**
```bash
node your-app.js 2>&1 | tee /dev/clipboard
```

**Linux:**
```bash
node your-app.js 2>&1 | tee >(xclip -selection clipboard)
```

**Benefits:**
- Zero code changes required
- Immediate availability
- Captures both stdout and stderr

**Use Case:** Best for quick debugging sessions with backend applications.

---

### Option 4: Logging Library with Monitored File
Configure your application to write logs to a specific file that Claude Code can reference.

**Example with Winston:**
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ 
      filename: '/tmp/claude-logs/app.log',
      maxsize: 5242880, // 5MB
      maxFiles: 2
    })
  ],
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  )
});

// Use throughout your app
logger.info('Application started');
logger.error('Error occurred', { error: err });
```

**Example with Pino:**
```javascript
const pino = require('pino');
const logger = pino({
  transport: {
    target: 'pino/file',
    options: { destination: '/tmp/claude-logs/app.log' }
  }
});
```

**Benefits:**
- Structured logging
- Persistent log history
- No manual intervention needed
- Claude Code can reference the file path directly

**Use Case:** Best for ongoing development where you frequently need to share logs.

---

### Option 5: File Watcher Pattern
Set up a dedicated log file that updates in real-time.

**Terminal Setup:**
```bash
# Create log directory
mkdir -p ~/.claude-logs

# Run your app and pipe output
node your-app.js 2>&1 | tee ~/.claude-logs/latest.log

# Or for browser dev server
npm run dev 2>&1 | tee ~/.claude-logs/latest.log
```

**In Claude Code:**
Simply reference: "Check the logs at `~/.claude-logs/latest.log`"

**Benefits:**
- Simple setup
- Works with any application
- Easy to clear/reset

**Use Case:** Universal solution for both frontend and backend.

---

## Full-Stack Applications

### Option 6: Combined Approach
For applications with both frontend and backend logging needs.

**Setup:**
```bash
# Backend logs
node server.js 2>&1 | tee ~/.claude-logs/backend.log &

# Frontend dev server
npm run dev 2>&1 | tee ~/.claude-logs/frontend.log &

# Browser console (using DevTools Protocol)
chrome --remote-debugging-port=9222
```

**Benefits:**
- Comprehensive log coverage
- Separate streams for easier debugging
- All logs accessible to Claude Code

**Use Case:** Best for complex applications where you need visibility across the entire stack.

---

## Quick Start Recommendation

### For Most Developers:
1. Create a logs directory: `mkdir -p ~/.claude-logs`
2. Pipe your app output: `your-command 2>&1 | tee ~/.claude-logs/latest.log`
3. Tell Claude Code: "Check logs at `~/.claude-logs/latest.log`"

### For Advanced Setups:
1. Implement structured logging with Winston/Pino
2. Configure log rotation
3. Set up multiple log streams for different concerns
4. Create a simple CLI tool to manage log collection

---

## Tips for Claude Code

When working with Claude Code, you can use phrases like:
- "Check the latest logs at ~/.claude-logs/latest.log"
- "The application logs are being written to /tmp/app-logs.log"
- "Review the error logs in the backend.log file"

This allows Claude Code to:
- Read the logs directly when needed
- Analyze patterns and errors
- Provide context-aware debugging assistance
- Avoid cluttering the conversation with log dumps

---

## Cleanup

To clear old logs:
```bash
# Clear specific log
> ~/.claude-logs/latest.log

# Clear all logs in directory
rm ~/.claude-logs/*.log

# Automated cleanup (add to cron or scheduled task)
find ~/.claude-logs -name "*.log" -mtime +7 -delete
```

---

## Summary

Choose the approach that best fits your workflow:
- **Quick & Simple:** File watcher pattern (Option 5)
- **Backend Apps:** Logging library (Option 4)
- **Frontend Apps:** DevTools Protocol (Option 1)
- **Full Control:** Custom browser extension (Option 2)
- **Full-Stack:** Combined approach (Option 6)

All methods eliminate manual copy-pasting while keeping Claude Code informed about your application's behavior.
