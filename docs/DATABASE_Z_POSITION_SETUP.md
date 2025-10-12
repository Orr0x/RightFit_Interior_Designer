# Database Z-Position Setup Guide

## Overview

The application now uses a **database-first approach** for component Z-positioning (height off floor). The system automatically reads `default_z_position` values from the Supabase database with intelligent fallback to hardcoded type rules.

## Current Status

✅ **Code Integration Complete**
- Z-position helper accepts database values with priority order:
  1. Database `default_z_position` (if non-zero)
  2. Type-based rules (hardcoded fallback)
  3. Default value (0 = floor-mounted)

✅ **All Creation Paths Updated**
- Mobile click-to-add
- Desktop click-to-select
- Drag-and-drop

⚠️ **Database Values Need Population**
- Current state: 192 out of 194 components have `default_z_position = 0`
- Only 2 counter-tops have correct value (90cm)
- Values need to be populated manually via Supabase dashboard

## Why Database Values Are Currently Zero

The anon API key (used by frontend) only has `SELECT` permission, not `UPDATE` permission. This is correct for security - frontend applications should never have write access to modify database structure.

Database values must be populated using:
- Supabase Dashboard (SQL Editor)
- Service role key (backend only)
- Database migrations

## How to Populate Database Values

### Option 1: Supabase Dashboard SQL Editor (Recommended)

1. Log into Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to your project: `akfdezesupzuvukqiggn`
3. Go to **SQL Editor**
4. Run the following SQL:

```sql
-- Update cornice components (top of wall units)
UPDATE components
SET default_z_position = 200
WHERE type = 'cornice';

-- Update pelmet components (bottom of wall units)
UPDATE components
SET default_z_position = 140
WHERE type = 'pelmet';

-- Update counter-top components (standard counter height)
UPDATE components
SET default_z_position = 90
WHERE type = 'counter-top';

-- Update window components (typical sill height)
UPDATE components
SET default_z_position = 90
WHERE type = 'window';

-- Update end-panel components (wall unit end panels)
UPDATE components
SET default_z_position = 200
WHERE type = 'end-panel';

-- Update wall cabinets (component_id pattern matching)
UPDATE components
SET default_z_position = 140
WHERE component_id LIKE '%wall-cabinet%';

-- Verify updates
SELECT type, default_z_position, COUNT(*) as count
FROM components
WHERE default_z_position != 0
GROUP BY type, default_z_position
ORDER BY type;
```

### Option 2: Database Migration (Production)

Create a migration file in your migrations directory:

```sql
-- Migration: 2025-01-XX_populate_default_z_positions.sql

BEGIN;

UPDATE components SET default_z_position = 200 WHERE type = 'cornice';
UPDATE components SET default_z_position = 140 WHERE type = 'pelmet';
UPDATE components SET default_z_position = 90 WHERE type = 'counter-top';
UPDATE components SET default_z_position = 90 WHERE type = 'window';
UPDATE components SET default_z_position = 200 WHERE type = 'end-panel';
UPDATE components SET default_z_position = 140 WHERE component_id LIKE '%wall-cabinet%';

COMMIT;
```

Run migration:
```bash
supabase db push
```

## Expected Component Heights

| Component Type | Z-Position (cm) | Description |
|---|---|---|
| `cornice` | 200 | Top of wall units |
| `pelmet` | 140 | Bottom of wall units |
| `counter-top` | 90 | Standard counter height |
| `window` | 90 | Typical sill height |
| `end-panel` | 200 | Wall unit end panels |
| Wall cabinets (ID pattern) | 140 | Mounted cabinets |
| All other components | 0 | Floor-mounted (default) |

## Verification Scripts

Check current database state:
```bash
node scripts/check-z-positions.cjs
```

This will show:
- Total components with null/zero/non-zero values
- Breakdown by component type
- Components that need updating

## After Database Population

Once the database values are populated:

1. **Clear browser cache** to force fresh component data fetch
2. **Restart development server** (if running)
3. **Verify in application:**
   - Drag components onto canvas
   - Check Z-coordinates in console logs
   - Wall units should appear at 140cm
   - Cornices should appear at 200cm
   - Counter-tops should appear at 90cm

## Rollback Plan

If database values cause issues:

1. **Immediate fix:** Set all to zero
   ```sql
   UPDATE components SET default_z_position = 0;
   ```

2. **Application continues working** - falls back to hardcoded type rules in `componentZPositionHelper.ts`

3. **No code changes needed** - the fallback system handles this automatically

## Architecture Benefits

### Database-First Approach:
✅ Single source of truth
✅ Easy to update values without code deployment
✅ Per-component customization possible
✅ Audit trail in database

### Intelligent Fallback:
✅ System never breaks if database values missing
✅ Type-based rules as safety net
✅ Gradual migration path
✅ No "all or nothing" requirement

## Future Enhancements

Once database values are populated, consider:

1. **Component-specific overrides** - Individual components can have custom heights
2. **Region-specific values** - Different standard heights for different markets
3. **User preferences** - Allow users to customize default heights
4. **Historical tracking** - Log when/why heights were changed

## Questions?

Refer to:
- [componentZPositionHelper.ts](../src/utils/componentZPositionHelper.ts) - Core logic
- [COMPONENT_DATA_FLOW_AUDIT.md](COMPONENT_DATA_FLOW_AUDIT.md) - Full system analysis
- [COMPONENT_CREATION_FLOW_ANALYSIS.md](COMPONENT_CREATION_FLOW_ANALYSIS.md) - Bug fixes

---

**Status:** Ready for database population
**Priority:** High - enables full database-driven architecture
**Risk:** Low - fallback system prevents breakage
