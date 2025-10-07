# Supabase Schema Analysis Summary

## Overview
- **Analysis Date**: 2025-10-07T21:29:15.820Z
- **Total Tables**: 56
- **Tables with Data**: 32
- **Empty Tables**: 24

## Tables with Data (32)

| Table Name | Row Count | Columns | Sample Columns |
|------------|-----------|---------|----------------|
| `blog_categories` | 5 | 6 | id, name, slug, description, color... |
| `blog_posts` | 1 | 14 | id, title, slug, excerpt, content... |
| `component_hardware` | 12 | 5 | id, component_id, hardware_id, quantity_per_component, placement_notes |
| `component_material_costs` | 12 | 11 | component_id, component_name, part_name, material_name, material_category... |
| `component_materials` | 12 | 15 | id, created_at, component_id, material_id, part_name... |
| `component_total_costs` | 4 | 5 | component_id, component_name, material_count, total_material_cost_pence, total_material_cost_gbp |
| `components` | 168 | 27 | id, created_at, updated_at, component_id, name... |
| `egger_availability` | 925 | 9 | id, decor_id, product_type, availability_status, lead_time_days... |
| `egger_categories` | 8 | 5 | id, name, description, color_hex, created_at |
| `egger_color_families` | 6 | 5 | id, name, color_hex, description, created_at |
| `egger_combinations` | 509 | 8 | id, decor_id, recommended_decor_id, match_type, confidence_score... |
| `egger_decors` | 312 | 16 | id, decor_id, decor_name, decor, texture... |
| `egger_images` | 2493 | 9 | id, decor_id, image_url, image_type, width... |
| `egger_interior_matches` | 29 | 7 | id, decor_id, interior_style, room_types, color_palette... |
| `egger_no_combinations` | 3 | 5 | id, decor_id, reason, notes, created_at |
| `egger_textures` | 36 | 4 | id, name, description, created_at |
| `farrow_ball_color_schemes` | 2253 | 6 | id, finish_id, rgb, hex, color_type... |
| `farrow_ball_finishes` | 301 | 20 | id, finish_id, color_name, color_number, product_url... |
| `farrow_ball_images` | 5437 | 7 | id, finish_id, image_url, image_type, image_order... |
| `hardware` | 4 | 14 | id, created_at, hardware_code, name, category... |
| `keyboard_shortcuts` | 10 | 17 | id, created_at, updated_at, shortcut_code, shortcut_name_key... |
| `materials` | 10 | 23 | id, created_at, updated_at, material_code, name... |
| `media_files` | 10 | 12 | id, file_name, file_path, file_size, mime_type... |
| `paint_finishes` | 903 | 9 | id, folder_name, file_name, original_name, storage_path... |
| `regional_material_pricing` | 28 | 18 | id, created_at, updated_at, material_id, hardware_id... |
| `regional_tier_pricing` | 8 | 13 | id, created_at, tier_id, region_id, monthly_price_local... |
| `regions` | 2 | 20 | id, created_at, updated_at, region_code, region_name... |
| `room_types` | 6 | 27 | id, created_at, updated_at, room_code, room_name_key... |
| `room_types_localized` | 6 | 29 | id, created_at, updated_at, room_code, room_name_key... |
| `translations` | 29 | 13 | id, created_at, updated_at, translation_key, language_code... |
| `ui_configurations` | 2 | 42 | id, created_at, updated_at, config_code, config_name... |
| `user_tiers` | 4 | 43 | id, created_at, updated_at, tier_code, tier_name... |

## Empty Tables (24)

| Table Name | Purpose (Inferred) |
|------------|-------------------|
| `active_subscriptions` | Unknown purpose |
| `appliance_3d_types` | Unknown purpose |
| `blog_post_categories` | Content management |
| `component_material_finishes` | Component management |
| `component_metadata` | Component management |
| `component_room_types` | Component management |
| `designs` | Design data |
| `designs_backup` | Design data |
| `farrow_ball_categories` | Farrow & Ball products |
| `farrow_ball_color_families` | Farrow & Ball products |
| `furniture_3d_models` | Unknown purpose |
| `material_finishes` | Material management |
| `model_3d` | 3D model system |
| `model_3d_config` | 3D model system |
| `model_3d_patterns` | 3D model system |
| `model_3d_variants` | 3D model system |
| `profiles` | Unknown purpose |
| `projects` | Unknown purpose |
| `regional_revenue` | Regional/localization |
| `room_designs` | Room management |
| `room_type_templates` | Room management |
| `user_preferences_summary` | User management |
| `user_tier_assignments` | User management |
| `user_ui_preferences` | User management |

## Key Findings

### High-Value Tables (Most Data)
- **farrow_ball_images**: 5437 rows
- **egger_images**: 2493 rows
- **farrow_ball_color_schemes**: 2253 rows
- **egger_availability**: 925 rows
- **paint_finishes**: 903 rows
- **egger_combinations**: 509 rows
- **egger_decors**: 312 rows
- **farrow_ball_finishes**: 301 rows
- **components**: 168 rows
- **egger_textures**: 36 rows

### System Categories

#### Component System
- **component_hardware**: 12 rows
- **component_material_costs**: 12 rows
- **component_material_finishes**: 0 rows
- **component_materials**: 12 rows
- **component_metadata**: 0 rows
- **component_room_types**: 0 rows
- **component_total_costs**: 4 rows
- **components**: 168 rows

#### 3D Model System
- **appliance_3d_types**: 0 rows
- **furniture_3d_models**: 0 rows
- **model_3d**: 0 rows
- **model_3d_config**: 0 rows
- **model_3d_patterns**: 0 rows
- **model_3d_variants**: 0 rows

#### Material System
- **component_material_costs**: 12 rows
- **component_material_finishes**: 0 rows
- **component_materials**: 12 rows
- **farrow_ball_finishes**: 301 rows
- **material_finishes**: 0 rows
- **materials**: 10 rows
- **paint_finishes**: 903 rows
- **regional_material_pricing**: 28 rows

#### Regional/Localization System
- **regional_material_pricing**: 28 rows
- **regional_revenue**: 0 rows
- **regional_tier_pricing**: 8 rows
- **room_types_localized**: 6 rows
- **translations**: 29 rows

## Next Steps

1. **Focus on tables with data** - These are actively used
2. **Investigate empty tables** - May be for future features
3. **Check table relationships** - Look for foreign keys
4. **Analyze sample data** - Understand data structure
5. **Update application code** - Ensure all tables are properly integrated

## Data Population Priority

Based on row counts, prioritize populating these tables:
1. **farrow_ball_images** (5437 rows)
2. **egger_images** (2493 rows)
3. **farrow_ball_color_schemes** (2253 rows)
4. **egger_availability** (925 rows)
5. **paint_finishes** (903 rows)
