# Phase 1: Database Migration Guide

**Date:** 2025-10-10
**Status:** ⏳ MIGRATION CREATED - Awaiting Application
**Migration File:** `supabase/migrations/20251011000001_create_room_geometry_system.sql`

---

## Status Overview

### ✅ Completed
- [x] Created `room_geometry_templates` table migration (17,216 bytes)
- [x] Added `room_geometry` JSONB column to `room_designs`
- [x] Defined 3 seed templates (rectangle, L-shape, U-shape)
- [x] Added 7 database indexes (including GIN for JSONB)
- [x] Configured RLS policies (public read, authenticated full access)
- [x] Created migration verification script (`check-room-geometry-migration.ts`)

### ⏳ Pending
- [ ] Apply migration to database
- [ ] Verify tables created successfully
- [ ] Verify seed data loaded (3 templates)
- [ ] Test JSONB queries
- [ ] Document migration results

---

## Migration Application Methods

### Method 1: Supabase Dashboard (RECOMMENDED - No Docker Required)

**Best for:** Quick testing, remote database, no Docker Desktop setup

**Steps:**

1. **Open SQL Editor**
   - Navigate to: https://supabase.com/dashboard/project/akfdezesupzuvukqiggn/sql/new
   - Or: Dashboard > SQL Editor > "New query"

2. **Load Migration File**
   ```bash
   # Copy file contents to clipboard (Windows)
   type supabase\migrations\20251011000001_create_room_geometry_system.sql | clip

   # Or open in editor
   code supabase/migrations/20251011000001_create_room_geometry_system.sql
   ```

3. **Execute Migration**
   - Paste SQL into editor
   - Click "Run" button
   - Wait for execution (should take 2-5 seconds)

4. **Verify Success**
   ```bash
   npx tsx scripts/check-room-geometry-migration.ts
   ```
   Should show: `✅ 5/5 tests passed`

---

### Method 2: Local Supabase CLI (Requires Docker Desktop)

**Best for:** Local development, testing multiple times, CI/CD

**Steps:**

1. **Start Docker Desktop**
   - Ensure Docker Desktop is running
   - Check: Docker icon in system tray should be green

2. **Reset Database (Applies All Migrations)**
   ```bash
   npx supabase db reset
   ```
   This will:
   - Drop local database
   - Recreate from scratch
   - Apply all migrations in order (including our new one)

3. **Verify Success**
   ```bash
   npx tsx scripts/check-room-geometry-migration.ts
   ```

---

### Method 3: Direct psql Connection (Advanced)

**Best for:** Production deployments, automation scripts

**Steps:**

1. **Get Connection String**
   - Dashboard > Settings > Database > Connection string
   - Use "Transaction" mode

2. **Execute Migration**
   ```bash
   psql $DATABASE_URL -f supabase/migrations/20251011000001_create_room_geometry_system.sql
   ```

3. **Verify Success**
   ```bash
   npx tsx scripts/check-room-geometry-migration.ts
   ```

---

## Verification Checklist

After applying the migration, run the verification script:

```bash
npx tsx scripts/check-room-geometry-migration.ts
```

**Expected Output:**
```
🔍 Checking Room Geometry Migration Status...

📊 Test Results:

1. ✅ room_geometry_templates table exists
2. ✅ Seed data loaded (3 templates)
   Found 3 templates: rectangle-standard, l-shape-standard, u-shape-standard
3. ✅ room_designs.room_geometry column exists
4. ✅ L-shape geometry structure valid
   L-shape has 6 vertices and 6 walls
5. ✅ Parameter config structure valid
   Found 4 configurable parameters

────────────────────────────────────────────────────────────

📈 Summary: 5/5 tests passed

✅ Migration successfully applied!
✅ room_geometry_templates table created
✅ room_geometry column added to room_designs
✅ Seed data loaded (rectangle, L-shape, U-shape)
✅ JSONB structures validated
```

---

## Manual Verification (SQL Queries)

If verification script fails, check manually:

### Test 1: Table Exists
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'room_geometry_templates';
```
**Expected:** 1 row returned

### Test 2: Seed Data Loaded
```sql
SELECT template_name, display_name, category
FROM room_geometry_templates
ORDER BY sort_order;
```
**Expected:** 3 rows
- `rectangle-standard` | Standard Rectangle | standard
- `l-shape-standard` | Standard L-Shape | l-shape
- `u-shape-standard` | Standard U-Shape | u-shape

### Test 3: Column Added
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'room_designs'
  AND column_name = 'room_geometry';
```
**Expected:** 1 row (jsonb type)

### Test 4: Indexes Created
```sql
SELECT indexname
FROM pg_indexes
WHERE tablename = 'room_geometry_templates';
```
**Expected:** 4 indexes
- `room_geometry_templates_pkey`
- `idx_geometry_templates_category`
- `idx_geometry_templates_active`
- `idx_geometry_templates_definition`

### Test 5: Test JSONB Query
```sql
SELECT
  template_name,
  geometry_definition->>'shape_type' AS shape_type,
  jsonb_array_length(geometry_definition->'floor'->'vertices') AS vertex_count
FROM room_geometry_templates
WHERE template_name = 'l-shape-standard';
```
**Expected:** 1 row with `l-shape` and `6` vertices

---

## Troubleshooting

### Issue: "Table already exists"
**Cause:** Migration already applied
**Solution:** Skip migration or drop table first
```sql
DROP TABLE IF EXISTS room_geometry_templates CASCADE;
-- Then re-run migration
```

### Issue: "Column already exists"
**Cause:** Column already added
**Solution:** Check if migration was partially applied
```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'room_designs'
  AND column_name = 'room_geometry';
```

### Issue: "Permission denied"
**Cause:** Using anon key instead of service key
**Solution:** Use service key or apply via dashboard

### Issue: Verification script fails with "table not found"
**Cause:** Migration not applied yet
**Solution:** Apply migration first using Method 1, 2, or 3 above

---

## Migration File Structure

The migration creates:

### 1. room_geometry_templates Table
```sql
- id (UUID, primary key)
- template_name (TEXT, unique) - e.g., 'l-shape-standard'
- display_name (TEXT) - e.g., 'Standard L-Shape'
- category (TEXT) - 'standard', 'l-shape', 'u-shape', etc.
- geometry_definition (JSONB) - Full geometry structure
- parameter_config (JSONB) - Configurable dimensions
- preview_image_url (TEXT) - Template preview
- is_active (BOOLEAN)
- sort_order (INTEGER)
- created_at, updated_at (TIMESTAMP)
```

### 2. room_designs Column Addition
```sql
ALTER TABLE room_designs
ADD COLUMN room_geometry JSONB;
```

### 3. Indexes (7 total)
- GIN indexes for JSONB queries
- B-tree indexes for category, active status
- Partial indexes for optimization

### 4. RLS Policies
- `geometry_templates_select` - Public read access
- `geometry_templates_all` - Authenticated full access

### 5. Seed Data (3 templates)
- **Rectangle:** 4 vertices, 4 walls (reference)
- **L-Shape:** 6 vertices, 6 walls, 2 sections
- **U-Shape:** 8 vertices, 8 walls, 3 sections

---

## JSONB Schema Reference

### Geometry Definition Structure
```typescript
{
  shape_type: 'rectangle' | 'l-shape' | 'u-shape' | 'custom',
  bounding_box: {
    min_x: number,
    min_y: number,
    max_x: number,
    max_y: number
  },
  floor: {
    type: 'polygon',
    vertices: [[x, y], ...],  // Ordered vertices (clockwise)
    elevation: number,         // Height above ground (cm)
    material_zones: [...]      // Optional: Different floor materials
  },
  walls: [
    {
      id: string,              // 'wall_north', 'wall_internal_1'
      start: [x, y],           // Start point
      end: [x, y],             // End point
      height: number,          // Wall height (cm)
      thickness: number,       // Wall thickness (cm, default 10)
      type: 'solid' | 'door' | 'window' | 'opening'
    }
  ],
  ceiling: {
    type: 'flat' | 'vaulted' | 'sloped',
    zones: [
      {
        vertices: [[x, y], ...],
        height: number,        // Ceiling height (cm)
        style: 'flat' | 'vaulted'
      }
    ]
  },
  sections: [                  // For L/U shapes
    {
      id: string,
      vertices: [[x, y], ...],
      purpose: 'main' | 'extension'
    }
  ],
  metadata: {
    total_floor_area: number,  // cm²
    total_wall_length: number, // cm
    total_perimeter: number    // cm
  }
}
```

### Parameter Config Structure
```typescript
{
  configurable_params: [
    {
      name: 'width',
      label: 'Room Width',
      type: 'number',
      min: number,
      max: number,
      default: number,
      step: number,
      unit: 'cm'
    }
  ],
  template_variables: {
    // Internal calculations
    MAIN_SECTION_WIDTH: 'width',
    EXTENSION_DEPTH: 'extension_depth'
  }
}
```

---

## Next Steps After Migration Applied

1. **Verify Migration**
   ```bash
   npx tsx scripts/check-room-geometry-migration.ts
   ```

2. **Update TypeScript Types**
   ```bash
   npx supabase gen types typescript --local > src/types/supabase.ts
   ```

3. **Create Type Definitions** (Phase 2)
   - `RoomGeometry` interface
   - `FloorGeometry` interface
   - `WallSegment` interface
   - `CeilingZone` interface

4. **Update RoomService** (Phase 2)
   - Add `getRoomGeometryTemplates()` method
   - Add `applyGeometryTemplate()` method
   - Add `getRoomGeometry()` method

5. **Test with Sample Data**
   ```sql
   -- Create test room with L-shape
   INSERT INTO room_designs (
     project_id,
     room_type,
     name,
     room_geometry
   ) VALUES (
     'test-project-id',
     'kitchen',
     'Test L-Shape Kitchen',
     (SELECT geometry_definition FROM room_geometry_templates WHERE template_name = 'l-shape-standard')
   );
   ```

---

## Migration Rollback (If Needed)

If you need to undo the migration:

```sql
-- Drop table
DROP TABLE IF EXISTS room_geometry_templates CASCADE;

-- Remove column
ALTER TABLE room_designs
DROP COLUMN IF EXISTS room_geometry;
```

**Note:** This will delete all geometry templates and room geometry data!

---

## Success Criteria

Migration is successful when:

- [x] ✅ Migration file created (17,216 bytes)
- [ ] ⏳ Table `room_geometry_templates` exists
- [ ] ⏳ Column `room_designs.room_geometry` exists (JSONB type)
- [ ] ⏳ 3 seed templates loaded
- [ ] ⏳ 7 indexes created
- [ ] ⏳ RLS policies active
- [ ] ⏳ JSONB queries work correctly
- [ ] ⏳ Verification script passes 5/5 tests

**Current Status:** 1/8 complete (Migration file created)

---

## Related Files

- **Migration:** `supabase/migrations/20251011000001_create_room_geometry_system.sql`
- **Verification:** `scripts/check-room-geometry-migration.ts`
- **Session Docs:** `docs/session-2025-10-10-complex-room-shapes/`
- **Reference:** `docs/session-2025-10-10-complex-room-shapes/reference/`

---

**Status:** ⏳ Ready to apply migration. Choose Method 1 (Supabase Dashboard) for quickest testing.
