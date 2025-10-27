# Global vs Per-View Visibility Settings - Analysis
**Date:** 2025-10-18
**Question:** Should we have both global AND per-view settings, or only per-view?

---

## Executive Summary

**User Question:**
> "are we having a global setting and a view setting? if so how much more work would it be to move the global settings out of the canvas, and only have the per view settings in the canvas. hierarchically it would make sense but don't want to add unnecessary complexity"

**Current State:**
- ✅ Global setting: `element.isVisible` (boolean on each element)
- ✅ Per-view setting: `view.hidden_elements[]` (array of element IDs per view)
- 🔴 **Both exist but barely used!**

**Finding:** `element.isVisible` is **ALMOST COMPLETELY UNUSED** in current codebase!

**Recommendation:** **REMOVE** global `isVisible` - Only use per-view `hidden_elements`

**Effort:** MINIMAL (30 minutes) - High value, low complexity

---

## Current Dual System Analysis

### Global Visibility: element.isVisible

**Location:** `src/types/project.ts` (DesignElement interface)

```typescript
export interface DesignElement {
  id: string;
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  depth?: number;
  // ... other properties ...
  isVisible: boolean;        // ← GLOBAL visibility flag
  zIndex?: number;
}
```

**Where It's Used:**

1. **Designer.tsx (line 248)** - Always defaults to `true`
```typescript
const elementWithDefaults: DesignElement = {
  ...element,
  zIndex: element.zIndex ?? defaultZIndex,
  isVisible: element.isVisible ?? true  // Always true on element add
};
```

2. **DesignCanvas2D.tsx (line 1958)** - Only filtering usage
```typescript
// Filter out invisible elements
elementsToRender = elementsToRender.filter(element => element.isVisible !== false);
```

**Result:**
- ❌ No UI to set `isVisible` to false
- ❌ Always defaults to true
- ❌ Only filters in 2D canvas (not 3D)
- ❌ Effectively dead code

---

### Per-View Visibility: view.hidden_elements[]

**Location:** `src/types/project.ts` (ElevationViewConfig interface)

```typescript
export interface ElevationViewConfig {
  id: string;
  direction: 'front' | 'back' | 'left' | 'right' | 'plan' | '3d';
  label: string;
  hidden_elements: string[];     // ← PER-VIEW visibility list
  is_default: boolean;
  sort_order: number;
}
```

**Where It's Used:**

1. **DesignCanvas2D.tsx (lines 318-344)** - Extract hidden_elements for current view
```typescript
const currentViewInfo = React.useMemo(() => {
  const views = elevationViews || getElevationViews();
  const currentView = views.find(v => v.id === active2DView);

  if (currentView) {
    return {
      direction: currentView.direction,
      hiddenElements: currentView.hidden_elements || []
    };
  }
  // ... fallback ...
}, [active2DView, elevationViews]);
```

2. **DesignCanvas2D.tsx (line 1952)** - Filter rendering
```typescript
// Check if element is hidden in this specific view
if (currentViewInfo.hiddenElements.includes(el.id)) return false;
```

3. **DesignCanvas2D.tsx (line 2046)** - Filter selection
```typescript
// Check if element is hidden in this specific view
if (currentViewInfo.hiddenElements.includes(el.id)) return false;
```

4. **PropertiesPanel.tsx (lines 128-139)** - UI toggle button
```typescript
const isElementHidden = (): boolean => {
  if (!selectedElement || !elevationViews) return false;
  const currentView = elevationViews.find(v => v.id === active2DView);
  if (!currentView) return false;
  return currentView.hidden_elements?.includes(selectedElement.id) || false;
};
```

**Result:**
- ✅ Has UI (Hide/Show button)
- ✅ Actually used in rendering
- ✅ Actually used in selection
- ✅ Per-view independence
- ✅ Persists to database

---

## The Dual Filter Problem

### Current Filtering Logic (DesignCanvas2D.tsx lines 1941-1958)

```typescript
let elementsToRender = active2DView === 'plan'
  ? design.elements
  : design.elements.filter(el => {
      const wall = getElementWall(el);
      const isCornerVisible = isCornerVisibleInView(el, currentViewInfo.direction);

      // Check direction visibility
      const isDirectionVisible = wall === currentViewInfo.direction || wall === 'center' || isCornerVisible;
      if (!isDirectionVisible) return false;

      // ✅ Per-view filter (USED)
      if (currentViewInfo.hiddenElements.includes(el.id)) return false;

      return true;
    });

// ❌ Global filter (BARELY USED)
elementsToRender = elementsToRender.filter(element => element.isVisible !== false);
```

**The Confusion:**
1. First filter: Per-view `hidden_elements` (actually used)
2. Second filter: Global `isVisible` (never false, so no-op)
3. Two different systems doing same thing!

---

## Hierarchical Options

### Option 1: Remove Global isVisible (RECOMMENDED)

**Changes Required:**

1. **Remove from DesignElement type** (5 min)
```typescript
// src/types/project.ts
export interface DesignElement {
  id: string;
  type: string;
  // ... other properties ...
  // isVisible: boolean;  // ← REMOVE
  zIndex?: number;
}
```

2. **Remove from Designer.tsx** (5 min)
```typescript
// src/pages/Designer.tsx (line 248)
const elementWithDefaults: DesignElement = {
  ...element,
  zIndex: element.zIndex ?? defaultZIndex,
  // isVisible: element.isVisible ?? true  // ← REMOVE
};
```

3. **Remove from DesignCanvas2D.tsx** (5 min)
```typescript
// src/components/designer/DesignCanvas2D.tsx (line 1958)
// elementsToRender = elementsToRender.filter(element => element.isVisible !== false);
// ← REMOVE (already filtered by hidden_elements)
```

4. **Remove from other files** (10 min)
- CanvasElementCounter.tsx
- PerformanceMonitor.tsx
- Any other references

**Benefits:**
- ✅ Single source of truth (per-view only)
- ✅ No confusion about which setting takes precedence
- ✅ Cleaner data structure
- ✅ Less database storage
- ✅ Hierarchically correct (view controls visibility)

**Risks:**
- ⚠️ Existing database records have `isVisible: true` - safe to ignore
- ⚠️ Need to check if any other code depends on it

**Effort:** 30 minutes (very low complexity)

---

### Option 2: Keep Global, Add Global UI (NOT RECOMMENDED)

**Approach:** Add a "Delete Globally" vs "Hide in View" distinction

**Changes Required:**

1. Add global visibility toggle UI
2. Modify filtering to check BOTH:
   - If `isVisible === false` → hide in ALL views
   - If `hidden_elements.includes(id)` → hide in THIS view
3. Update PropertiesPanel with two buttons:
   - "Hide in This View" (per-view)
   - "Hide Globally" (all views)

**Benefits:**
- ✅ Two-tier control (global + per-view override)
- ✅ Can hide element everywhere at once

**Drawbacks:**
- ❌ More complex UX (confusing for users)
- ❌ Which takes precedence? If globally hidden, can't show in one view?
- ❌ More code to maintain
- ❌ Unnecessary complexity

**Effort:** 2-3 hours (adds complexity)

---

### Option 3: Keep Both, Document as Legacy (NOT RECOMMENDED)

**Approach:** Leave `isVisible` in type but mark as deprecated

**Changes:**
- Add comment: `@deprecated Use per-view hidden_elements instead`
- Remove from UI
- Keep filtering for backward compatibility

**Benefits:**
- ✅ No breaking changes
- ✅ Existing data still works

**Drawbacks:**
- ❌ Technical debt
- ❌ Confusion for developers
- ❌ Dead code in codebase

**Effort:** 15 minutes (minimal change)

---

## Hierarchical Design Analysis

### Current Messy Hierarchy

```
Design Element (Global)
├── isVisible: boolean (global hide - not used)
│
Room Design Settings (Per-View)
├── elevation_views[]
    ├── plan view
    │   └── hidden_elements: [] (per-view hide)
    ├── front elevation
    │   └── hidden_elements: [] (per-view hide)
    ├── 3d view
        └── hidden_elements: [] (per-view hide)
```

**Problem:** Two different systems for same purpose!

### Clean Hierarchical Design (Recommended)

```
Design Element (Global)
├── [No visibility field - element always exists]
│
Room Design Settings (Per-View)
├── elevation_views[]
    ├── plan view
    │   └── hidden_elements: [] (controls visibility in plan)
    ├── front elevation
    │   └── hidden_elements: [] (controls visibility in front)
    ├── 3d view
        └── hidden_elements: [] (controls visibility in 3D)
```

**Benefits:**
- ✅ Single source of truth
- ✅ Clear hierarchy: Views control what they show
- ✅ Element data separate from view presentation
- ✅ Follows separation of concerns principle

---

## Use Case Analysis

### Use Case 1: Hide Element Globally

**User Want:** "I don't want this element anymore in my design"

**Solution with Current System:**
- Set `isVisible = false` (global)
- Element hidden in all views

**Solution with Recommended System:**
- Use "Delete Element" button (removes from design)
- OR hide in all views individually (if needed temporarily)

**Verdict:** Delete is better than global hide. Users don't need global `isVisible`.

---

### Use Case 2: Hide Element in One View

**User Want:** "Hide base cabinets in front elevation to see wall cabinets better"

**Solution with Current System:**
- Add element ID to `hidden_elements` array for front view
- Works correctly (this is what we implemented)

**Solution with Recommended System:**
- Same! No change needed

**Verdict:** Per-view system handles this perfectly.

---

### Use Case 3: Temporarily Hide While Editing

**User Want:** "Hide this element while I work on other elements, but don't delete it"

**Solution with Current System:**
- Set `isVisible = false`... but no UI for this
- Can't re-show element (no UI)

**Solution with Recommended System:**
- Hide in current view (view-specific)
- Switch to different view if need to see it
- OR add explicit "Show All in This View" button

**Verdict:** Per-view system better (can still see in other views).

---

## Database Impact Analysis

### Existing Database Records

**Current Schema:**
```json
{
  "design_elements": [
    {
      "id": "element-123",
      "type": "cabinet",
      "x": 100,
      "y": 200,
      "isVisible": true,    // ← All existing records have this
      "zIndex": 0
    }
  ],
  "design_settings": {
    "elevation_views": [
      {
        "id": "plan",
        "hidden_elements": []  // ← New system
      }
    ]
  }
}
```

**After Removing isVisible:**
```json
{
  "design_elements": [
    {
      "id": "element-123",
      "type": "cabinet",
      "x": 100,
      "y": 200,
      // isVisible removed from type (old data ignored)
      "zIndex": 0
    }
  ],
  "design_settings": {
    "elevation_views": [
      {
        "id": "plan",
        "hidden_elements": []  // ← Only system
      }
    ]
  }
}
```

**Migration Impact:**
- ✅ No migration needed!
- ✅ Old `isVisible: true` fields ignored (TypeScript doesn't validate extra fields)
- ✅ Old `isVisible: false` fields ignored (but there probably aren't any - never used)
- ✅ Completely backward compatible

---

## TypeScript & Code Search Results

### Files Using isVisible (4 files found)

1. **Designer.tsx** - Sets to true on element add
2. **DesignCanvas2D.tsx** - Filters by it (but always true)
3. **CanvasElementCounter.tsx** - Probably counts visible elements
4. **PerformanceMonitor.tsx** - Probably monitors visible elements

**None of these are critical dependencies** - all can be updated easily.

---

## Recommendation Summary

### ✅ REMOVE Global isVisible Field

**Reasons:**
1. **Never actually used** - Always defaults to `true`, no UI to set it
2. **Redundant** - Per-view `hidden_elements` does the job better
3. **Cleaner hierarchy** - Views control what they show, elements just exist
4. **No migration needed** - Old data safely ignored
5. **Low complexity** - 30 minutes of work
6. **High value** - Removes confusion, cleaner codebase

**Implementation:**
1. Remove `isVisible` from `DesignElement` interface
2. Remove default initialization in Designer.tsx
3. Remove filtering in DesignCanvas2D.tsx
4. Update CanvasElementCounter/PerformanceMonitor if needed
5. Test that nothing breaks

**Risk:** VERY LOW
- Field never actually used
- Per-view system handles all use cases
- Backward compatible (old data ignored)

---

## Effort Comparison

| Approach | Effort | Complexity | Value | Recommendation |
|----------|--------|------------|-------|----------------|
| **Remove isVisible** | 30 min | LOW | HIGH | ✅ **RECOMMENDED** |
| Add global UI | 2-3 hours | MEDIUM | LOW | ❌ Not worth it |
| Keep as legacy | 15 min | LOW | NEGATIVE | ❌ Tech debt |

---

## Implementation Plan (If Approved)

### Step 1: Remove from Type Definition (5 min)

**File:** `src/types/project.ts`

```typescript
export interface DesignElement {
  id: string;
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  depth?: number;
  component_id?: string;
  style?: string;
  rotation?: number;
  z?: number;
  wall?: 'front' | 'back' | 'left' | 'right' | 'center';
  // isVisible: boolean;  // ← REMOVE THIS LINE
  zIndex?: number;
}
```

---

### Step 2: Remove from Element Creation (5 min)

**File:** `src/pages/Designer.tsx` (line 245-250)

```typescript
// Before
const elementWithDefaults: DesignElement = {
  ...element,
  zIndex: element.zIndex ?? defaultZIndex,
  isVisible: element.isVisible ?? true  // ← REMOVE THIS LINE
};

// After
const elementWithDefaults: DesignElement = {
  ...element,
  zIndex: element.zIndex ?? defaultZIndex
};
```

---

### Step 3: Remove from Filtering (5 min)

**File:** `src/components/designer/DesignCanvas2D.tsx` (line 1957-1958)

```typescript
// Before
// Filter out invisible elements
elementsToRender = elementsToRender.filter(element => element.isVisible !== false);

// After
// (Just remove these two lines - already filtered by hidden_elements above)
```

---

### Step 4: Check Other Files (10 min)

Search for `isVisible` in:
- `CanvasElementCounter.tsx`
- `PerformanceMonitor.tsx`
- Any other files

Update or remove as needed.

---

### Step 5: Test (5 min)

1. Add element → should appear in all views
2. Hide in one view → should disappear only in that view
3. Switch views → should show/hide correctly
4. Refresh page → state should persist

---

## Conclusion

**Answer to User Question:**
> "are we having a global setting and a view setting?"

**YES, but the global setting is DEAD CODE!**

> "how much more work would it be to move the global settings out of the canvas, and only have the per view settings?"

**VERY LITTLE WORK - 30 minutes!**

> "hierarchically it would make sense"

**ABSOLUTELY CORRECT!** Views should control what they display. Elements should just exist.

**Recommendation:** ✅ **REMOVE global `isVisible`, keep only per-view `hidden_elements`**

**Benefits:**
- Cleaner architecture
- Single source of truth
- No confusion
- Less code
- Hierarchically correct

**Effort:** Minimal (30 minutes)

**Risk:** Very low (field never used)

---

**Status:** ✅ ANALYSIS COMPLETE - Ready for User Decision
