# L-Shaped Plinth Fix for Corner Units

**Date**: 2025-10-18
**Migration**: 20251018000008 (updated)
**Issue**: Floating cabinets with rectangular plinth

---

## Problems Identified

1. **Cabinets floating in air**: Wall cabinet geometry uses `position_y: 0` which centers parts on Y-axis. When cloned to base/tall units, this made them float.

2. **Rectangular plinth**: Original migration used single rectangular box for plinth, but corner units are **L-shaped**, so plinth must match footprint.

3. **Not on ground**: Plinth at Y=0 but cabinet body also at Y=0 (centered) meant bottom of cabinet was at Y = -height/2.

---

## Solution

### L-Shaped Plinth (2 Parts)

Instead of 1 rectangular plinth, create **2 plinth parts** forming an L:

1. **Plinth X-leg** (horizontal leg of L)
   - Width: `legLength - 0.1` (10cm narrower - recessed)
   - Height: `0.15` (15cm standard plinth)
   - Depth: `cornerDepth - 0.1` (10cm shallower - recessed)
   - Position X: `0`
   - Position Y: `0.075` (center of 15cm plinth)
   - Position Z: `cornerDepth / 2 - legLength / 2 + 0.05` (matches cabinet, recessed)

2. **Plinth Z-leg** (vertical leg of L)
   - Width: `cornerDepth - 0.1` (10cm narrower - recessed)
   - Height: `0.15` (15cm standard plinth)
   - Depth: `legLength - 0.1` (10cm shallower - recessed)
   - Position X: `cornerDepth / 2 - legLength / 2 + 0.05` (matches cabinet, recessed)
   - Position Y: `0.075` (center of 15cm plinth)
   - Position Z: `0`

### Cabinet Body Raised

All 6 cabinet parts (X-leg, Z-leg, doors, handles) raised by plinth height:

```
position_y = height / 2 + 0.15
```

**For base cabinet (height = 0.9m)**:
- Bottom of cabinet: Y = 0.15 (sits on plinth)
- Center of cabinet: Y = 0.45 + 0.15 = 0.60
- Top of cabinet: Y = 0.90 + 0.15 = 1.05 (105cm from ground)

**For tall larder (height = 2.0m)**:
- Bottom of cabinet: Y = 0.15 (sits on plinth)
- Center of cabinet: Y = 1.0 + 0.15 = 1.15
- Top of cabinet: Y = 2.0 + 0.15 = 2.15 (215cm from ground)

---

## Visual Structure

```
Side View (Y-axis):
     ┌─────────────┐
     │             │  Top of cabinet (base: 105cm, tall: 215cm)
     │             │
     │   Cabinet   │
     │    Body     │  Height: 90cm (base) or 200cm (tall)
     │             │
     │             │
     └─────────────┘  Y = 0.15 (bottom of cabinet, top of plinth)
     └───────────┘    Plinth: 15cm (recessed 10cm for toe-kick)
═══════════════════  Y = 0 (ground level)
```

Top View (X-Z plane):
```
    Z-leg cabinet
         │
         │
    ┌────┴────┐
    │         │
────┤  Corner ├──── X-leg cabinet
    │         │
    └─────────┘

    Plinth underneath (same L-shape, recessed 10cm)
```

---

## Part Counts

| Component | Cabinet Parts | Plinth Parts | Total |
|-----------|---------------|--------------|-------|
| corner-cabinet (base) | 6 | 2 | **8** |
| larder-corner-unit-60 (tall) | 6 | 2 | **8** |
| larder-corner-unit-90 (tall) | 6 | 2 | **8** |
| new-corner-wall-cabinet-60 (wall) | 6 | 0 | **6** |
| new-corner-wall-cabinet-90 (wall) | 6 | 0 | **6** |

---

## Expected Results

After running migration:

1. ✅ Corner units sit **on the floor** (not floating)
2. ✅ **L-shaped plinth** visible at bottom (recessed for toe-kick)
3. ✅ Cabinet body sits **on top of plinth** (15cm above ground)
4. ✅ Total height correct:
   - Base: 90cm cabinet + 15cm plinth = 105cm total
   - Tall: 200cm cabinet + 15cm plinth = 215cm total
5. ✅ Toe-kick space visible (10cm recess)

---

## Testing

Run migration:
```bash
npx supabase db reset
```

Place in 3D view:
- `corner-cabinet` → should be 105cm total (90cm visible + 15cm plinth)
- `larder-corner-unit-90` → should be 215cm total (200cm visible + 15cm plinth)

Check:
- [ ] Units sit on floor (Y=0 at bottom of plinth)
- [ ] L-shaped plinth visible at bottom
- [ ] 10cm toe-kick recess visible
- [ ] Cabinet body sits 15cm above ground
- [ ] No floating geometry
- [ ] Console shows no geometry errors

---

*Fixed in commit 5edb9f4*
