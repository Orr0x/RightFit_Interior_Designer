# Performance Optimization Guide

## Build Optimizations

### 1. Code Splitting Strategy

The application now uses intelligent code splitting to reduce initial bundle size:

- **React Vendor**: Core React libraries (`react`, `react-dom`)
- **Supabase**: Database and authentication (`@supabase/supabase-js`)
- **Three.js**: 3D rendering libraries (`three`, `@react-three/*`)
- **Radix UI**: Split into logical groups:
  - `radix-overlays`: Dialogs, dropdowns, popovers
  - `radix-layout`: Accordions, tabs, collapsibles
  - `radix-forms`: Buttons, inputs, labels
  - `radix-display`: Avatars, badges, cards
- **Charts**: Visualization libraries (`recharts`)
- **Forms**: Form handling (`react-hook-form`, `zod`)
- **Date Utils**: Date and time utilities
- **UI Utils**: CSS and styling utilities
- **Router**: Navigation (`react-router-dom`)
- **Query**: State management (`@tanstack/react-query`)

### 2. Build Commands

```bash
# Standard production build
npm run build:prod

# Build with bundle analysis
npm run build:analyze

# Check bundle sizes
npm run size-check

# Analyze bundle in browser
npm run analyze
```

### 3. Bundle Analysis

After running `npm run build:analyze`, open `dist/bundle-analysis.html` in your browser to:
- Visualize bundle composition
- Identify large dependencies
- Optimize code splitting
- Monitor gzip and brotli compression

## Runtime Optimizations

### 1. Lazy Loading Components

Consider implementing lazy loading for heavy components:

```typescript
// Example: Lazy load 3D components
const View3D = lazy(() => import('./components/designer/View3D'));
const EnhancedModels3D = lazy(() => import('./components/designer/EnhancedModels3D'));
```

### 2. Image Optimization

- Use WebP format for images
- Implement responsive images
- Add lazy loading for images
- Consider using a CDN for static assets

### 3. Memory Management

- Clean up Three.js objects when components unmount
- Use `useMemo` and `useCallback` for expensive calculations
- Implement proper cleanup in useEffect hooks

## Monitoring Performance

### 1. Bundle Size Monitoring

```bash
# Check current bundle sizes
npm run size-check

# Compare with previous builds
npm run build:prod && npm run size-check > bundle-sizes.txt
```

### 2. Runtime Performance

- Use React DevTools Profiler
- Monitor Web Vitals (LCP, FID, CLS)
- Set up performance monitoring in production

### 3. Network Optimization

- Enable gzip compression on server
- Use CDN for static assets
- Implement service worker for caching
- Consider HTTP/2 server push for critical resources

## Best Practices

### 1. Import Optimization

```typescript
// ❌ Import entire library
import * as THREE from 'three';

// ✅ Import only what you need
import { Scene, PerspectiveCamera, WebGLRenderer } from 'three';
```

### 2. Component Optimization

```typescript
// ✅ Memoize expensive components
const ExpensiveComponent = memo(({ data }) => {
  // Component logic
});

// ✅ Use useMemo for expensive calculations
const processedData = useMemo(() => {
  return expensiveCalculation(data);
}, [data]);
```

### 3. Asset Optimization

- Compress images before adding to project
- Use SVG for simple icons
- Minimize CSS and JavaScript
- Remove unused dependencies

## Troubleshooting Large Bundles

### 1. Identify Large Dependencies

```bash
# Analyze bundle composition
npm run build:analyze
```

### 2. Common Issues

- **Large Three.js bundle**: Consider using dynamic imports
- **Radix UI bloat**: Ensure you're only importing used components
- **Unused dependencies**: Run `npm audit` and remove unused packages

### 3. Optimization Strategies

- Split large components into smaller ones
- Use dynamic imports for heavy features
- Implement virtual scrolling for large lists
- Consider server-side rendering for static content

## Performance Budget

Set performance budgets to maintain good performance:

- **Initial bundle**: < 500KB gzipped
- **Total bundle**: < 2MB gzipped
- **Time to Interactive**: < 3 seconds
- **Largest Contentful Paint**: < 2.5 seconds

## Monitoring Tools

- **Bundle Analyzer**: `npm run build:analyze`
- **Lighthouse**: Chrome DevTools
- **Web Vitals**: Google PageSpeed Insights
- **Bundle Size**: `npm run size-check`

