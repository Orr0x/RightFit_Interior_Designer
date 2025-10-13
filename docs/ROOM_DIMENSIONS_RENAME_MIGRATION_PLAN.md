# Room Dimensions Legacy Naming Fix - Complete Migration Plan
**Date:** 2025-10-13
**Priority:** HIGH - Foundation issue blocking coordinate refactor
**Type:** Breaking Change

---

## Executive Summary

**The Problem:** `RoomDimensions.height` doesn't mean height - it means **Y-axis depth**!

This ADHD-era legacy naming causes confusion throughout the entire codebase and must be fixed before the coordinate system refactor.

**The Solution:** Rename everything:
- `height` → `depth` (Y-axis floor dimension)
- `ceilingHeight` → `height` (Z-axis vertical dimension)

**Impact:** 40+ files, 1 database migration, 1 breaking change

---

## Current State (Legacy/WRONG)

### Database Schema
```sql
-- Line 25 in 20250908160000_create_multi_room_schema.sql
room_dimensions JSONB NOT NULL DEFAULT '{"width": 400, "height": 300}'
```

### TypeScript Interface
```typescript
// src/types/project.ts:43-47
export interface RoomDimensions {
  width: number;        // X-axis ✅ Correct
  height: number;       // Y-axis ❌ WRONG NAME! Should be "depth"
  ceilingHeight?: number; // Z-axis ❌ WRONG NAME! Should be "height"
}
```

### Usage Example (Confusing!)
```typescript
// Everywhere in the codebase:
const roomDepth = roomDimensions.height; // ❌ Says "height" but means "depth"
const roomHeight = roomDimensions.ceilingHeight; // ❌ Says "ceiling" but means "height"
```

---

## Target State (Correct/Clear)

### Database Schema
```sql
room_dimensions JSONB NOT NULL DEFAULT '{"width": 400, "depth": 300, "height": 250}'
```

### TypeScript Interface
```typescript
export interface RoomDimensions {
  width: number;   // X-axis (left-to-right) ✅
  depth: number;   // Y-axis (front-to-back) ✅ RENAMED from "height"
  height: number;  // Z-axis (floor-to-ceiling) ✅ RENAMED from "ceilingHeight"
}
```

### Usage Example (Clear!)
```typescript
const roomWidth = roomDimensions.width;   // X-axis
const roomDepth = roomDimensions.depth;   // Y-axis
const roomHeight = roomDimensions.height; // Z-axis
```

---

## Migration Strategy

### Option A: Big Bang Migration (RECOMMENDED)
**Pros:**
- Clean break, no legacy baggage
- Simpler codebase after migration
- Forced to fix everything at once

**Cons:**
- More risky
- Requires thorough testing
- All changes must be deployed together

**Timeline:** 1 day

### Option B: Gradual Migration
**Pros:**
- Lower risk
- Can test incrementally
- Backward compatible during transition

**Cons:**
- More complex code (dual support)
- Longer timeline
- More confusing during transition

**Timeline:** 1 week

**Decision:** **Option A** - User wants to "loose all record of the legacy incorrect setup"

---

## Implementation Plan

### Step 1: Database Migration (SQL)

Create migration: `20250113000002_fix_room_dimensions_naming.sql`

```sql
-- ================================================================
-- Room Dimensions Naming Fix Migration
-- Renames: height→depth, ceilingHeight→height
-- BREAKING CHANGE: Requires frontend deployment
-- ================================================================

BEGIN;

-- Add migration tracking
ALTER TABLE room_designs ADD COLUMN IF NOT EXISTS dimensions_migrated BOOLEAN DEFAULT FALSE;

-- Step 1: Add new 'depth' field with value from old 'height'
UPDATE room_designs
SET room_dimensions = jsonb_set(
  room_dimensions,
  '{depth}',
  room_dimensions->'height'
)
WHERE room_dimensions ? 'height'
  AND NOT room_dimensions ? 'depth';

-- Step 2: Rename 'ceilingHeight' to 'height' (if it exists)
UPDATE room_designs
SET room_dimensions =
  -- Remove old 'ceilingHeight' and add new 'height'
  (room_dimensions - 'ceilingHeight') ||
  jsonb_build_object('height', COALESCE(room_dimensions->'ceilingHeight', '250'::jsonb))
WHERE room_dimensions ? 'ceilingHeight';

-- Step 3: Add default 'height' for rows that don't have ceilingHeight
UPDATE room_designs
SET room_dimensions = room_dimensions || '{"height": 250}'::jsonb
WHERE NOT room_dimensions ? 'height';

-- Step 4: Remove old 'height' field (now replaced by 'depth')
UPDATE room_designs
SET room_dimensions = room_dimensions - 'height'
WHERE room_dimensions ? 'height'
  AND room_dimensions ? 'depth';

-- Step 5: Mark as migrated
UPDATE room_designs SET dimensions_migrated = TRUE;

-- Step 6: Update default value for new rooms
ALTER TABLE room_designs
ALTER COLUMN room_dimensions
SET DEFAULT '{"width": 400, "depth": 300, "height": 250}';

-- Verification query
DO $$
DECLARE
  total_rooms INTEGER;
  migrated_rooms INTEGER;
  sample_room JSONB;
BEGIN
  SELECT COUNT(*) INTO total_rooms FROM room_designs;
  SELECT COUNT(*) INTO migrated_rooms FROM room_designs WHERE dimensions_migrated = TRUE;
  SELECT room_dimensions INTO sample_room FROM room_designs LIMIT 1;

  RAISE NOTICE 'Migration complete:';
  RAISE NOTICE '  Total rooms: %', total_rooms;
  RAISE NOTICE '  Migrated: %', migrated_rooms;
  RAISE NOTICE '  Sample room_dimensions: %', sample_room;

  -- Validate structure
  IF sample_room ? 'height' AND NOT (sample_room ? 'ceilingHeight') THEN
    RAISE NOTICE '  ✅ Old "height" field removed';
    RAISE NOTICE '  ✅ Old "ceilingHeight" renamed to "height"';
  ELSE
    RAISE EXCEPTION 'Migration validation failed!';
  END IF;

  IF sample_room ? 'depth' THEN
    RAISE NOTICE '  ✅ New "depth" field added';
  ELSE
    RAISE EXCEPTION 'Migration validation failed - depth field missing!';
  END IF;
END $$;

COMMIT;

-- Post-migration validation
SELECT
  id,
  room_dimensions->>'width' as width,
  room_dimensions->>'depth' as depth,
  room_dimensions->>'height' as height,
  CASE
    WHEN room_dimensions ? 'ceilingHeight' THEN '❌ OLD FIELD STILL EXISTS'
    ELSE '✅ Clean'
  END as status
FROM room_designs
LIMIT 10;
```

---

### Step 2: TypeScript Interface Update

**File:** [src/types/project.ts:43-47](src/types/project.ts#L43-L47)

```typescript
// ❌ REMOVE THIS
export interface RoomDimensions {
  width: number;        // in cm - room width (X-axis)
  height: number;       // in cm - room depth (Y-axis, called "height" for legacy compatibility)
  ceilingHeight?: number; // in cm - room ceiling height (Z-axis), optional for backward compatibility
}

// ✅ REPLACE WITH THIS
export interface RoomDimensions {
  width: number;   // Room width in cm (X-axis: left-to-right)
  depth: number;   // Room depth in cm (Y-axis: front-to-back)
  height: number;  // Room height in cm (Z-axis: floor-to-ceiling)
}
```

---

### Step 3: Update All Code References (40 files)

**Files requiring changes:**

#### Core Files (HIGH PRIORITY)
1. ✅ `src/types/project.ts` - Interface definition
2. ⚠️ `src/components/designer/DesignCanvas2D.tsx` - Canvas rendering
3. ⚠️ `src/utils/PositionCalculation.ts` - Elevation positioning
4. ⚠️ `src/components/3d/DynamicComponentRenderer.tsx` - 3D rendering
5. ⚠️ `src/components/designer/PropertiesPanel.tsx` - Properties display
6. ⚠️ `src/services/2d-renderers/elevation-view-handlers.ts` - Elevation views
7. ⚠️ `src/components/3d/EnhancedModels3D.tsx` - 3D models
8. ⚠️ `src/components/3d/ComplexRoomGeometry.tsx` - Room geometry
9. ⚠️ `src/components/designer/AdaptiveView3D.tsx` - 3D adaptive view
10. ⚠️ `src/utils/canvasCoordinateIntegration.ts` - Coordinate transforms
11. ⚠️ `src/utils/cornerDetection.ts` - Corner detection
12. ⚠️ `src/services/CoordinateTransformEngine.ts` - Transform engine
13. ⚠️ `src/components/designer/StatusBar.tsx` - Status display
14. ⚠️ `src/hooks/useDesignValidation.ts` - Validation logic
15. ⚠️ `src/hooks/useRoomTemplate.ts` - Room templates
16. ⚠️ `src/services/RoomService.ts` - Room service
17. ⚠️ `src/types/RoomGeometry.ts` - Room geometry types
18. ⚠️ `src/pages/Designer.tsx` - Designer page
19. ⚠️ `src/components/designer/MobileDesignerLayout.tsx` - Mobile layout

#### Documentation Files (LOW PRIORITY)
20-40. Various docs in `docs/` folder - Update for accuracy

---

### Step 4: Search & Replace Pattern

**Search for:**
```typescript
roomDimensions.height      → roomDimensions.depth
roomDimensions.ceilingHeight → roomDimensions.height
room_dimensions->>'height'   → room_dimensions->>'depth'
room_dimensions->'height'    → room_dimensions->'depth'
dimensions.height            → dimensions.depth (context-dependent!)
dimensions.ceilingHeight     → dimensions.height
```

**⚠️ IMPORTANT:** Must be careful with `element.height` (component height) vs `roomDimensions.height`!

---

## Automated Fix Script

```typescript
// migration-helper.ts - Run this to find all instances

import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

interface Finding {
  file: string;
  line: number;
  code: string;
  context: 'roomDimensions' | 'element' | 'component' | 'unknown';
}

function analyzeFile(filePath: string): Finding[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const findings: Finding[] = [];

  lines.forEach((line, index) => {
    // Look for .height references
    if (line.includes('.height') && !line.includes('//')) {
      let context: Finding['context'] = 'unknown';

      if (line.includes('roomDimensions.height')) {
        context = 'roomDimensions';
      } else if (line.includes('element.height')) {
        context = 'element';
      } else if (line.includes('component.height')) {
        context = 'component';
      }

      findings.push({
        file: filePath,
        line: index + 1,
        code: line.trim(),
        context
      });
    }

    // Look for ceilingHeight references
    if (line.includes('ceilingHeight') && !line.includes('//')) {
      findings.push({
        file: filePath,
        line: index + 1,
        code: line.trim(),
        context: 'roomDimensions'
      });
    }
  });

  return findings;
}

// Run analysis
const files = glob.sync('src/**/*.{ts,tsx}', { ignore: '**/node_modules/**' });
const allFindings: Finding[] = [];

files.forEach(file => {
  const findings = analyzeFile(file);
  allFindings.push(...findings);
});

// Group by context
const byContext = {
  roomDimensions: allFindings.filter(f => f.context === 'roomDimensions'),
  element: allFindings.filter(f => f.context === 'element'),
  component: allFindings.filter(f => f.context === 'component'),
  unknown: allFindings.filter(f => f.context === 'unknown')
};

console.log('Room Dimensions Migration Analysis:');
console.log('=====================================');
console.log(`Total findings: ${allFindings.length}`);
console.log(`  roomDimensions.height: ${byContext.roomDimensions.length} (MUST FIX)`);
console.log(`  element.height: ${byContext.element.length} (LEAVE AS-IS)`);
console.log(`  component.height: ${byContext.component.length} (LEAVE AS-IS)`);
console.log(`  unknown context: ${byContext.unknown.length} (REVIEW MANUALLY)`);
console.log('');

// Output findings
byContext.roomDimensions.forEach(f => {
  console.log(`${f.file}:${f.line}`);
  console.log(`  ${f.code}`);
});
```

---

## Testing Plan

### Pre-Migration Tests
1. ✅ Export existing room data as JSON backup
2. ✅ Document current room dimensions for test rooms
3. ✅ Take screenshots of plan + elevation views

### Post-Migration Tests
1. ⚠️ Database: Verify all rooms have `{width, depth, height}` structure
2. ⚠️ Database: Verify no rooms have old `ceilingHeight` field
3. ⚠️ TypeScript: Verify no compilation errors
4. ⚠️ Runtime: Load existing room design
5. ⚠️ Runtime: Create new room design
6. ⚠️ Visual: Compare screenshots (should be identical)
7. ⚠️ Coordinates: Verify element positions unchanged
8. ⚠️ Elevation: Verify elevation views match plan view
9. ⚠️ 3D: Verify 3D room geometry correct
10. ⚠️ Properties: Verify room properties display correct values

### Regression Tests
- Component placement (drag & drop)
- Wall snapping
- Rotation logic
- Elevation view positioning
- 3D rendering
- Room templates
- Room geometry (complex shapes)

---

## Rollback Plan

### If Migration Fails:

**Database Rollback:**
```sql
BEGIN;

-- Restore old structure
UPDATE room_designs
SET room_dimensions =
  jsonb_build_object(
    'width', room_dimensions->'width',
    'height', room_dimensions->'depth',  -- depth back to height
    'ceilingHeight', room_dimensions->'height'  -- height back to ceilingHeight
  );

-- Restore old default
ALTER TABLE room_designs
ALTER COLUMN room_dimensions
SET DEFAULT '{"width": 400, "height": 300}';

COMMIT;
```

**Code Rollback:**
```bash
git revert <commit-hash>
npm run build
npm run deploy
```

---

## Deployment Plan

### Step 1: Database Migration (OFF-PEAK HOURS)
```bash
# 1. Backup database
npx supabase db dump -f backup-pre-dimensions-fix.sql

# 2. Run migration
npx supabase migration up

# 3. Verify migration
npx supabase db psql -c "SELECT room_dimensions FROM room_designs LIMIT 5;"
```

### Step 2: Deploy Frontend (IMMEDIATELY AFTER DB)
```bash
# 1. Build with new interface
npm run build

# 2. Deploy
npm run deploy

# 3. Verify deployment
curl https://app.example.com/health
```

### Step 3: Monitor (1 HOUR)
- Watch error logs
- Check Sentry for runtime errors
- Test key user flows
- Have rollback script ready

---

## Communication Plan

### Before Migration
**Email users:**
> We're performing a system upgrade to improve coordinate accuracy.
> The app will be unavailable for approximately 15 minutes on [DATE] at [TIME].
> No action required - your designs will be automatically updated.

### During Migration
**Status page:**
> 🔧 Maintenance in progress - Upgrading room coordinate system
> Expected completion: [TIME]

### After Migration
**In-app notification:**
> ✅ System upgrade complete! Room coordinates are now more accurate.
> If you notice any issues, please contact support.

---

## Risk Assessment

### High Risk
1. ⚠️ **Database migration fails mid-update**
   - Mitigation: Transaction with rollback
   - Mitigation: Full database backup

2. ⚠️ **Frontend deployed before database migration**
   - Mitigation: Deploy database FIRST, then frontend
   - Mitigation: Feature flag to enable new interface

3. ⚠️ **Existing rooms load with wrong dimensions**
   - Mitigation: Extensive testing on staging
   - Mitigation: Validation query in migration

### Medium Risk
4. ⚠️ **Third-party integrations break**
   - Mitigation: API version compatibility layer
   - Mitigation: Deprecation warnings

5. ⚠️ **Export/import breaks**
   - Mitigation: Support both formats during transition
   - Mitigation: Auto-migration on import

### Low Risk
6. ⚠️ **Documentation out of sync**
   - Mitigation: Update docs as part of PR
   - Mitigation: Automated doc generation

---

## Success Criteria

✅ **Database:**
- All rooms have `{width, depth, height}` structure
- No rooms have `ceilingHeight` field
- Default value uses new structure

✅ **Code:**
- Zero compilation errors
- Zero runtime errors in logs (24 hours)
- All tests passing

✅ **Visual:**
- Existing rooms render identically
- New rooms use correct dimensions
- Elevation views match plan view

✅ **User Impact:**
- Zero user-reported issues related to dimensions
- Zero support tickets about room dimensions

---

## Timeline

### Day 1: Preparation
- ✅ Create migration SQL
- ✅ Create migration helper script
- ✅ Update TypeScript interfaces
- ✅ Write tests

### Day 2: Implementation
- ⏰ 09:00 - Backup database
- ⏰ 10:00 - Run migration on staging
- ⏰ 11:00 - Test staging thoroughly
- ⏰ 14:00 - Update all 40 code files
- ⏰ 16:00 - Run full test suite
- ⏰ 17:00 - Code review

### Day 3: Deployment
- ⏰ 02:00 - Deploy database migration (low traffic)
- ⏰ 02:15 - Deploy frontend
- ⏰ 02:30 - Smoke test production
- ⏰ 03:00 - Monitor for 1 hour
- ⏰ 09:00 - Announce completion

---

## Next Steps

1. **User Approval Required** - Confirm approach
2. Create SQL migration file
3. Create TypeScript fix branch
4. Run migration helper script
5. Update all 40 files
6. Test on staging
7. Deploy to production

---

**Status:** Ready for implementation
**Owner:** Claude + User
**Target:** ASAP (before coordinate refactor)
