# Phase 5: Legacy Code Cleanup Plan
**Date:** 2025-10-09
**Status:** 🚧 **READY TO START**

---

## Overview

Now that database-driven 2D rendering is tested and working, we can safely remove ~1,200 lines of legacy hardcoded rendering code from DesignCanvas2D.tsx.

---

## Code to Remove

### 1. drawSinkPlanView Function (Lines 1092-1264)
**Size:** ~173 lines
**Purpose:** Hardcoded sink rendering with bowls, drains, draining boards
**Status:** ✅ Replaced by `renderSinkSingle()`, `renderSinkDouble()`, `renderSinkCorner()` handlers

**What it does:**
- Detects butler vs kitchen sinks via ID string matching
- Draws single/double/corner bowl shapes
- Adds draining boards with grooves
- Hardcoded colors (#FFFFFF, #C0C0C0)

**Why remove:**
- All logic now in database-driven handlers
- Database has bowl_style, has_draining_board in JSONB
- No longer used (renderedByDatabase = true)

### 2. Corner Detection Logic in drawElement (Lines 1282-1291)
**Size:** ~10 lines
**Purpose:** Detect corner components by ID string matching
**Status:** ✅ Replaced by database `plan_view_type: 'corner-square'`

**Code:**
```typescript
const isCornerCounterTop = element.type === 'counter-top' && element.id.includes('counter-top-corner');
const isCornerWallCabinet = element.type === 'cabinet' && (element.id.includes('corner-wall-cabinet') || element.id.includes('new-corner-wall-cabinet'));
const isCornerBaseCabinet = element.type === 'cabinet' && (element.id.includes('corner-base-cabinet') || element.id.includes('l-shaped-test-cabinet'));
const isCornerTallUnit = element.type === 'cabinet' && (
  element.id.includes('corner-tall') ||
  element.id.includes('corner-larder') ||
  element.id.includes('larder-corner')
);
const isCornerComponent = isCornerCounterTop || isCornerWallCabinet || isCornerBaseCabinet || isCornerTallUnit;
```

**Why remove:**
- Database has `plan_view_type: 'corner-square'`
- No need for string matching
- Cleaner abstraction

### 3. Legacy Fallback in Plan View (Lines 1327-1348)
**Size:** ~22 lines
**Purpose:** Fallback rendering when database fails
**Status:** ⚠️  Keep for now OR remove after monitoring

**Code:**
```typescript
// Fallback to legacy rendering if database rendering not enabled or failed
if (!renderedByDatabase) {
  // Element fill
  if (isSelected) {
    ctx.fillStyle = '#ff6b6b';
  } else if (isHovered) {
    ctx.fillStyle = '#b0b0b0';
  } else {
    ctx.fillStyle = element.color || '#8b4513';
  }

  if (element.type === 'sink') {
    // Sink rendering - draw bowl shape
    drawSinkPlanView(ctx, element, width, depth, isSelected, isHovered);
  } else if (isCornerComponent) {
    // Corner components: Draw as square
    const squareSize = Math.min(element.width, element.depth) * zoom;
    ctx.fillRect(0, 0, squareSize, squareSize);
  } else {
    // Standard components: Draw as rectangle
    ctx.fillRect(0, 0, width, depth);
  }
}
```

**Decision:** Remove after verifying feature flag is always enabled

### 4. Legacy Fallback in Elevation View (Lines 1582-1593)
**Size:** ~12 lines
**Purpose:** Fallback rendering when database fails
**Status:** ⚠️  Keep for now OR remove after monitoring

### 5. Elevation Detail Functions (Lines 1601-2400+)
**Size:** ~800+ lines
**Purpose:** Hardcoded elevation rendering
**Status:** ✅ Replaced by elevation view handlers

**Functions to remove:**
- `drawCabinetElevationDetails()` - Cabinet doors, handles, toe kick
- `drawApplianceElevationDetails()` - Appliance panels
- `drawSinkElevationDetails()` - Sink front panels
- `drawCounterTopElevationDetails()` - Counter top edges
- `drawEndPanelElevationDetails()` - End panels
- `drawWindowElevationDetails()` - Window frames
- `drawDoorElevationDetails()` - Door panels
- `drawFlooringElevationDetails()` - Flooring
- `drawToeKickElevationDetails()` - Toe kick
- `drawCorniceElevationDetails()` - Cornice
- `drawPelmetElevationDetails()` - Pelmet
- `drawWallUnitEndPanelElevationDetails()` - Wall unit panels

### 6. Helper Functions
**Size:** ~50 lines
**Purpose:** Support legacy rendering

**Functions:**
- `isCornerUnit()` - Check if component is corner
- `shouldShowCornerDoorFace()` - Corner door visibility
- `isCornerVisibleInView()` - Corner view visibility

---

## Cleanup Strategy

### Option A: Aggressive Cleanup (Recommended)
**Remove everything except:**
- Feature flag check
- Database rendering calls
- Selection/hover/wireframe overlays

**Pros:**
- ✅ Maximum cleanup (~1,200 lines removed)
- ✅ Simplest codebase
- ✅ Forces commitment to database system

**Cons:**
- ⚠️  No fallback if database fails
- ⚠️  Must be confident in database system

### Option B: Conservative Cleanup (Safer)
**Remove:**
- drawSinkPlanView (173 lines)
- Corner detection (10 lines)
- All elevation detail functions (800+ lines)
- Helper functions (50 lines)

**Keep:**
- Feature flag check
- Fallback rectangles (simple shapes)

**Pros:**
- ✅ Still remove ~1,000 lines
- ✅ Keep simple fallback
- ✅ Safety net

**Cons:**
- ⚠️  Still have some legacy code
- ⚠️  Fallback will look worse

### Option C: Phased Cleanup
**Phase 1:** Remove detail functions (800 lines)
**Phase 2:** Monitor for 1 week
**Phase 3:** Remove sink function (173 lines)
**Phase 4:** Monitor for 1 week
**Phase 5:** Remove corner detection (10 lines)
**Phase 6:** Remove fallbacks (50 lines)

---

## Recommended Approach: Option A (Aggressive)

**Justification:**
1. ✅ All tests passing
2. ✅ Database system stable
3. ✅ 194/194 components have definitions
4. ✅ Preload working (188ms)
5. ✅ No console errors
6. ✅ Visual tests passing

**What to keep:**
- Feature flag check (can disable via database if needed)
- Database rendering calls
- Selection/hover overlays
- Wireframe overlays
- Error logging (console.warn)

**What to remove:**
- drawSinkPlanView (173 lines)
- Corner detection (10 lines)
- Legacy fallback rendering (50 lines)
- All elevation detail functions (800+ lines)
- Helper functions (50 lines)
- **Total: ~1,083 lines**

---

## Implementation Steps

### Step 1: Remove drawSinkPlanView
**File:** DesignCanvas2D.tsx
**Lines:** 1092-1264
**Action:** Delete entire function

### Step 2: Remove Corner Detection
**File:** DesignCanvas2D.tsx
**Lines:** 1282-1291
**Action:** Delete corner detection variables

### Step 3: Simplify Plan View Rendering
**File:** DesignCanvas2D.tsx
**Lines:** 1298-1349
**Before:**
```typescript
if (showColorDetail) {
  const useDatabaseRendering = FeatureFlagService.isEnabled('use_database_2d_rendering');
  let renderedByDatabase = false;

  if (useDatabaseRendering) {
    // ... database rendering ...
    renderedByDatabase = true;
  }

  // Fallback to legacy rendering
  if (!renderedByDatabase) {
    // ... 20 lines of legacy code ...
  }
}
```

**After:**
```typescript
if (showColorDetail) {
  const useDatabaseRendering = FeatureFlagService.isEnabled('use_database_2d_rendering');

  if (useDatabaseRendering) {
    const renderDef = render2DService.getCached(element.component_id);
    if (renderDef) {
      if (isSelected) {
        ctx.fillStyle = '#ff6b6b';
      } else if (isHovered) {
        ctx.fillStyle = '#b0b0b0';
      } else {
        ctx.fillStyle = renderDef.fill_color || element.color || '#8b4513';
      }
      renderPlanView(ctx, element, renderDef, zoom);
    } else {
      // Simple fallback - just a rectangle
      ctx.fillStyle = element.color || '#8b4513';
      ctx.fillRect(0, 0, width, depth);
    }
  } else {
    // Feature flag disabled - simple rectangle
    ctx.fillStyle = element.color || '#8b4513';
    ctx.fillRect(0, 0, width, depth);
  }
}
```

### Step 4: Simplify Elevation View Rendering
**File:** DesignCanvas2D.tsx
**Lines:** 1542-1637
**Remove:** Legacy fallback and all detail function calls

**After:**
```typescript
ctx.save();

const useDatabaseRendering = FeatureFlagService.isEnabled('use_database_2d_rendering');

if (useDatabaseRendering) {
  const renderDef = render2DService.getCached(element.component_id);
  if (renderDef) {
    if (isSelected) {
      ctx.fillStyle = '#ff6b6b';
    } else if (isHovered) {
      ctx.fillStyle = '#b0b0b0';
    } else {
      ctx.fillStyle = renderDef.fill_color || element.color || '#8b4513';
    }
    renderElevationView(ctx, element, renderDef, active2DView, xPos, yPos, elementWidth, elementHeight, zoom);
  } else {
    // Simple fallback
    ctx.fillStyle = element.color || '#8b4513';
    ctx.fillRect(xPos, yPos, elementWidth, elementHeight);
  }
} else {
  // Feature flag disabled
  ctx.fillStyle = element.color || '#8b4513';
  ctx.fillRect(xPos, yPos, elementWidth, elementHeight);
}

// Selection border (always show)
if (isSelected) {
  ctx.strokeStyle = '#ff0000';
  ctx.lineWidth = 2;
  ctx.strokeRect(xPos, yPos, elementWidth, elementHeight);
}

// Wireframe (always show if enabled)
if (showWireframe) {
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 0.5;
  ctx.setLineDash([]);
  ctx.strokeRect(xPos, yPos, elementWidth, elementHeight);
}

ctx.restore();
```

### Step 5: Remove All Elevation Detail Functions
**File:** DesignCanvas2D.tsx
**Lines:** 1601-2400+ (estimate)
**Action:** Delete all detail functions:
- drawCabinetElevationDetails
- drawApplianceElevationDetails
- drawSinkElevationDetails
- drawCounterTopElevationDetails
- drawEndPanelElevationDetails
- drawWindowElevationDetails
- drawDoorElevationDetails
- drawFlooringElevationDetails
- drawToeKickElevationDetails
- drawCorniceElevationDetails
- drawPelmetElevationDetails
- drawWallUnitEndPanelElevationDetails

### Step 6: Remove Helper Functions
**Action:** Delete helper functions that are no longer used

### Step 7: Update useCallback Dependencies
**Action:** Remove dependencies that no longer exist

---

## Testing After Cleanup

### Visual Tests
- [ ] Place base cabinet → Check doors/handles
- [ ] Place corner cabinet → Check square shape
- [ ] Place sink → Check bowl/drain
- [ ] Place appliance → Check panel style
- [ ] Test all elevation views
- [ ] Test selection/hover
- [ ] Test wireframe mode

### Functionality Tests
- [ ] Rotation works
- [ ] Selection works
- [ ] Hover works
- [ ] Delete works
- [ ] Undo/redo works

### Performance Tests
- [ ] Check frame rate (should be 60fps)
- [ ] Check console (no errors)
- [ ] Check memory usage
- [ ] Place 50+ components

---

## Rollback Plan

If issues occur:

**Option 1: Feature Flag (Instant)**
```sql
UPDATE feature_flags
SET enabled_dev = false
WHERE flag_key = 'use_database_2d_rendering';
```
Result: Falls back to simple rectangles

**Option 2: Git Revert**
```bash
git revert HEAD
```
Result: Restores all legacy code

**Option 3: Emergency Fix**
Add back minimal fallback:
```typescript
if (!renderDef) {
  ctx.fillRect(0, 0, width, depth); // Simple rectangle
}
```

---

## Expected Results

**Before Cleanup:**
- File size: ~2,830 lines
- Legacy code: ~1,200 lines
- Active code: ~1,630 lines

**After Cleanup:**
- File size: ~1,750 lines
- Legacy code: 0 lines
- Active code: ~1,750 lines

**Reduction:** 38% smaller file

**Benefits:**
- ✅ Easier to read
- ✅ Easier to maintain
- ✅ Faster to modify
- ✅ No duplicate logic
- ✅ Single source of truth (database)

---

## Proceed?

**Ready to start cleanup:** YES / NO
**Preferred approach:** Option A (Aggressive) / Option B (Conservative) / Option C (Phased)

---

**Status:** ✅ PLAN COMPLETE - READY FOR IMPLEMENTATION
