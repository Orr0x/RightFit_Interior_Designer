# isVisible Field Removal - Touch Points Documentation
**Date:** 2025-10-18
**Strategy:** Comment out first, delete after testing confirms no ill effects

---

## All isVisible References Found (18 total)

### Critical Files (Need Changes)

#### 1. src/types/project.ts
**Line 122:** Type definition
```typescript
isVisible: boolean; // Whether the component is visible in the 2D plan view
```
**Action:** Comment out with note
**Risk:** LOW - TypeScript will catch any broken dependencies

---

#### 2. src/pages/Designer.tsx
**Line 243:** Comment explaining default assignment
```typescript
// Assign default zIndex and isVisible values if not already set
```
**Action:** Update comment to remove isVisible mention

**Line 248:** Default value assignment
```typescript
isVisible: element.isVisible ?? true
```
**Action:** Comment out this line

**Line 1053:** Performance monitor visibility (DIFFERENT - This is for UI component!)
```typescript
isVisible={showPerformanceMonitor}
```
**Action:** ⚠️ **DO NOT TOUCH** - This is PerformanceMonitor's UI visibility, NOT element visibility!

---

#### 3. src/components/designer/DesignCanvas2D.tsx
**Line 1958:** Global filter in rendering
```typescript
elementsToRender = elementsToRender.filter(element => element.isVisible !== false);
```
**Action:** Comment out (already filtered by hidden_elements above)

**Line 2052:** Global filter in selection
```typescript
elementsToCheck = elementsToCheck.filter(element => element.isVisible !== false);
```
**Action:** Comment out (already filtered by hidden_elements above)

**Line 2159:** Global filter in hover detection
```typescript
elementsToCheck = elementsToCheck.filter(element => element.isVisible !== false);
```
**Action:** Comment out

**Line 2467:** Global filter in drag detection
```typescript
elementsToCheck = elementsToCheck.filter(element => element.isVisible !== false);
```
**Action:** Comment out

**Line 2756:** Default value when creating snap guide
```typescript
isVisible: true // Required by DesignElement interface
```
**Action:** Comment out

---

#### 4. src/components/designer/CanvasElementCounter.tsx
**Line 88:** Toggle visibility function
```typescript
onUpdateElement(element.id, { isVisible: !element.isVisible });
```
**Action:** Comment out entire function (this is the toggle feature we don't use)

**Line 150:** Check if element is hidden
```typescript
const isHidden = !element.isVisible;
```
**Action:** Comment out

**Impact:** This component shows element count and has an unused toggle feature

---

#### 5. src/components/designer/CompactComponentSidebar.tsx
**Line 240:** Default value when dragging component
```typescript
isVisible: true // Required by DesignElement interface
```
**Action:** Comment out

---

#### 6. src/components/designer/PerformanceMonitor.tsx
**Line 23:** Interface definition (DIFFERENT!)
```typescript
isVisible?: boolean;
```
**Action:** ⚠️ **DO NOT TOUCH** - This is PerformanceMonitor's own visibility prop, NOT element visibility!

**Line 28:** Default parameter
```typescript
isVisible = false,
```
**Action:** ⚠️ **DO NOT TOUCH** - Component's own prop

**Line 116:** Conditional render
```typescript
if (!isVisible) {
```
**Action:** ⚠️ **DO NOT TOUCH** - Component's own logic

---

#### 7. src/utils/migrateElements.ts
**Line 1:** File description
```typescript
// Migration utility for existing DesignElements to add zIndex and isVisible properties
```
**Action:** Update to remove isVisible mention

**Lines 5-7:** Function documentation
```typescript
* Migrates existing DesignElement objects to include zIndex and isVisible properties
* @returns The migrated element with zIndex and isVisible properties
```
**Action:** Update documentation

**Line 13:** Default value assignment
```typescript
isVisible: element.isVisible ?? true
```
**Action:** Comment out

---

## Summary by Category

### Type Definitions (1 file)
- ✅ `src/types/project.ts` - Remove from interface

### Element Creation (3 files)
- ✅ `src/pages/Designer.tsx` - Remove default assignment
- ✅ `src/components/designer/CompactComponentSidebar.tsx` - Remove from drag creation
- ✅ `src/components/designer/DesignCanvas2D.tsx` - Remove from snap guide creation

### Filtering Logic (1 file)
- ✅ `src/components/designer/DesignCanvas2D.tsx` - 4 filter statements to remove

### UI Components (2 files)
- ✅ `src/components/designer/CanvasElementCounter.tsx` - Remove toggle feature
- ⚠️ `src/components/designer/PerformanceMonitor.tsx` - **KEEP** (different isVisible)

### Migration Utilities (1 file)
- ✅ `src/utils/migrateElements.ts` - Update or comment out

---

## ⚠️ CRITICAL: Name Collision Warning!

**PerformanceMonitor.tsx** uses `isVisible` for **its own UI visibility**, NOT element visibility!

```typescript
interface PerformanceMonitorProps {
  isVisible?: boolean;  // ← Controls if PerformanceMonitor shows on screen
  // ... other props
}
```

**DO NOT modify PerformanceMonitor.tsx!** It's a completely different use of the same property name.

---

## Safe Commenting Strategy

### Phase 1: Comment Out Type Definition

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

  // ⚠️ COMMENTED OUT 2025-10-18: Global isVisible replaced by per-view hidden_elements
  // isVisible: boolean; // Whether the component is visible in the 2D plan view

  zIndex?: number;
}
```

**Result:** TypeScript will immediately show all broken references as errors!

---

### Phase 2: Comment Out Usage Sites

#### Designer.tsx
```typescript
// ⚠️ COMMENTED OUT 2025-10-18: No longer using global isVisible
// Assign default zIndex values if not already set
const elementWithDefaults: DesignElement = {
  ...element,
  zIndex: element.zIndex ?? defaultZIndex,
  // isVisible: element.isVisible ?? true  // Using per-view hidden_elements instead
};
```

#### DesignCanvas2D.tsx - Rendering filter
```typescript
// ⚠️ COMMENTED OUT 2025-10-18: Already filtered by per-view hidden_elements above
// Filter out invisible elements
// elementsToRender = elementsToRender.filter(element => element.isVisible !== false);
```

#### DesignCanvas2D.tsx - Selection filter (line 2052)
```typescript
// ⚠️ COMMENTED OUT 2025-10-18: Already filtered by per-view hidden_elements above
// elementsToCheck = elementsToCheck.filter(element => element.isVisible !== false);
```

#### DesignCanvas2D.tsx - Hover filter (line 2159)
```typescript
// ⚠️ COMMENTED OUT 2025-10-18: Already filtered by per-view hidden_elements above
// elementsToCheck = elementsToCheck.filter(element => element.isVisible !== false);
```

#### DesignCanvas2D.tsx - Drag filter (line 2467)
```typescript
// ⚠️ COMMENTED OUT 2025-10-18: Already filtered by per-view hidden_elements above
// elementsToCheck = elementsToCheck.filter(element => element.isVisible !== false);
```

#### DesignCanvas2D.tsx - Snap guide creation (line 2756)
```typescript
const snapGuide: DesignElement = {
  id: 'snap-guide-temp',
  type: 'snap-guide',
  x: guideX,
  y: guideY,
  width: 0,
  height: 0,
  zIndex: 9999,
  // isVisible: true  // ⚠️ COMMENTED OUT 2025-10-18
};
```

#### CompactComponentSidebar.tsx (line 240)
```typescript
const newElement: DesignElement = {
  id: `${componentId}-${Date.now()}`,
  type: component.type || 'cabinet',
  component_id: componentId,
  x: Math.random() * 100,
  y: Math.random() * 100,
  width: component.default_width || 60,
  height: component.default_height || 60,
  depth: component.default_depth || 60,
  zIndex: 0,
  // isVisible: true  // ⚠️ COMMENTED OUT 2025-10-18
};
```

#### CanvasElementCounter.tsx - Toggle function (line 88)
```typescript
// ⚠️ COMMENTED OUT 2025-10-18: Global visibility toggle removed
// Use per-view hidden_elements instead
// onUpdateElement(element.id, { isVisible: !element.isVisible });
```

#### CanvasElementCounter.tsx - Hidden check (line 150)
```typescript
// ⚠️ COMMENTED OUT 2025-10-18: Using per-view hidden_elements instead
// const isHidden = !element.isVisible;
const isHidden = false;  // Temporary - element always visible globally now
```

#### migrateElements.ts
```typescript
// ⚠️ COMMENTED OUT 2025-10-18: Migration utility for old isVisible field
// Migration utility for existing DesignElements to add zIndex properties
export function migrateElement(element: any): DesignElement {
  return {
    ...element,
    zIndex: element.zIndex ?? 0,
    // isVisible: element.isVisible ?? true  // No longer used
  };
}
```

---

## Testing Checklist (After Commenting Out)

### Compilation
- [ ] Run `npx tsc --noEmit` - Should show NO errors
- [ ] If errors appear, document them before fixing

### Functional Tests
- [ ] Add new element to plan view → appears correctly
- [ ] Add element to elevation view → appears correctly
- [ ] Hide element in one view → disappears only in that view
- [ ] Show hidden element → reappears correctly
- [ ] Switch between views → elements show/hide correctly
- [ ] Delete element → removes from all views
- [ ] Refresh page → state persists correctly

### UI Components
- [ ] CanvasElementCounter renders correctly
- [ ] PerformanceMonitor shows/hides correctly (unaffected)
- [ ] CompactComponentSidebar drag-and-drop works
- [ ] PropertiesPanel hide/show button works

### Edge Cases
- [ ] Open existing design (with old isVisible data) → loads correctly
- [ ] Drag component from sidebar → creates correctly
- [ ] Snap guides appear when dragging → no errors

---

## Rollback Plan (If Issues Found)

If any issues are discovered:

1. **Do NOT delete commented code yet**
2. **Document the issue** in this file
3. **Uncomment specific lines** that are needed
4. **Investigate why** those lines are actually needed
5. **Update analysis documents** with new findings

---

## Files to Modify (Summary)

| File | Lines | Action | Risk |
|------|-------|--------|------|
| `types/project.ts` | 122 | Comment type field | LOW |
| `Designer.tsx` | 243, 248 | Comment defaults | LOW |
| `DesignCanvas2D.tsx` | 1958, 2052, 2159, 2467, 2756 | Comment filters | LOW |
| `CanvasElementCounter.tsx` | 88, 150 | Comment toggle | MEDIUM |
| `CompactComponentSidebar.tsx` | 240 | Comment default | LOW |
| `migrateElements.ts` | 1, 5-7, 13 | Comment migration | LOW |
| **DO NOT TOUCH:** `PerformanceMonitor.tsx` | - | Different isVisible! | - |

**Total Files:** 6 files to modify, 1 file to leave alone

---

## Estimated Time

| Phase | Task | Time |
|-------|------|------|
| Phase 1 | Comment out all code with notes | 30 min |
| Phase 2 | TypeScript compilation check | 5 min |
| Phase 3 | Functional testing | 15 min |
| Phase 4 | Edge case testing | 10 min |
| **Total** | **If all tests pass** | **60 min** |
| Phase 5 | Delete commented code (later) | 10 min |

---

## Next Steps

1. ✅ User approves commenting strategy
2. ⏳ Comment out code with detailed notes
3. ⏳ Test TypeScript compilation
4. ⏳ Test application functionality
5. ⏳ User tests in real usage
6. ⏳ Delete commented code after 1-2 days of stable usage

---

**Status:** ✅ TOUCH POINTS DOCUMENTED - Ready to Comment Out Code Safely
