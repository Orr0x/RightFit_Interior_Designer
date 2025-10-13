# Room Dimensions Naming Issue - Backlog

**Date:** 2025-10-13
**Priority:** Medium
**Type:** Technical Debt / Developer Experience
**Breaking Change:** Yes (requires migration)

---

## Problem

The `room_dimensions` JSONB field has confusing property names:

```typescript
room_dimensions: {
  width: number,      // ✅ Clear: Room width (X-axis)
  height: number,     // ❌ CONFUSING: Actually room DEPTH (Y-axis floor dimension)
  ceilingHeight: number // ✅ Clear: Actual vertical height (Z-axis)
}
```

**Issue:** `height` refers to the floor dimension (Y-axis/depth), NOT the vertical height (Z-axis).

**Confusion:**
- Developers expect `height` to mean vertical dimension
- Actually means "room depth" or "Y-axis floor dimension"
- `ceilingHeight` is the actual vertical height
- Leads to bugs and confusion during development

---

## Proposed Solution

Rename `room_dimensions.height` → `room_dimensions.depth`

**After fix:**
```typescript
room_dimensions: {
  width: number,         // Room width (X-axis)
  depth: number,         // Room depth (Y-axis) - RENAMED from "height"
  ceilingHeight: number  // Vertical height (Z-axis)
}
```

---

## Impact Assessment

### Database Migration Required

```sql
-- Step 1: Add depth field with value from height
UPDATE room_designs
SET room_dimensions = room_dimensions || jsonb_build_object('depth', room_dimensions->'height')
WHERE room_dimensions ? 'height';

-- Step 2: Verify depth was added
SELECT
  id,
  room_dimensions->>'width' as width,
  room_dimensions->>'height' as old_height,
  room_dimensions->>'depth' as new_depth,
  room_dimensions->>'ceilingHeight' as ceiling
FROM room_designs;

-- Step 3: Remove old height field (optional - can keep for backward compatibility)
-- UPDATE room_designs
-- SET room_dimensions = room_dimensions - 'height';
```

**Recommendation:** Keep both `height` and `depth` for backward compatibility during transition period.

### Code Changes Required

**Files to update:**

1. **Type Definitions:**
   - `src/types/project.ts` - RoomDimensions interface
   - Update all references to use `depth` instead of `height`

2. **Context:**
   - `src/contexts/ProjectContext.tsx` - transformRoomDesign function
   - createRoomDesign function (just updated, uses `height`)

3. **Services:**
   - `src/services/RoomService.ts` - getRoomConfiguration
   - May reference room_dimensions.height

4. **Components:**
   - `src/components/designer/DesignCanvas2D.tsx` - room dimension usage
   - `src/components/designer/AdaptiveView3D.tsx` - 3D rendering
   - `src/components/designer/RoomShapeSelector.tsx` - dimension display

5. **Utils:**
   - Any coordinate transformation that uses room dimensions
   - Search for `roomDimensions.height` pattern

### Search Pattern

```bash
# Find all references to room_dimensions height
grep -r "roomDimensions\.height" src/
grep -r "room_dimensions\['height'\]" src/
grep -r "room_dimensions->'height'" src/
grep -r "\.height\b" src/ | grep -i "room"
```

---

## Implementation Plan

### Phase 1: Add Dual Support (Backward Compatible)

1. Update RoomDimensions interface:
```typescript
interface RoomDimensions {
  width: number;
  height?: number; // @deprecated Use depth instead
  depth?: number;  // NEW: Preferred name for Y-axis
  ceilingHeight?: number;
}
```

2. Add helper function:
```typescript
function getRoomDepth(dimensions: RoomDimensions): number {
  return dimensions.depth ?? dimensions.height ?? 400; // Fallback chain
}
```

3. Update all code to use `getRoomDepth()` instead of direct access

4. Update database to add `depth` field (keep `height` for now)

**Estimated:** 1 day

### Phase 2: Deprecation Period (Optional)

1. Add console warnings when `height` is used:
```typescript
if (dimensions.height !== undefined && dimensions.depth === undefined) {
  console.warn('room_dimensions.height is deprecated. Use room_dimensions.depth instead.');
}
```

2. Update documentation

**Duration:** 1-2 weeks

### Phase 3: Remove Legacy Field (Breaking Change)

1. Update interface to remove `height?`
2. Remove `height` from database migration
3. Update all code to use `depth` directly
4. Remove helper function

**Estimated:** 2-3 hours

---

## Risks

1. **Breaking existing rooms:** Mitigated by keeping both fields during transition
2. **Third-party integrations:** If any, would need updates
3. **Export/import:** Saved designs would need migration
4. **Confusion during transition:** Clear deprecation warnings help

---

## Alternatives Considered

### Alternative 1: Leave as-is
- **Pro:** No migration needed
- **Con:** Ongoing confusion for developers
- **Decision:** Not recommended, technical debt compounds

### Alternative 2: Add `depth` as alias, keep `height`
- **Pro:** Full backward compatibility
- **Con:** Two names for same thing (more confusion)
- **Decision:** Only for transition period

### Alternative 3: Rename to `roomHeight` and `roomDepth`
- **Pro:** More explicit
- **Con:** More verbose, still requires migration
- **Decision:** `width`/`depth`/`ceilingHeight` is cleaner

---

## Current Status

- **Documented:** Yes (this file + ROOM_DATA_AUDIT_AND_DIMENSION_IMPACT.md)
- **Implemented:** No
- **Priority:** Medium (not urgent, but should fix eventually)
- **Owner:** TBD
- **Target:** Future sprint (after coordinate system work complete)

---

## Related Documents

- [ROOM_DATA_AUDIT_AND_DIMENSION_IMPACT.md](../ROOM_DATA_AUDIT_AND_DIMENSION_IMPACT.md) - Full room data audit
- [SINGLE_SOURCE_OF_TRUTH_AUDIT.md](../SINGLE_SOURCE_OF_TRUTH_AUDIT.md) - Component and room data audit

---

## Notes

- This issue was discovered during room data audit (2025-10-13)
- User approved documenting for backlog
- Can be implemented independently of dimension customization feature
- Should coordinate with any other room_dimensions changes

**Last Updated:** 2025-10-13
