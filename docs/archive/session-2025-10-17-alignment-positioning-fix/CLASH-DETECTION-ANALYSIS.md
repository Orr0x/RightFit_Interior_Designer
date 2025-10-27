# Clash/Collision Detection Analysis

**Date:** 2025-10-17
**User Request:** Map out crash/clash detection, check if it considers different heights (base units, wall units, worktops, cornice, pelmet, flooring), look for dead code, advise on plan forward
**Goal:** Comprehensive analysis of collision detection system and height-based layering

---

## Executive Summary

**Current State:** ❌ BASIC 2D COLLISION DETECTION ONLY
- Only checks X/Y overlap (plan view coordinates)
- Does NOT consider component heights/layers
- Wall cabinets CAN clash with base cabinets (not prevented)
- Worktops CAN clash with base units (not prevented)

**Missing:**
- Z-axis (height) collision detection
- Component type/category awareness
- Layering system (what can go over/under what)
- Real-time collision feedback during drag/drop

---

## Current Implementation

### 1. Basic Collision Detection

**File:** `src/hooks/useDesignValidation.ts`
**Lines:** 94-113

```typescript
// Check for overlapping elements (basic collision detection)
const overlappingPairs: string[] = [];
for (let i = 0; i < design.elements.length; i++) {
  for (let j = i + 1; j < design.elements.length; j++) {
    const el1 = design.elements[i];
    const el2 = design.elements[j];

    // Simple rectangular collision detection (2D ONLY - X/Y)
    if (el1.x < el2.x + el2.width &&
        el1.x + el1.width > el2.x &&
        el1.y < el2.y + el2.height &&
        el1.y + el1.height > el2.y) {
      overlappingPairs.push(`${el1.id} and ${el2.id}`);
    }
  }
}

if (overlappingPairs.length > 0) {
  allWarnings.push(`Overlapping elements detected: ${overlappingPairs.join(', ')}`);
}
```

**Issues:**
- ❌ Only checks X, Y coordinates (plan view)
- ❌ Treats all components as same height/layer
- ❌ Warning only (doesn't prevent placement)
- ❌ Only runs on full design validation (not real-time)

---

### 2. Component Height Determination

**File:** `src/components/3d/DynamicComponentRenderer.tsx`
**Lines:** 79-82, 160

```typescript
// Determine if wall cabinet based on ID
const isWallCabinet = useMemo(() => {
  return element.component_id?.includes('wall-cabinet') ||
         element.id.includes('wall-cabinet');
}, [element.component_id, element.id]);

// Y position calculation
const yPosition = isWallCabinet ? 2.0 - height / 2 : height / 2;
//                                  ↑ Wall cabinet (top)  ↑ Base cabinet (bottom)
```

**Current Height System:**
- **Base Cabinets:** `yPosition = height / 2` (e.g., 0.45m for 90cm unit)
- **Wall Cabinets:** `yPosition = 2.0 - height / 2` (e.g., 1.6m for 80cm unit)

**Issues:**
- ✅ 3D rendering uses correct heights
- ❌ 2D collision detection ignores these heights
- ❌ Height determined by string matching ('wall-cabinet' in ID)
- ❌ No database field for component category/layer

---

### 3. Component Categories (Database)

**File:** `supabase/migrations/20250129000006_create_3d_models_schema.sql`
**Lines:** 14-16

```sql
CREATE TABLE IF NOT EXISTS public.component_3d_models (
  component_id VARCHAR(100) UNIQUE NOT NULL,
  component_name VARCHAR(200) NOT NULL,
  component_type VARCHAR(50) NOT NULL, -- 'cabinet', 'appliance', 'sink', etc.
  category VARCHAR(50), -- 'base-units', 'wall-units', 'tall-units', etc.
  ...
);
```

**Available Categories:**
- `base-units` - Base cabinets
- `wall-units` - Wall cabinets
- `tall-units` - Tall units/larders
- (Others likely exist but not documented)

**Issues:**
- ✅ Database has `category` field
- ❌ Not used for collision detection
- ❌ Worktops, cornices, pelmets, flooring not categorized

---

## Component Layering Requirements

### User's Specified Layer System:

**From Bottom to Top (Z-axis):**

1. **Flooring** - Goes under everything
   - Height: 0cm (floor level)
   - Can overlap: Nothing (base layer)

2. **Base Units** - Standard base cabinets
   - Height: 0-90cm (typically)
   - Can overlap: Flooring only
   - Cannot overlap: Other base units, appliances

3. **Work Tops (Worktops/Countertops)** - Go over base units
   - Height: 90cm (top of base units)
   - Can overlap: Base units (sits on top)
   - Cannot overlap: Wall units, other worktops

4. **Wall Units** - Wall cabinets
   - Height: 140-220cm (typically 2.0m center ± 0.4m)
   - Can overlap: Base units (different height)
   - Cannot overlap: Other wall units, tall units

5. **Pelmet** - Below wall units (decorative trim)
   - Height: Just below wall units (~135cm)
   - Can overlap: Wall units (attached below)
   - Cannot overlap: Worktops

6. **Cornice** - Above wall units (decorative trim)
   - Height: Just above wall units (~225cm)
   - Can overlap: Wall units (attached above)
   - Cannot overlap: Ceiling

---

## Missing Components in System

### Not Currently Tracked:

1. **Worktops/Countertops**
   - Listed in database: `supabase/migrations/20250130000013_populate_sinks_worktops.sql`
   - Height layer: Should sit at 90cm (top of base units)
   - Collision rule: Can overlap base units, not wall units

2. **Flooring**
   - Not found in component tables
   - Height layer: 0cm (base layer)
   - Collision rule: Everything can overlap flooring

3. **Cornice**
   - Listed in database: `supabase/migrations/20250130000015_populate_finishing.sql`
   - Height layer: Above wall units
   - Collision rule: Can overlap wall units (decorative attachment)

4. **Pelmet**
   - Listed in database: `supabase/migrations/20250130000015_populate_finishing.sql`
   - Height layer: Below wall units
   - Collision rule: Can overlap wall units (decorative attachment)

5. **Tall Units/Larders**
   - Listed in database: `supabase/migrations/20250130000012_populate_tall_units_appliances.sql`
   - Height layer: 0-220cm (floor to ceiling)
   - Collision rule: Cannot overlap anything (full height)

---

## Proposed Collision Detection System

### Layer-Based Collision Rules

#### Rule Matrix:

| Component Type | Height Range | Can Overlap | Cannot Overlap |
|----------------|--------------|-------------|----------------|
| Flooring | 0cm | Nothing | N/A (base layer) |
| Base Units | 0-90cm | Flooring | Other base units, appliances, tall units |
| Worktops | 90cm | Base units, flooring | Wall units, other worktops, tall units |
| Wall Units | 140-220cm | Base units, worktops, flooring | Other wall units, tall units, ceiling |
| Pelmet | 135cm | Wall units, base units, flooring | Worktops, other pelmets |
| Cornice | 225cm | Wall units, base units, flooring | Ceiling, other cornices |
| Tall Units | 0-220cm | Flooring only | Everything else (full height) |
| Appliances | 0-90cm | Flooring | Base units, other appliances, tall units |

---

### Implementation Plan

#### Phase 1: Database Schema Enhancement

**Add height/layer fields to components:**

```sql
-- Add to component_3d_models table
ALTER TABLE public.component_3d_models ADD COLUMN IF NOT EXISTS
  layer_type VARCHAR(50), -- 'flooring', 'base', 'worktop', 'wall', 'pelmet', 'cornice', 'tall'
  min_height_cm DECIMAL(10, 2), -- e.g., 0, 90, 140, 225
  max_height_cm DECIMAL(10, 2), -- e.g., 0, 90, 220, 240
  can_overlap_layers VARCHAR(200)[]; -- e.g., {'flooring', 'base'}
```

**Populate existing components:**
```sql
-- Base units
UPDATE component_3d_models SET
  layer_type = 'base',
  min_height_cm = 0,
  max_height_cm = 90,
  can_overlap_layers = ARRAY['flooring']
WHERE category = 'base-units';

-- Wall units
UPDATE component_3d_models SET
  layer_type = 'wall',
  min_height_cm = 140,
  max_height_cm = 220,
  can_overlap_layers = ARRAY['flooring', 'base', 'worktop']
WHERE category = 'wall-units';

-- Tall units
UPDATE component_3d_models SET
  layer_type = 'tall',
  min_height_cm = 0,
  max_height_cm = 220,
  can_overlap_layers = ARRAY['flooring']
WHERE category = 'tall-units';

-- Worktops
UPDATE component_3d_models SET
  layer_type = 'worktop',
  min_height_cm = 90,
  max_height_cm = 90,
  can_overlap_layers = ARRAY['flooring', 'base']
WHERE component_type = 'counter-top';

-- Finishing (cornice, pelmet)
UPDATE component_3d_models SET
  layer_type = CASE
    WHEN component_id LIKE '%cornice%' THEN 'cornice'
    WHEN component_id LIKE '%pelmet%' THEN 'pelmet'
    ELSE 'finishing'
  END,
  min_height_cm = CASE
    WHEN component_id LIKE '%cornice%' THEN 225
    WHEN component_id LIKE '%pelmet%' THEN 135
    ELSE 0
  END,
  max_height_cm = CASE
    WHEN component_id LIKE '%cornice%' THEN 240
    WHEN component_id LIKE '%pelmet%' THEN 140
    ELSE 240
  END,
  can_overlap_layers = ARRAY['flooring', 'base', 'wall', 'worktop']
WHERE category = 'finishing';
```

---

#### Phase 2: Enhanced Collision Detection Hook

**Create new hook:** `src/hooks/useCollisionDetection.ts`

```typescript
import { DesignElement } from '@/types/project';
import { useComponentMetadata } from '@/hooks/useComponentMetadata';

interface CollisionResult {
  collides: boolean;
  collidingElement?: DesignElement;
  reason?: string;
}

export const useCollisionDetection = () => {
  const { getComponentMetadata } = useComponentMetadata();

  const checkCollision = (
    newElement: DesignElement,
    existingElements: DesignElement[]
  ): CollisionResult => {
    // Get layer info for new element
    const newMeta = getComponentMetadata(newElement.component_id);
    if (!newMeta) {
      return { collides: false }; // No metadata = allow placement
    }

    for (const existing of existingElements) {
      if (existing.id === newElement.id) continue; // Skip self

      // Get layer info for existing element
      const existingMeta = getComponentMetadata(existing.component_id);
      if (!existingMeta) continue;

      // Check 2D (X/Y) overlap
      const has2DOverlap =
        newElement.x < existing.x + existing.width &&
        newElement.x + newElement.width > existing.x &&
        newElement.y < existing.y + (existing.depth || existing.height) &&
        newElement.y + (newElement.depth || newElement.height) > existing.y;

      if (!has2DOverlap) continue; // No 2D overlap = no collision

      // Check if height ranges overlap
      const newMin = newMeta.min_height_cm;
      const newMax = newMeta.max_height_cm;
      const existingMin = existingMeta.min_height_cm;
      const existingMax = existingMeta.max_height_cm;

      const hasHeightOverlap =
        newMin < existingMax && newMax > existingMin;

      if (!hasHeightOverlap) continue; // Different heights = no collision

      // Check if overlap is allowed
      const canOverlap = newMeta.can_overlap_layers?.includes(existingMeta.layer_type);

      if (!canOverlap) {
        return {
          collides: true,
          collidingElement: existing,
          reason: `${newMeta.layer_type} cannot overlap ${existingMeta.layer_type}`
        };
      }
    }

    return { collides: false };
  };

  return { checkCollision };
};
```

---

#### Phase 3: Real-Time Visual Feedback

**Update DesignCanvas2D.tsx drag handling:**

```typescript
// During drag operation (mousemove)
const handleMouseMove = (e: MouseEvent) => {
  if (!draggedElement) return;

  const roomPos = canvasToRoom(e.offsetX, e.offsetY);

  // Update dragged element position
  const updatedElement = {
    ...draggedElement,
    x: roomPos.x,
    y: roomPos.y
  };

  // Check collision
  const collision = checkCollision(
    updatedElement,
    design.elements.filter(el => el.id !== draggedElement.id)
  );

  // Visual feedback
  if (collision.collides) {
    // Draw red outline around dragged element
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);
    // Draw collision indicator

    // Optional: Highlight colliding element
    if (collision.collidingElement) {
      // Draw red highlight on element we're colliding with
    }
  } else {
    // Draw green outline (valid placement)
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
  }
};

// Prevent drop if collision
const handleMouseUp = (e: MouseEvent) => {
  if (!draggedElement) return;

  const collision = checkCollision(draggedElement, design.elements);

  if (collision.collides) {
    toast.error(`Cannot place here: ${collision.reason}`);
    // Snap back to original position
    return;
  }

  // Allow drop
  updateElementPosition(draggedElement);
};
```

---

#### Phase 4: 3D Visual Indicators

**Show collision in 3D view:**

```typescript
// In DynamicComponentRenderer.tsx or similar
const CollisionIndicator = ({ element, isColliding }) => {
  if (!isColliding) return null;

  return (
    <mesh position={[x, yPosition + height/2 + 0.1, z]}>
      <boxGeometry args={[width + 0.1, 0.05, depth + 0.1]} />
      <meshBasicMaterial color="#ff0000" transparent opacity={0.5} />
    </mesh>
  );
};
```

---

## Dead Code Analysis

### Potential Dead Code:

1. **GeometryUtils.ts** - Polygon collision detection
   - **Status:** ✅ ACTIVE - Used for complex room shapes
   - **Location:** Lines 35-386
   - **Keep:** Yes, needed for L-shaped rooms

2. **useDesignValidation.ts** - Basic collision
   - **Status:** ⚠️ WILL BE SUPERSEDED
   - **Location:** Lines 94-113
   - **Action:** Replace with enhanced layer-aware collision

3. **Bounding box code** - Previously removed
   - **Status:** ✅ ALREADY REMOVED
   - **Reference:** See previous session work

---

## Migration Strategy

### Step 1: Database Updates (Non-Breaking)
- Add layer fields to component_3d_models
- Populate existing components
- Test queries

### Step 2: Create New Hook (Parallel)
- Build useCollisionDetection hook
- Test with existing components
- Don't remove old validation yet

### Step 3: Integrate in UI (Feature Flag)
- Add feature flag: `enable_layer_collision_detection`
- Wire up real-time feedback during drag
- Keep old system as fallback

### Step 4: Validate & Deploy
- Test all component combinations
- Verify no false positives
- Enable by default

### Step 5: Cleanup
- Remove old collision code from useDesignValidation
- Update documentation
- Remove feature flag

---

## Estimated Effort

| Phase | Task | Effort | Priority |
|-------|------|--------|----------|
| 1 | Database schema | 2-3 hours | HIGH |
| 2 | Collision detection hook | 3-4 hours | HIGH |
| 3 | Real-time visual feedback | 2-3 hours | MEDIUM |
| 4 | 3D visual indicators | 1-2 hours | LOW |
| 5 | Testing & validation | 2-3 hours | HIGH |

**Total:** 10-15 hours

---

## Risks & Considerations

### 1. Performance
**Risk:** Checking collision on every mousemove could be slow
**Mitigation:**
- Use spatial indexing for large designs
- Debounce collision checks
- Only check elements in nearby area

### 2. False Positives
**Risk:** Overly strict rules prevent valid placements
**Mitigation:**
- Start with warnings, not hard blocks
- Allow override for advanced users
- Collect feedback and adjust rules

### 3. Missing Categories
**Risk:** Components not in database have no layer info
**Mitigation:**
- Fallback to basic 2D collision for unknown components
- Log missing components for manual categorization
- Default to safest rule (block overlap)

### 4. User Confusion
**Risk:** Users don't understand why placement is blocked
**Mitigation:**
- Clear error messages ("Wall units cannot overlap other wall units")
- Visual indicators (red outline, ghost preview)
- Tutorial/help system

---

## Recommended Next Steps

1. ⏳ **Review & Approve Plan** - Get user confirmation on approach
2. ⏳ **Database Migration** - Create and test schema updates
3. ⏳ **Build Collision Hook** - Implement useCollisionDetection
4. ⏳ **Add Visual Feedback** - Wire up real-time collision display
5. ⏳ **Test Thoroughly** - Validate all component type combinations
6. ⏳ **Document Rules** - Create user-facing guide on layering

---

**Status:** 📋 ANALYSIS COMPLETE - Ready for implementation planning
