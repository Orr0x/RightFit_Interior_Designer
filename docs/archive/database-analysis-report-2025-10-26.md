# Database Analysis Report

**Date**: 2025-10-26T13:20:38.678Z
**Purpose**: Baseline analysis before Story 1.1 (TypeScript type regeneration)

---

## Summary

- **Total Tables**: 20
- **Populated**: 14
- **Empty**: 6
- **Errors**: 0

## Table Details

| Table Name | Row Count | Status |
|------------|-----------|--------|
| geometry_parts | 516 | ✅ Active |
| components | 186 | ✅ Active |
| component_2d_renders | 186 | ✅ Active |
| component_3d_models | 184 | ✅ Active |
| app_configuration | 37 | ✅ Active |
| material_definitions | 17 | ✅ Active |
| room_geometry_templates | 6 | ✅ Active |
| feature_flags | 5 | ✅ Active |
| model_3d | 0 | ⚠️ Empty |
| room_designs | 0 | ⚠️ Empty |
| projects | 0 | ⚠️ Empty |
| room_type_templates | 0 | ⚠️ Empty |
| ab_test_results | 0 | ⚠️ Empty |
| profiles | 0 | ⚠️ Empty |
| 3d_models | N/A | ⚠️ Unknown |
| ab_test_sessions | N/A | ⚠️ Unknown |
| user_preferences | N/A | ⚠️ Unknown |
| farrow_ball_colors | N/A | ⚠️ Unknown |
| design_styles | N/A | ⚠️ Unknown |
| cabinet_styles | N/A | ⚠️ Unknown |

## Empty Tables (Future Features)

These tables exist but have never been used:

- **model_3d** - Added for future feature, never populated
- **room_designs** - Added for future feature, never populated
- **projects** - Added for future feature, never populated
- **room_type_templates** - Added for future feature, never populated
- **ab_test_results** - Added for future feature, never populated
- **profiles** - Added for future feature, never populated

**Recommendation**: Consider removing these from TypeScript types or marking them optional.

## Next Steps for Story 1.1

1. ✅ Baseline types generated: `src/types/database-baseline-2025-10-26.ts`
2. ⏳ Regenerate types: `npx supabase gen types typescript --linked > src/types/supabase.ts`
3. ⏳ Compare baseline vs new types to identify changes
4. ⏳ Update imports to use new types
5. ⏳ Run `npm run type-check` to verify no breakages
