# Floating Cabinet Fix - Y-Position Double Offset Bug

**Date**: 2025-10-18
**Issue**: Corner cabinets floating in 3D view despite correct geometry_parts positioning
**Root Cause**: DynamicComponentRenderer adding height/2 offset to already-positioned geometry
**Fix**: Set yPosition = 0 for base cabinets (geometry_parts handle positioning)

---

## Problem Description

User reported: *"the plynths are now L shaped and attached to the bottom of the cabinets but they are still floating and not at z 0"*

### Symptoms
- Corner cabinets appeared floating ~45cm above ground
- L-shaped plinth visible but elevated
- Cabinet body floating even higher
- Despite migration setting correct geometry_parts position_y values

---

## Root Cause Analysis

### The Bug (DynamicComponentRenderer.tsx:159)

```typescript
// BEFORE (WRONG):
const yPosition = isWallCabinet ? 2.0 - height / 2 : height / 2;
```

For a 90cm base cabinet:
- `height = 0.9m`
- `yPosition = height / 2 = 0.45m`

### The Double Offset

```
Migration sets geometry_parts:
  - Plinth position_y = 0.075 (center of 15cm plinth)
  - Cabinet position_y = height/2 + 0.15 = 0.60

Renderer adds group offset:
  - group position = [x, yPosition, z]
  - yPosition = height/2 = 0.45

ACTUAL rendering:
  - Plinth Y = 0.45 + 0.075 = 0.525m ❌ (should be 0.075!)
  - Cabinet Y = 0.45 + 0.60 = 1.05m ❌ (should be 0.60!)
```

### Why It Happened

The `yPosition = height/2` formula is correct for **procedurally generated** cabinets (hardcoded geometry in EnhancedModels3D.tsx), where:
- Box geometry is centered at origin (Y=0)
- Group offset lifts it to Y=height/2 so bottom sits at ground

But for **database-driven** cabinets (geometry_parts), each part already has `position_y` set in migration, so adding group offset **doubles** it.

---

## The Fix

### Code Change (DynamicComponentRenderer.tsx:163)

```typescript
// AFTER (CORRECT):
const yPosition = isWallCabinet ? 1.4 + height / 2 : 0;
```

**Explanation**:
- **Base cabinets**: `yPosition = 0` → geometry_parts position_y used directly
- **Wall cabinets**: `yPosition = 1.4 + height/2` → mounted at 140cm (1.4m) from floor

### Why This Works

With `yPosition = 0` for base cabinets:

```
Migration geometry_parts:
  - Plinth position_y = 0.075
  - Cabinet position_y = 0.60

Renderer group offset:
  - yPosition = 0

ACTUAL rendering:
  - Plinth Y = 0 + 0.075 = 0.075m ✅
  - Cabinet Y = 0 + 0.60 = 0.60m ✅

Result:
  - Plinth bottom at Y=0 (ground)
  - Plinth top at Y=0.15
  - Cabinet bottom at Y=0.15 (sits on plinth)
  - Cabinet center at Y=0.60
  - Cabinet top at Y=1.05 (105cm total height)
```

---

## Migration Geometry (Correct)

### Plinth Parts (2 L-shaped parts)

**Plinth X-leg**:
```typescript
dimension_height: 0.15  // 15cm
position_y: 0.075       // Center → bottom at Y=0, top at Y=0.15
```

**Plinth Z-leg**:
```typescript
dimension_height: 0.15  // 15cm
position_y: 0.075       // Center → bottom at Y=0, top at Y=0.15
```

### Cabinet Parts (6 L-shaped parts)

**All cabinet parts**:
```typescript
position_y: 'height / 2 + 0.15'
```

For 90cm base cabinet:
- `height = 0.9m`
- `position_y = 0.45 + 0.15 = 0.60`
- Bottom at Y = 0.60 - 0.45 = **0.15** (sits on plinth top)
- Top at Y = 0.60 + 0.45 = **1.05** (105cm from ground)

---

## Files Changed

### 1. DynamicComponentRenderer.tsx
**Change**: Set yPosition = 0 for base cabinets
```diff
- const yPosition = isWallCabinet ? 2.0 - height / 2 : height / 2;
+ const yPosition = isWallCabinet ? 1.4 + height / 2 : 0;
```

### 2. Migration 20251018000008
**Unchanged** - geometry_parts positioning was already correct:
- Plinth at Y=0.075 (bottom at ground)
- Cabinet at Y=height/2+0.15 (sits on plinth)

---

## Testing

After running migration (`npx supabase db reset`):

### Expected Results

1. **Corner base cabinet (corner-cabinet)**:
   - ✅ Plinth bottom touches floor (Y=0)
   - ✅ L-shaped plinth visible with 10cm toe-kick recess
   - ✅ Cabinet body sits on plinth (15cm above floor)
   - ✅ Total height: 105cm (15cm plinth + 90cm cabinet)
   - ✅ No floating geometry

2. **Tall larder (larder-corner-unit-90)**:
   - ✅ Plinth bottom touches floor (Y=0)
   - ✅ L-shaped plinth visible with toe-kick
   - ✅ 200cm tall cabinet sits on 15cm plinth
   - ✅ Total height: 215cm
   - ✅ No floating geometry

3. **Wall corner cabinet (new-corner-wall-cabinet-90)**:
   - ✅ Mounted at 140cm from floor
   - ✅ 70cm tall cabinet
   - ✅ No plinth (wall-mounted)
   - ✅ Top at 210cm from floor

### Visual Checks

- [ ] Place corner-cabinet → should touch floor
- [ ] Check plinth visibility → L-shaped, 15cm high, recessed
- [ ] Check cabinet body → starts 15cm above floor
- [ ] Measure total height → 105cm for base, 215cm for tall
- [ ] No console errors → "geometry parts found" messages

---

## Impact

### Before Fix
- All base cabinets floated 45cm above ground
- Unusable in real designs
- Plinth appeared mid-air

### After Fix
- Base cabinets sit properly on floor
- L-shaped plinth creates proper toe-kick space
- Total heights correct (105cm base, 215cm tall)
- Professional appearance

---

## Technical Notes

### Coordinate System
- **X**: left-right (width)
- **Y**: up-down (height)
- **Z**: front-back (depth)
- **Y=0**: Ground level

### Geometry Positioning
- **position_y**: Center of geometry part
- **dimension_height**: Total height of part
- **Bottom Y** = position_y - height/2
- **Top Y** = position_y + height/2

### Group Positioning
```tsx
<group position={[x, yPosition, z]}>
  <primitive object={meshGroup} />
</group>
```

All geometry_parts Y-positions are **relative to group yPosition**.

---

*Fixed in commits 387404e (plinth), afd84c0 (position), 6a967ec (renderer)*
