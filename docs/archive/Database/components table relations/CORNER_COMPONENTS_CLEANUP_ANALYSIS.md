# Corner Components Cleanup Analysis

**Date**: 2025-10-18
**Purpose**: Identify obsolete corner components for removal
**Session**: feature/database-component-cleanup

---

## Current Corner Components in Database

### CABINETS (Corner Units)

| Component ID | Name | Type | Size | Status | Action |
|--------------|------|------|------|--------|--------|
| **corner-cabinet** | Corner Base Cabinet | Base | 90×90×90cm | ✅ KEEP | Just fixed with L-shaped geometry + plinth |
| **larder-corner-unit-60** | Tall Corner Larder 60cm | Tall | 60×60×200cm | ✅ KEEP | Just fixed with L-shaped geometry + plinth |
| **larder-corner-unit-90** | Tall Corner Larder 90cm | Tall | 90×90×200cm | ✅ KEEP | Just fixed with L-shaped geometry + plinth |
| **new-corner-wall-cabinet-60** | Corner Wall Cabinet 60cm | Wall | 60×60×70cm | ✅ KEEP | Template used for larder-60, has geometry |
| **new-corner-wall-cabinet-90** | Corner Wall Cabinet 90cm | Wall | 90×90×70cm | ✅ KEEP | Template used for all others, has geometry |

### SINKS (Corner Units)

| Component ID | Name | Type | Size | Status | Action |
|--------------|------|------|------|--------|--------|
| **kitchen-sink-corner-90** | Kitchen Sink Corner 90cm | Sink | 90×50×20cm | ❓ REVIEW | L-shaped corner sink - keep? |
| **butler-sink-corner-90** | Butler Sink Corner 90cm | Sink | 90×50×25cm | ❓ REVIEW | L-shaped corner butler sink - keep? |

### OTHER CORNER ITEMS

| Component ID | Name | Type | Size | Status | Action |
|--------------|------|------|------|--------|--------|
| **desk-corner-120** | Corner Desk 120cm | Desk | 120×120×75cm | ❓ REVIEW | Office furniture, not kitchen |

---

## Analysis

### ✅ KEEP (5 components)

**Reason**: These are the working L-shaped corner cabinets with proper geometry

1. **corner-cabinet** - Base cabinet (90cm)
   - Just fixed with migration 20251018000008
   - Has 8 geometry parts (6 L-shape + 2 L-plinth)
   - Sits on floor with proper plinth

2. **larder-corner-unit-60** - Tall larder (60cm legs)
   - Just fixed with migration 20251018000008
   - Has 8 geometry parts (6 L-shape + 2 L-plinth)
   - 200cm tall, sits on floor with plinth

3. **larder-corner-unit-90** - Tall larder (90cm legs)
   - Just fixed with migration 20251018000008
   - Has 8 geometry parts (6 L-shape + 2 L-plinth)
   - 200cm tall, sits on floor with plinth

4. **new-corner-wall-cabinet-60** - Wall cabinet (60cm legs)
   - Template used for larder-60 geometry
   - Has 6 geometry parts (L-shape, no plinth)
   - Mounts at 140cm from floor

5. **new-corner-wall-cabinet-90** - Wall cabinet (90cm legs)
   - Template used for all other corner geometries
   - Has 6 geometry parts (L-shape, no plinth)
   - Mounts at 140cm from floor

### ❓ REVIEW - Sinks

**kitchen-sink-corner-90** and **butler-sink-corner-90**:
- These are L-shaped corner SINKS, not cabinets
- Different from corner cabinets (used for washing, not storage)
- Have their own geometry (sink bowl, drain, etc.)
- **Recommendation**: Keep if corner sinks are needed in kitchen designs
- **Action**: Ask user if corner sinks are used/needed

### ❓ REVIEW - Other

**desk-corner-120**:
- Office furniture (corner desk), not kitchen
- Different room type, different use case
- **Recommendation**: Keep if office/study room designs are planned
- **Action**: Ask user if desk is needed

---

## Obsolete/Deleted Components

**From previous cleanup sessions**, these were already deleted:
- l-shaped-test-cabinet-60
- l-shaped-test-cabinet-90
- l-shaped-corner-cabinet-60 (NS)
- l-shaped-corner-cabinet-60 (E/W)
- l-shaped-corner-cabinet-90 (NS)
- l-shaped-corner-cabinet-90 (E/W)

**Status**: ✅ Already removed

---

## Findings

### No Obsolete Corner CABINETS Found

All 5 corner cabinet components are needed:
- 1 base cabinet (corner-cabinet)
- 2 tall larders (60cm + 90cm)
- 2 wall cabinets (60cm + 90cm)

**All have proper L-shaped geometry and are working correctly.**

### Questions for User

1. **Corner Sinks**:
   - Do you need corner sinks in kitchen designs?
   - kitchen-sink-corner-90 (stainless steel)
   - butler-sink-corner-90 (ceramic/white)
   - If NO → delete both
   - If YES → keep both

2. **Corner Desk**:
   - Do you plan to design office/study rooms?
   - desk-corner-120 (120cm corner desk)
   - If NO → delete
   - If YES → keep

---

## Recommended Actions

### Immediate (No User Input Needed)

**NONE** - All corner cabinets are correct and needed.

### Pending User Decision

1. **If corner sinks not needed**:
   ```sql
   DELETE FROM components WHERE component_id IN (
     'kitchen-sink-corner-90',
     'butler-sink-corner-90'
   );
   ```

2. **If corner desk not needed**:
   ```sql
   DELETE FROM components WHERE component_id = 'desk-corner-120';
   ```

---

## Summary

**Corner Cabinets**: ✅ All 5 are correct and needed
- corner-cabinet (base 90cm)
- larder-corner-unit-60 (tall 60cm)
- larder-corner-unit-90 (tall 90cm)
- new-corner-wall-cabinet-60 (wall 60cm)
- new-corner-wall-cabinet-90 (wall 90cm)

**Corner Sinks**: ❓ User decision needed (2 components)
- kitchen-sink-corner-90
- butler-sink-corner-90

**Corner Desk**: ❓ User decision needed (1 component)
- desk-corner-120

**Total obsolete corner cabinets**: 0 ✅

All the corner cabinet cleanup was already completed in previous sessions when we deleted the l-shaped-test-cabinet and NS/EW variants. The current 5 corner cabinets are all properly configured with L-shaped geometry.

---

*Analysis complete - no obsolete corner cabinets found*
