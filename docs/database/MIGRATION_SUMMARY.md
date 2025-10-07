# Database Migration Summary

## Current Active Migrations (21 files)

The following migrations are currently active and represent the current database schema:

### Core Schema Migrations
- `20250908160000_create_multi_room_schema.sql` - Multi-room support
- `20250908160001_migrate_existing_designs.sql` - Design migration
- `20250908160002_add_new_room_types.sql` - Room type expansion
- `20250912300000_complete_component_system.sql` - Complete component system

### Feature Migrations
- `20250912000000_add_user_tiers.sql` - User permission system
- `20250912100000_create_blog_system.sql` - Blog/CMS system
- `20250912110000_fix_blog_rls_policies.sql` - Blog security policies
- `20250912120000_setup_storage_buckets.sql` - File storage setup
- `20250912130000_fix_storage_move_policies.sql` - Storage policies
- `20250912140000_fix_storage_policies_v2.sql` - Storage policies v2
- `20250912150000_fix_storage_final.sql` - Final storage setup

### Component System Migrations
- `20250912230000_complete_kitchen_components.sql` - Kitchen components
- `20250912240000_complete_multiroom_components.sql` - Multi-room components
- `20250915000000_phase1_expand_components_table.sql` - Component table expansion
- `20250915000001_phase1_expand_room_designs.sql` - Room design expansion
- `20250915000002_phase1_create_room_templates.sql` - Room templates
- `20250915000003_phase1_populate_component_data.sql` - Component data population
- `20250915000004_phase1_validation.sql` - Data validation

### Recent Updates
- `20250129000002_add_image_urls_to_farrow_ball_finishes.sql` - Farrow & Ball images
- `20250908145000_update_room_type_constraints.sql` - Room type constraints
- `20250916000000_fix_tall_corner_unit_dimensions.sql` - Component dimension fixes

## Archived Migrations

The following migrations have been archived to `docs/database/migrations-archive/`:

### Foundational Migrations (Archived)
- `20250127000000_create_egger_database_schema.sql` - Original EGGER schema
- `20250127000001_add_egger_insert_policies.sql` - EGGER policies
- `20250127000002_fix_egger_policies.sql` - EGGER policy fixes
- `20250127000003_create_missing_tables.sql` - Missing table creation
- `20250127000004_add_missing_columns.sql` - Column additions
- `20250127000005_create_egger_board_images.sql` - EGGER images

### Development Scripts (Archived)
- `add_new_corner_components_only.sql` - Development script
- `cleanup_duplicates.sql` - Development script
- `diagnose_only.sql` - Development script

### Intermediate Migrations (Archived)
- `20250907012310_2b9e4fd7-9b3a-43aa-a378-c14e28a6b141.sql` - Superseded
- `20250907013539_6ae21ac7-7d9d-4691-8fc3-770acd482b7d.sql` - Superseded
- `20250907021033_247d2847-7f9c-4ceb-a530-5a01ad897bb7.sql` - Superseded
- `20250907210245_3812aeb2-84e0-4a60-aab1-0985e81a244d.sql` - Superseded

## Migration Strategy

### Why Archive Old Migrations?
1. **Reduced Complexity** - Fewer files to manage
2. **Clearer History** - Only current schema migrations remain
3. **Faster Deployments** - Less migration overhead
4. **Better Organization** - Development scripts separated from production migrations

### Current Schema
The current database schema is defined by the active migrations listed above. All archived migrations have been consolidated into the current schema.

### Future Migrations
New migrations should be added to the `supabase/migrations/` folder with proper timestamps and descriptive names.

## Database Tables

The current schema includes these main table groups:

### Product Data
- EGGER products and images
- Farrow & Ball finishes and colors

### Component System
- Components library
- Room designs and templates

### Content Management
- Blog posts and media
- User tiers and permissions

### Storage
- File storage buckets
- Image management

See `CURRENT_SCHEMA.md` for detailed table definitions.
