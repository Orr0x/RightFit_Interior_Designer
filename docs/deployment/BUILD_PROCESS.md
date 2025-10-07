# Build Process Explanation

## Why the `dist` folder was removed

### ✅ **The `dist` folder is NOT needed locally because:**

1. **Local Development:**
   - Uses `npm run dev` → Vite dev server
   - Serves directly from `src/` folder
   - Hot reloading works from source files
   - No build step required

2. **Production Deployment:**
   - GitHub Actions runs `npm run build` automatically
   - Creates fresh `dist/` folder on each deployment
   - Uploads `dist/` contents to VPS
   - `dist/` is regenerated every time

3. **Git Configuration:**
   - `dist/` is in `.gitignore` (not tracked by git)
   - Build artifacts shouldn't be committed
   - Can be regenerated anytime with `npm run build`

## Build Commands

### Development
```bash
npm run dev          # Start dev server (uses src/ directly)
```

### Production
```bash
npm run build        # Create dist/ folder
npm run build:prod   # Create dist/ with production optimizations
npm run preview      # Preview built app locally
```

### Cleanup
```bash
npm run clean        # Remove dist/ and node_modules/.vite
```

## Deployment Flow

```
Local Development: src/ → Vite Dev Server → Browser
Production: src/ → npm run build → dist/ → VPS → Live Site
```

## When `dist/` is created

- **GitHub Actions** - Automatically on every push to main
- **Manual build** - When you run `npm run build`
- **Local testing** - When you run `npm run preview`

## Benefits of removing `dist/`

1. **Cleaner repository** - No build artifacts in git
2. **Faster git operations** - Less files to track
3. **No conflicts** - Can't have outdated build files
4. **Always fresh** - Build is always current with source code
5. **Smaller repo size** - No unnecessary files

## If you need to test production build locally

```bash
npm run build        # Create dist/
npm run preview      # Test the built app
# Then delete dist/ when done
```
