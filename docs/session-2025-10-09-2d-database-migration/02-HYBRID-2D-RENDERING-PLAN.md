# Hybrid 2D Rendering System - Implementation Plan
**Date:** 2025-10-09
**Status:** 📋 **PLANNING PHASE**

---

## Executive Summary

### Goal
Transform 2D rendering from code-based to database-driven while maintaining performance and enabling admin management.

### Approach
**Hybrid System:**
- Store render metadata in database (types, parameters, SVG paths)
- Code interprets metadata with handler functions
- Common patterns (rectangle, corner, sink) handled by code
- Custom shapes supported via SVG paths
- Backward compatible during migration

### Benefits
- ✅ Admin can add/modify components via UI
- ✅ No code changes needed for new components
- ✅ Maintains Canvas API performance
- ✅ Extensible render type system
- ✅ Reduced code complexity (~1200 lines removed)

---

## Database Schema Design

### Table: `component_2d_renders`

```sql
-- Main 2D rendering definitions table
CREATE TABLE component_2d_renders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  component_id text NOT NULL REFERENCES components(component_id) ON DELETE CASCADE,

  -- Plan View Configuration
  plan_view_type text NOT NULL DEFAULT 'rectangle',
  plan_view_data jsonb DEFAULT '{}',
  plan_view_svg text, -- Optional SVG path for custom shapes

  -- Elevation View Configuration (front/back views)
  elevation_type text NOT NULL DEFAULT 'standard-cabinet',
  elevation_data jsonb DEFAULT '{}',
  elevation_svg_front text, -- Optional SVG for front view
  elevation_svg_back text,  -- Optional SVG for back view

  -- Side Elevation Configuration (left/right views)
  side_elevation_type text NOT NULL DEFAULT 'standard-cabinet',
  side_elevation_data jsonb DEFAULT '{}',
  elevation_svg_left text,  -- Optional SVG for left view
  elevation_svg_right text, -- Optional SVG for right view

  -- Visual Properties
  fill_color text DEFAULT '#8b4513',
  stroke_color text DEFAULT '#000000',
  stroke_width numeric DEFAULT 1,

  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),

  -- Constraints
  UNIQUE(component_id)
);

-- Index for fast lookups
CREATE INDEX idx_component_2d_renders_component_id
ON component_2d_renders(component_id);

-- Update timestamp trigger
CREATE TRIGGER update_component_2d_renders_updated_at
BEFORE UPDATE ON component_2d_renders
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Supported Render Types

#### Plan View Types
```typescript
type PlanViewType =
  | 'rectangle'           // Standard rectangular component
  | 'corner-square'       // L-shaped corner (rendered as square)
  | 'sink-single'         // Single bowl sink with ellipse
  | 'sink-double'         // Double bowl sink
  | 'sink-corner'         // L-shaped corner sink
  | 'custom-svg';         // Custom SVG path

// Plan view data structures
interface RectangleData {
  // No special parameters (uses element dimensions)
}

interface CornerSquareData {
  // No special parameters (uses min(width, depth))
}

interface SinkSingleData {
  bowl_inset_ratio: number;  // 0.1 = 10% inset from edge
  bowl_depth_ratio: number;  // 0.8 = 80% of total depth
  bowl_style: 'ceramic' | 'stainless'; // Material appearance
  has_draining_board?: boolean;
}

interface SinkDoubleData {
  bowl_inset_ratio: number;
  bowl_width_ratio: number;  // 0.4 = 40% each
  center_divider_width: number; // cm
  bowl_style: 'ceramic' | 'stainless';
}

interface SinkCornerData {
  bowl_size_ratio: number; // 0.6 = 60% of available space
  bowl_style: 'ceramic' | 'stainless';
}
```

#### Elevation View Types
```typescript
type ElevationViewType =
  | 'standard-cabinet'    // Cabinet with doors/drawers
  | 'appliance'           // Appliance with panel
  | 'sink'                // Sink with front panel
  | 'open-shelf'          // Open shelving
  | 'custom-svg';         // Custom SVG path

interface StandardCabinetData {
  door_count: number;     // Number of doors
  door_style: 'flat' | 'shaker' | 'glass';
  handle_style: 'bar' | 'knob' | 'none';
  handle_position: 'top' | 'center' | 'bottom';
  drawer_count?: number;  // Optional drawers
  drawer_heights?: number[]; // Heights in cm
}

interface ApplianceData {
  panel_style: 'integrated' | 'standalone';
  has_display?: boolean;
  has_handle?: boolean;
}

interface SinkElevationData {
  has_front_panel: boolean;
  panel_height: number; // cm
}
```

---

## Render Handler System

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  DesignCanvas2D.tsx                     │
│                                                         │
│  drawElement(ctx, element)                             │
│    ↓                                                    │
│  get2DRenderDefinition(element.component_id) [CACHED]  │
│    ↓                                                    │
│  renderElement(ctx, element, renderDef)                │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│         src/services/2d-renderers/index.ts              │
│                                                         │
│  const RENDER_HANDLERS = {                             │
│    'rectangle': renderRectangle,                       │
│    'corner-square': renderCornerSquare,                │
│    'sink-single': renderSinkSingle,                    │
│    'sink-double': renderSinkDouble,                    │
│    'custom-svg': renderCustomSVG,                      │
│    // ... more handlers                                │
│  };                                                     │
│                                                         │
│  export function renderElement(ctx, element, def) {    │
│    const handler = RENDER_HANDLERS[def.plan_view_type];│
│    handler(ctx, element, def.plan_view_data);          │
│  }                                                      │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│    src/services/2d-renderers/plan-view-handlers.ts     │
│                                                         │
│  export function renderRectangle(ctx, element, data) { │
│    const { width, depth } = element;                   │
│    ctx.fillRect(0, 0, width, depth);                   │
│  }                                                      │
│                                                         │
│  export function renderSinkSingle(ctx, element, data) {│
│    // Draw sink bowl with ellipse                      │
│    const bowlX = width * data.bowl_inset_ratio;       │
│    ctx.ellipse(...);                                   │
│  }                                                      │
└─────────────────────────────────────────────────────────┘
```

### Service: `src/services/Render2DService.ts`

```typescript
import { supabase } from '@/lib/supabaseClient';

interface Render2DDefinition {
  component_id: string;
  plan_view_type: string;
  plan_view_data: Record<string, any>;
  plan_view_svg?: string;
  elevation_type: string;
  elevation_data: Record<string, any>;
  fill_color: string;
  stroke_color: string;
}

class Render2DService {
  private cache: Map<string, Render2DDefinition> = new Map();
  private isPreloaded: boolean = false;

  /**
   * Preload all 2D render definitions on app startup
   */
  async preloadAll(): Promise<void> {
    if (this.isPreloaded) return;

    const { data, error } = await supabase
      .from('component_2d_renders')
      .select('*');

    if (error) {
      console.error('[Render2DService] Preload failed:', error);
      return;
    }

    data.forEach(def => {
      this.cache.set(def.component_id, def);
    });

    this.isPreloaded = true;
    console.log(`[Render2DService] Preloaded ${data.length} 2D render definitions`);
  }

  /**
   * Get 2D render definition for a component (cached)
   */
  async get(componentId: string): Promise<Render2DDefinition | null> {
    // Check cache first
    if (this.cache.has(componentId)) {
      return this.cache.get(componentId)!;
    }

    // Fetch from database if not cached
    const { data, error } = await supabase
      .from('component_2d_renders')
      .select('*')
      .eq('component_id', componentId)
      .single();

    if (error || !data) {
      console.warn(`[Render2DService] No 2D render definition for ${componentId}`);
      return null;
    }

    // Cache for future use
    this.cache.set(componentId, data);
    return data;
  }

  /**
   * Clear cache (for admin updates)
   */
  clearCache(): void {
    this.cache.clear();
    this.isPreloaded = false;
  }
}

export const render2DService = new Render2DService();
```

---

## Implementation Steps

### Phase 1: Database Schema & Migration (2-3 hours)

**Step 1.1: Create Migration File**
```bash
# Create new migration
npx supabase migration new create_2d_renders_schema
```

**File:** `supabase/migrations/20251009000001_create_2d_renders_schema.sql`

```sql
-- Create component_2d_renders table
CREATE TABLE component_2d_renders (
  -- ... (schema from above)
);

-- Add RLS policies
ALTER TABLE component_2d_renders ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "component_2d_renders_select_policy"
ON component_2d_renders FOR SELECT
USING (true);

-- Admin write access
CREATE POLICY "component_2d_renders_insert_policy"
ON component_2d_renders FOR INSERT
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "component_2d_renders_update_policy"
ON component_2d_renders FOR UPDATE
USING (auth.role() = 'service_role');
```

**Step 1.2: Populate Existing Components**

Create script: `scripts/populate-2d-renders.ts`

```typescript
// Auto-populate 2D render definitions from existing components
async function populate2DRenders() {
  const { data: components } = await supabase
    .from('components')
    .select('component_id, type');

  const renders = components.map(comp => {
    // Detect render type from component_id patterns
    let plan_view_type = 'rectangle';
    let plan_view_data = {};

    if (comp.component_id.includes('corner')) {
      plan_view_type = 'corner-square';
    } else if (comp.component_id.includes('sink')) {
      if (comp.component_id.includes('double')) {
        plan_view_type = 'sink-double';
        plan_view_data = {
          bowl_inset_ratio: 0.1,
          bowl_width_ratio: 0.4,
          center_divider_width: 5,
          bowl_style: 'stainless'
        };
      } else {
        plan_view_type = 'sink-single';
        plan_view_data = {
          bowl_inset_ratio: 0.1,
          bowl_depth_ratio: 0.8,
          bowl_style: 'stainless'
        };
      }
    }

    return {
      component_id: comp.component_id,
      plan_view_type,
      plan_view_data,
      elevation_type: 'standard-cabinet',
      elevation_data: {}
    };
  });

  // Bulk insert
  const { error } = await supabase
    .from('component_2d_renders')
    .insert(renders);

  if (error) {
    console.error('Population failed:', error);
  } else {
    console.log(`Populated ${renders.length} 2D render definitions`);
  }
}
```

**Step 1.3: Test Migration**
```bash
# Apply migration locally
npx supabase db reset

# Run population script
npx ts-node scripts/populate-2d-renders.ts

# Verify data
npx supabase db query "SELECT COUNT(*) FROM component_2d_renders"
```

---

### Phase 2: Render Handler Implementation (4-5 hours)

**Step 2.1: Create Render Service**

**File:** `src/services/Render2DService.ts`
- Implement caching logic
- Preload on app startup
- Type-safe interfaces

**Step 2.2: Create Plan View Handlers**

**File:** `src/services/2d-renderers/plan-view-handlers.ts`

```typescript
export function renderRectangle(
  ctx: CanvasRenderingContext2D,
  element: DesignElement,
  data: RectangleData,
  zoom: number
): void {
  const width = element.width * zoom;
  const depth = (element.depth || element.height) * zoom;
  ctx.fillRect(0, 0, width, depth);
}

export function renderCornerSquare(
  ctx: CanvasRenderingContext2D,
  element: DesignElement,
  data: CornerSquareData,
  zoom: number
): void {
  const size = Math.min(element.width, element.depth || element.height) * zoom;
  ctx.fillRect(0, 0, size, size);
}

export function renderSinkSingle(
  ctx: CanvasRenderingContext2D,
  element: DesignElement,
  data: SinkSingleData,
  zoom: number
): void {
  const width = element.width * zoom;
  const depth = (element.depth || element.height) * zoom;

  // Sink rim
  const rimColor = data.bowl_style === 'ceramic' ? '#F8F8F8' : '#B0B0B0';
  ctx.fillStyle = rimColor;
  ctx.fillRect(0, 0, width, depth);

  // Bowl
  const bowlColor = data.bowl_style === 'ceramic' ? '#FFFFFF' : '#C0C0C0';
  const inset = data.bowl_inset_ratio || 0.1;
  const depthRatio = data.bowl_depth_ratio || 0.8;

  const bowlX = width * inset;
  const bowlY = depth * inset;
  const bowlWidth = width * (1 - 2 * inset);
  const bowlDepth = depth * depthRatio;

  ctx.fillStyle = bowlColor;
  ctx.beginPath();
  ctx.ellipse(
    bowlX + bowlWidth / 2,
    bowlY + bowlDepth / 2,
    bowlWidth / 2 * 0.9,
    bowlDepth / 2 * 0.95,
    0, 0, 2 * Math.PI
  );
  ctx.fill();
}

export function renderCustomSVG(
  ctx: CanvasRenderingContext2D,
  element: DesignElement,
  svgPath: string,
  zoom: number
): void {
  // Parse SVG path and render to canvas
  const path = new Path2D(svgPath);
  ctx.fill(path);
}
```

**Step 2.3: Create Main Renderer**

**File:** `src/services/2d-renderers/index.ts`

```typescript
import {
  renderRectangle,
  renderCornerSquare,
  renderSinkSingle,
  renderSinkDouble,
  renderCustomSVG
} from './plan-view-handlers';

const PLAN_VIEW_HANDLERS: Record<string, Function> = {
  'rectangle': renderRectangle,
  'corner-square': renderCornerSquare,
  'sink-single': renderSinkSingle,
  'sink-double': renderSinkDouble,
  'custom-svg': renderCustomSVG,
};

export function renderPlanView(
  ctx: CanvasRenderingContext2D,
  element: DesignElement,
  renderDef: Render2DDefinition,
  zoom: number
): void {
  const handler = PLAN_VIEW_HANDLERS[renderDef.plan_view_type];

  if (!handler) {
    console.warn(`[2D Renderer] Unknown plan_view_type: ${renderDef.plan_view_type}`);
    // Fallback to rectangle
    renderRectangle(ctx, element, {}, zoom);
    return;
  }

  handler(ctx, element, renderDef.plan_view_data, zoom);
}
```

---

### Phase 3: DesignCanvas2D Integration (3-4 hours)

**Step 3.1: Add Feature Flag**

**File:** `src/lib/featureFlags.ts` (if not exists, create)

```typescript
export const FEATURE_FLAGS = {
  use_database_2d_rendering: true, // Toggle for gradual rollout
};
```

**Step 3.2: Refactor drawElement()**

**File:** `src/components/designer/DesignCanvas2D.tsx`

```typescript
import { render2DService } from '@/services/Render2DService';
import { renderPlanView } from '@/services/2d-renderers';
import { FEATURE_FLAGS } from '@/lib/featureFlags';

const DesignCanvas2D = () => {
  // Preload 2D render definitions on mount
  useEffect(() => {
    if (FEATURE_FLAGS.use_database_2d_rendering) {
      render2DService.preloadAll().catch(console.error);
    }
  }, []);

  const drawElement = useCallback(async (
    ctx: CanvasRenderingContext2D,
    element: DesignElement
  ) => {
    const isSelected = selectedElement?.id === element.id;
    const isHovered = hoveredElement?.id === element.id;

    if (active2DView === 'plan') {
      const pos = roomToCanvas(element.x, element.y);
      const width = element.width * zoom;
      const depth = (element.depth || element.height) * zoom;
      const rotation = element.rotation || 0;

      ctx.save();
      ctx.translate(pos.x + width / 2, pos.y + depth / 2);
      ctx.rotate(rotation * Math.PI / 180);
      ctx.translate(-width / 2, -depth / 2);

      // Set fill color
      if (isSelected) {
        ctx.fillStyle = '#ff6b6b';
      } else if (isHovered) {
        ctx.fillStyle = '#b0b0b0';
      } else {
        ctx.fillStyle = element.color || '#8b4513';
      }

      // DATABASE-DRIVEN RENDERING (NEW)
      if (FEATURE_FLAGS.use_database_2d_rendering) {
        const renderDef = await render2DService.get(element.component_id);

        if (renderDef) {
          // Use database-driven renderer
          ctx.fillStyle = renderDef.fill_color || ctx.fillStyle;
          renderPlanView(ctx, element, renderDef, zoom);
        } else {
          // Fallback to legacy code if no definition found
          drawElementLegacy(ctx, element, width, depth, isSelected, isHovered);
        }
      } else {
        // Legacy code path (backward compatibility)
        drawElementLegacy(ctx, element, width, depth, isSelected, isHovered);
      }

      ctx.restore();
    } else {
      // Elevation view (handle similarly)
      drawElementElevation(ctx, element, isSelected, isHovered, showWireframe);
    }
  }, [active2DView, selectedElement, hoveredElement, zoom]);

  // Keep legacy code for backward compatibility
  const drawElementLegacy = (ctx, element, width, depth, isSelected, isHovered) => {
    if (element.type === 'sink') {
      drawSinkPlanView(ctx, element, width, depth, isSelected, isHovered);
    } else if (isCornerComponent(element)) {
      const size = Math.min(element.width, element.depth) * zoom;
      ctx.fillRect(0, 0, size, size);
    } else {
      ctx.fillRect(0, 0, width, depth);
    }
  };

  // ... rest of component
};
```

**Step 3.3: Test Integration**
- Toggle feature flag on/off
- Verify database-driven rendering works
- Verify fallback to legacy works
- Check performance (should be <1ms overhead)

---

### Phase 4: Elevation View Handlers (2-3 hours)

**Similar approach for elevation views:**

**File:** `src/services/2d-renderers/elevation-view-handlers.ts`

```typescript
export function renderStandardCabinet(
  ctx: CanvasRenderingContext2D,
  element: DesignElement,
  data: StandardCabinetData,
  zoom: number
): void {
  // Draw cabinet with doors, handles, drawers
  const width = element.width * zoom;
  const height = element.height * zoom;

  // Cabinet body
  ctx.fillRect(0, 0, width, height);

  // Doors
  if (data.door_count > 0) {
    const doorWidth = width / data.door_count;
    for (let i = 0; i < data.door_count; i++) {
      const doorX = i * doorWidth;
      // Draw door panel, handle, etc.
    }
  }
}
```

---

## Migration Strategy

### Step-by-Step Rollout

**Week 1: Database & Core Infrastructure**
1. Create database schema
2. Apply migration to dev environment
3. Populate existing components
4. Implement Render2DService with caching
5. Test database queries and performance

**Week 2: Render Handlers**
1. Implement plan view handlers
2. Implement elevation view handlers
3. Unit test each handler
4. Integration test with sample components

**Week 3: Canvas Integration**
1. Refactor DesignCanvas2D.tsx
2. Add feature flag
3. Implement backward compatibility
4. Visual regression testing

**Week 4: Admin UI (Parallel Track)**
1. Build component management page
2. 2D render configuration form
3. Live preview canvas
4. Test admin workflow

**Week 5: Testing & Refinement**
1. End-to-end testing
2. Performance benchmarking
3. Bug fixes
4. User acceptance testing

**Week 6: Production Rollout**
1. Deploy to production with feature flag OFF
2. Monitor for issues
3. Enable feature flag for 10% of users
4. Gradual rollout to 100%

---

## Performance Optimization

### Caching Strategy

```typescript
// Three-tier caching
class Render2DService {
  // Tier 1: Memory cache (fastest)
  private memoryCache: Map<string, Render2DDefinition> = new Map();

  // Tier 2: IndexedDB (offline support)
  private async getFromIndexedDB(id: string): Promise<Render2DDefinition | null> {
    // ... IndexedDB implementation
  }

  // Tier 3: Supabase (network)
  private async getFromSupabase(id: string): Promise<Render2DDefinition | null> {
    // ... Supabase query
  }

  async get(id: string): Promise<Render2DDefinition | null> {
    // Check memory first
    if (this.memoryCache.has(id)) {
      return this.memoryCache.get(id)!;
    }

    // Check IndexedDB
    const cached = await this.getFromIndexedDB(id);
    if (cached) {
      this.memoryCache.set(id, cached);
      return cached;
    }

    // Fetch from Supabase
    const fetched = await this.getFromSupabase(id);
    if (fetched) {
      this.memoryCache.set(id, fetched);
      await this.saveToIndexedDB(id, fetched);
      return fetched;
    }

    return null;
  }
}
```

### Preloading Strategy

```typescript
// Preload on app initialization
export function initializeApp() {
  // Preload 2D definitions in background
  render2DService.preloadAll().then(() => {
    console.log('[App] 2D render definitions preloaded');
  });

  // Preload on component library load
  componentLibrary.on('load', () => {
    render2DService.preloadAll();
  });
}
```

### Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Preload Time** | <500ms | All 194 components loaded on startup |
| **Cache Hit Rate** | >99% | After initial preload |
| **Render Overhead** | <1ms | Additional time vs legacy code |
| **Memory Usage** | <5MB | All definitions cached |
| **Network Requests** | 1 | Single bulk query on startup |

---

## TypeScript Type Safety

### Type Definitions

**File:** `src/types/render2d.ts`

```typescript
export type PlanViewType =
  | 'rectangle'
  | 'corner-square'
  | 'sink-single'
  | 'sink-double'
  | 'sink-corner'
  | 'custom-svg';

export type ElevationViewType =
  | 'standard-cabinet'
  | 'appliance'
  | 'sink'
  | 'open-shelf'
  | 'custom-svg';

export interface Render2DDefinition {
  id: string;
  component_id: string;
  plan_view_type: PlanViewType;
  plan_view_data: PlanViewData;
  plan_view_svg?: string;
  elevation_type: ElevationViewType;
  elevation_data: ElevationData;
  fill_color: string;
  stroke_color: string;
}

export type PlanViewData =
  | RectangleData
  | CornerSquareData
  | SinkSingleData
  | SinkDoubleData
  | SinkCornerData;

export type ElevationData =
  | StandardCabinetData
  | ApplianceData
  | SinkElevationData
  | OpenShelfData;

// ... interface definitions
```

---

## Testing Strategy

### Unit Tests

```typescript
// Test render handlers in isolation
describe('Plan View Handlers', () => {
  it('should render rectangle correctly', () => {
    const ctx = createMockCanvas();
    const element = { width: 60, depth: 60 };
    const data = {};

    renderRectangle(ctx, element, data, 1);

    expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 60, 60);
  });

  it('should render sink with correct bowl size', () => {
    // ... test sink rendering
  });
});
```

### Integration Tests

```typescript
// Test full rendering pipeline
describe('2D Rendering Integration', () => {
  it('should load definition from database and render', async () => {
    const renderDef = await render2DService.get('base-cabinet-60');
    expect(renderDef).toBeDefined();
    expect(renderDef.plan_view_type).toBe('rectangle');

    const ctx = createMockCanvas();
    renderPlanView(ctx, element, renderDef, 1);
    // ... assertions
  });
});
```

### Performance Tests

```typescript
// Benchmark rendering performance
describe('Performance', () => {
  it('should render within 1ms overhead', async () => {
    const start = performance.now();
    await render2DService.get('base-cabinet-60');
    const end = performance.now();

    expect(end - start).toBeLessThan(1);
  });
});
```

---

## Success Criteria

### Must-Have
- ✅ Database schema created and populated
- ✅ Render2DService implemented with caching
- ✅ Plan view handlers for all common types
- ✅ DesignCanvas2D refactored with feature flag
- ✅ Backward compatibility maintained
- ✅ Performance within targets (<1ms overhead)
- ✅ 90%+ components rendering correctly

### Should-Have
- ✅ Elevation view handlers implemented
- ✅ Custom SVG support
- ✅ IndexedDB caching
- ✅ Unit tests for all handlers
- ✅ Integration tests
- ✅ Admin UI basic functionality

### Nice-to-Have
- ✅ Admin UI with live preview
- ✅ SVG path editor
- ✅ Bulk import/export
- ✅ Automated visual regression testing
- ✅ Performance monitoring dashboard

---

**Document Status:** ✅ COMPLETE
**Last Updated:** 2025-10-09
**Related Documents:**
- 01-ARCHITECTURAL-ASSESSMENT.md (current state)
- 03-LEGACY-CODE-REMOVAL-PLAN.md (cleanup plan)
- 04-IMPLEMENTATION-PHASES.md (timeline)
- 05-ADMIN-UI-DESIGN.md (UI mockups)
