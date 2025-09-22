export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      appliance_3d_types: {
        Row: {
          appliance_category: string
          default_colors: Json | null
          energy_rating: string | null
          has_controls: boolean | null
          has_display: boolean | null
          has_glass_door: boolean | null
          id: string
          model_3d_id: string
        }
        Insert: {
          appliance_category: string
          default_colors?: Json | null
          energy_rating?: string | null
          has_controls?: boolean | null
          has_display?: boolean | null
          has_glass_door?: boolean | null
          id?: string
          model_3d_id: string
        }
        Update: {
          appliance_category?: string
          default_colors?: Json | null
          energy_rating?: string | null
          has_controls?: boolean | null
          has_display?: boolean | null
          has_glass_door?: boolean | null
          id?: string
          model_3d_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appliance_3d_types_model_3d_id_fkey"
            columns: ["model_3d_id"]
            isOneToOne: true
            referencedRelation: "model_3d"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      blog_post_categories: {
        Row: {
          blog_post_id: string
          category_id: string
        }
        Insert: {
          blog_post_id: string
          category_id: string
        }
        Update: {
          blog_post_id?: string
          category_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_categories_blog_post_id_fkey"
            columns: ["blog_post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_id: string | null
          content: string
          created_at: string | null
          excerpt: string | null
          featured_image_url: string | null
          id: string
          meta_description: string | null
          meta_title: string | null
          publish_date: string | null
          slug: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          publish_date?: string | null
          slug: string
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          publish_date?: string | null
          slug?: string
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      component_hardware: {
        Row: {
          component_id: string
          hardware_id: string
          id: string
          placement_notes: string | null
          quantity_per_component: number
        }
        Insert: {
          component_id: string
          hardware_id: string
          id?: string
          placement_notes?: string | null
          quantity_per_component?: number
        }
        Update: {
          component_id?: string
          hardware_id?: string
          id?: string
          placement_notes?: string | null
          quantity_per_component?: number
        }
        Relationships: [
          {
            foreignKeyName: "component_hardware_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "components"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_hardware_hardware_id_fkey"
            columns: ["hardware_id"]
            isOneToOne: false
            referencedRelation: "hardware"
            referencedColumns: ["id"]
          },
        ]
      }
      component_material_finishes: {
        Row: {
          coats_required: number | null
          component_material_id: string
          coverage_sqm: number | null
          finish_id: string
          id: string
        }
        Insert: {
          coats_required?: number | null
          component_material_id: string
          coverage_sqm?: number | null
          finish_id: string
          id?: string
        }
        Update: {
          coats_required?: number | null
          component_material_id?: string
          coverage_sqm?: number | null
          finish_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "component_material_finishes_component_material_id_fkey"
            columns: ["component_material_id"]
            isOneToOne: false
            referencedRelation: "component_materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_material_finishes_finish_id_fkey"
            columns: ["finish_id"]
            isOneToOne: false
            referencedRelation: "material_finishes"
            referencedColumns: ["id"]
          },
        ]
      }
      component_materials: {
        Row: {
          component_id: string
          created_at: string
          cutting_complexity: string | null
          grain_direction: string | null
          id: string
          is_primary_material: boolean | null
          is_structural: boolean | null
          is_visible: boolean | null
          material_id: string
          part_description: string | null
          part_name: string
          quantity: number
          requires_edge_banding: boolean | null
          unit: string
          waste_factor: number | null
        }
        Insert: {
          component_id: string
          created_at?: string
          cutting_complexity?: string | null
          grain_direction?: string | null
          id?: string
          is_primary_material?: boolean | null
          is_structural?: boolean | null
          is_visible?: boolean | null
          material_id: string
          part_description?: string | null
          part_name: string
          quantity: number
          requires_edge_banding?: boolean | null
          unit: string
          waste_factor?: number | null
        }
        Update: {
          component_id?: string
          created_at?: string
          cutting_complexity?: string | null
          grain_direction?: string | null
          id?: string
          is_primary_material?: boolean | null
          is_structural?: boolean | null
          is_visible?: boolean | null
          material_id?: string
          part_description?: string | null
          part_name?: string
          quantity?: number
          requires_edge_banding?: boolean | null
          unit?: string
          waste_factor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "component_materials_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "components"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_materials_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      component_metadata: {
        Row: {
          assembly_time_minutes: number | null
          barcode: string | null
          category_key: string | null
          certifications: string[] | null
          compliance_standards: string[] | null
          component_id: string
          created_at: string
          description_key: string | null
          discontinue_date: string | null
          eco_rating: string | null
          id: string
          installation_complexity: string | null
          installation_notes_key: string | null
          launch_date: string | null
          manufacturer: string | null
          marketing_tags: string[] | null
          model_number: string | null
          name_key: string | null
          recycling_info_key: string | null
          replacement_component_id: string | null
          seo_keywords: string[] | null
          sku: string | null
          specifications: Json | null
          tools_required: string[] | null
          updated_at: string
          warranty_months: number | null
        }
        Insert: {
          assembly_time_minutes?: number | null
          barcode?: string | null
          category_key?: string | null
          certifications?: string[] | null
          compliance_standards?: string[] | null
          component_id: string
          created_at?: string
          description_key?: string | null
          discontinue_date?: string | null
          eco_rating?: string | null
          id?: string
          installation_complexity?: string | null
          installation_notes_key?: string | null
          launch_date?: string | null
          manufacturer?: string | null
          marketing_tags?: string[] | null
          model_number?: string | null
          name_key?: string | null
          recycling_info_key?: string | null
          replacement_component_id?: string | null
          seo_keywords?: string[] | null
          sku?: string | null
          specifications?: Json | null
          tools_required?: string[] | null
          updated_at?: string
          warranty_months?: number | null
        }
        Update: {
          assembly_time_minutes?: number | null
          barcode?: string | null
          category_key?: string | null
          certifications?: string[] | null
          compliance_standards?: string[] | null
          component_id?: string
          created_at?: string
          description_key?: string | null
          discontinue_date?: string | null
          eco_rating?: string | null
          id?: string
          installation_complexity?: string | null
          installation_notes_key?: string | null
          launch_date?: string | null
          manufacturer?: string | null
          marketing_tags?: string[] | null
          model_number?: string | null
          name_key?: string | null
          recycling_info_key?: string | null
          replacement_component_id?: string | null
          seo_keywords?: string[] | null
          sku?: string | null
          specifications?: Json | null
          tools_required?: string[] | null
          updated_at?: string
          warranty_months?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "component_metadata_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: true
            referencedRelation: "components"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_metadata_replacement_component_id_fkey"
            columns: ["replacement_component_id"]
            isOneToOne: false
            referencedRelation: "components"
            referencedColumns: ["id"]
          },
        ]
      }
      component_room_types: {
        Row: {
          component_id: string
          room_type: string
        }
        Insert: {
          component_id: string
          room_type: string
        }
        Update: {
          component_id?: string
          room_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "component_room_types_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "components"
            referencedColumns: ["id"]
          },
        ]
      }
      components: {
        Row: {
          category: string
          color: string
          component_behavior: Json | null
          component_id: string
          corner_configuration: Json | null
          created_at: string
          default_z_position: number | null
          deprecated: boolean
          deprecation_reason: string | null
          depth: number
          description: string
          door_side: string | null
          elevation_height: number | null
          has_direction: boolean | null
          height: number
          icon_name: string
          id: string
          metadata: Json | null
          mount_type: string | null
          name: string
          replacement_component_id: string | null
          room_types: string[]
          tags: string[] | null
          type: string
          updated_at: string
          version: string
          width: number
        }
        Insert: {
          category: string
          color: string
          component_behavior?: Json | null
          component_id: string
          corner_configuration?: Json | null
          created_at?: string
          default_z_position?: number | null
          deprecated?: boolean
          deprecation_reason?: string | null
          depth: number
          description: string
          door_side?: string | null
          elevation_height?: number | null
          has_direction?: boolean | null
          height: number
          icon_name: string
          id?: string
          metadata?: Json | null
          mount_type?: string | null
          name: string
          replacement_component_id?: string | null
          room_types: string[]
          tags?: string[] | null
          type: string
          updated_at?: string
          version?: string
          width: number
        }
        Update: {
          category?: string
          color?: string
          component_behavior?: Json | null
          component_id?: string
          corner_configuration?: Json | null
          created_at?: string
          default_z_position?: number | null
          deprecated?: boolean
          deprecation_reason?: string | null
          depth?: number
          description?: string
          door_side?: string | null
          elevation_height?: number | null
          has_direction?: boolean | null
          height?: number
          icon_name?: string
          id?: string
          metadata?: Json | null
          mount_type?: string | null
          name?: string
          replacement_component_id?: string | null
          room_types?: string[]
          tags?: string[] | null
          type?: string
          updated_at?: string
          version?: string
          width?: number
        }
        Relationships: []
      }
      designs: {
        Row: {
          created_at: string
          description: string | null
          design_data: Json
          id: string
          is_public: boolean
          name: string
          room_type: string
          thumbnail_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          design_data?: Json
          id?: string
          is_public?: boolean
          name: string
          room_type?: string
          thumbnail_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          design_data?: Json
          id?: string
          is_public?: boolean
          name?: string
          room_type?: string
          thumbnail_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      designs_backup: {
        Row: {
          created_at: string | null
          description: string | null
          design_data: Json | null
          id: string | null
          is_public: boolean | null
          name: string | null
          room_type: string | null
          thumbnail_url: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          design_data?: Json | null
          id?: string | null
          is_public?: boolean | null
          name?: string | null
          room_type?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          design_data?: Json | null
          id?: string | null
          is_public?: boolean | null
          name?: string | null
          room_type?: string | null
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      furniture_3d_models: {
        Row: {
          category: string
          color: string
          created_at: string
          deprecated: boolean
          depth: number
          description: string
          furniture_id: string
          height: number
          icon_name: string
          id: string
          model_3d_id: string | null
          name: string
          room_types: string[]
          type: string
          version: string
          width: number
        }
        Insert: {
          category: string
          color: string
          created_at?: string
          deprecated?: boolean
          depth: number
          description: string
          furniture_id: string
          height: number
          icon_name: string
          id?: string
          model_3d_id?: string | null
          name: string
          room_types: string[]
          type?: string
          version?: string
          width: number
        }
        Update: {
          category?: string
          color?: string
          created_at?: string
          deprecated?: boolean
          depth?: number
          description?: string
          furniture_id?: string
          height?: number
          icon_name?: string
          id?: string
          model_3d_id?: string | null
          name?: string
          room_types?: string[]
          type?: string
          version?: string
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "furniture_3d_models_model_3d_id_fkey"
            columns: ["model_3d_id"]
            isOneToOne: false
            referencedRelation: "model_3d"
            referencedColumns: ["id"]
          },
        ]
      }
      hardware: {
        Row: {
          category: string
          cost_per_piece_pence: number
          created_at: string
          dimensions: Json | null
          finish: string | null
          hardware_code: string
          id: string
          is_available: boolean | null
          is_standard: boolean | null
          material: string | null
          name: string
          subcategory: string | null
          supplier_code: string | null
          supplier_part_number: string | null
        }
        Insert: {
          category: string
          cost_per_piece_pence: number
          created_at?: string
          dimensions?: Json | null
          finish?: string | null
          hardware_code: string
          id?: string
          is_available?: boolean | null
          is_standard?: boolean | null
          material?: string | null
          name: string
          subcategory?: string | null
          supplier_code?: string | null
          supplier_part_number?: string | null
        }
        Update: {
          category?: string
          cost_per_piece_pence?: number
          created_at?: string
          dimensions?: Json | null
          finish?: string | null
          hardware_code?: string
          id?: string
          is_available?: boolean | null
          is_standard?: boolean | null
          material?: string | null
          name?: string
          subcategory?: string | null
          supplier_code?: string | null
          supplier_part_number?: string | null
        }
        Relationships: []
      }
      keyboard_shortcuts: {
        Row: {
          action_target: string
          action_type: string
          category: string | null
          context: string | null
          created_at: string
          display_order: number | null
          id: string
          is_active: boolean | null
          is_customizable: boolean | null
          is_enabled_by_default: boolean | null
          key_combination: string
          minimum_tier_code: string | null
          room_types: string[] | null
          shortcut_code: string
          shortcut_description_key: string | null
          shortcut_name_key: string
          updated_at: string
        }
        Insert: {
          action_target: string
          action_type: string
          category?: string | null
          context?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_customizable?: boolean | null
          is_enabled_by_default?: boolean | null
          key_combination: string
          minimum_tier_code?: string | null
          room_types?: string[] | null
          shortcut_code: string
          shortcut_description_key?: string | null
          shortcut_name_key: string
          updated_at?: string
        }
        Update: {
          action_target?: string
          action_type?: string
          category?: string | null
          context?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_customizable?: boolean | null
          is_enabled_by_default?: boolean | null
          key_combination?: string
          minimum_tier_code?: string | null
          room_types?: string[] | null
          shortcut_code?: string
          shortcut_description_key?: string | null
          shortcut_name_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      material_finishes: {
        Row: {
          color_hex: string
          compatible_materials: string[] | null
          cost_per_sqm_pence: number | null
          created_at: string
          durability_rating: number | null
          finish_code: string
          finish_type: string
          gloss_level: string | null
          id: string
          is_available: boolean | null
          maintenance_level: string | null
          name: string
        }
        Insert: {
          color_hex: string
          compatible_materials?: string[] | null
          cost_per_sqm_pence?: number | null
          created_at?: string
          durability_rating?: number | null
          finish_code: string
          finish_type: string
          gloss_level?: string | null
          id?: string
          is_available?: boolean | null
          maintenance_level?: string | null
          name: string
        }
        Update: {
          color_hex?: string
          compatible_materials?: string[] | null
          cost_per_sqm_pence?: number | null
          created_at?: string
          durability_rating?: number | null
          finish_code?: string
          finish_type?: string
          gloss_level?: string | null
          id?: string
          is_available?: boolean | null
          maintenance_level?: string | null
          name?: string
        }
        Relationships: []
      }
      materials: {
        Row: {
          category: string
          color_hex: string
          cost_per_lm_pence: number | null
          cost_per_piece_pence: number | null
          cost_per_sqm_pence: number | null
          created_at: string
          density_kg_per_m3: number | null
          id: string
          is_available: boolean
          is_standard: boolean
          lead_time_days: number | null
          material_code: string
          metalness: number
          minimum_order_quantity: number | null
          name: string
          region: string | null
          roughness: number
          subcategory: string | null
          supplier_code: string | null
          supplier_name: string | null
          supplier_part_number: string | null
          thickness_mm: number | null
          updated_at: string
        }
        Insert: {
          category: string
          color_hex?: string
          cost_per_lm_pence?: number | null
          cost_per_piece_pence?: number | null
          cost_per_sqm_pence?: number | null
          created_at?: string
          density_kg_per_m3?: number | null
          id?: string
          is_available?: boolean
          is_standard?: boolean
          lead_time_days?: number | null
          material_code: string
          metalness?: number
          minimum_order_quantity?: number | null
          name: string
          region?: string | null
          roughness?: number
          subcategory?: string | null
          supplier_code?: string | null
          supplier_name?: string | null
          supplier_part_number?: string | null
          thickness_mm?: number | null
          updated_at?: string
        }
        Update: {
          category?: string
          color_hex?: string
          cost_per_lm_pence?: number | null
          cost_per_piece_pence?: number | null
          cost_per_sqm_pence?: number | null
          created_at?: string
          density_kg_per_m3?: number | null
          id?: string
          is_available?: boolean
          is_standard?: boolean
          lead_time_days?: number | null
          material_code?: string
          metalness?: number
          minimum_order_quantity?: number | null
          name?: string
          region?: string | null
          roughness?: number
          subcategory?: string | null
          supplier_code?: string | null
          supplier_name?: string | null
          supplier_part_number?: string | null
          thickness_mm?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      media_files: {
        Row: {
          alt_text: string | null
          bucket_id: string
          caption: string | null
          category: string
          created_at: string | null
          file_name: string
          file_path: string
          file_size: number
          id: string
          mime_type: string
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          alt_text?: string | null
          bucket_id: string
          caption?: string | null
          category?: string
          created_at?: string | null
          file_name: string
          file_path: string
          file_size: number
          id?: string
          mime_type: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          alt_text?: string | null
          bucket_id?: string
          caption?: string | null
          category?: string
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          mime_type?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: []
      }
      model_3d: {
        Row: {
          component_id: string | null
          created_at: string
          default_y_position: number | null
          deprecated: boolean
          detail_level: number | null
          geometry_type: string
          has_doors: boolean | null
          has_drawers: boolean | null
          has_handles: boolean | null
          has_legs: boolean | null
          id: string
          model_type: Database["public"]["Enums"]["model_type"]
          primary_color: string
          primary_material: Database["public"]["Enums"]["material_type"]
          secondary_color: string | null
          secondary_material:
            | Database["public"]["Enums"]["material_type"]
            | null
          special_features: Json | null
          updated_at: string
          version: string
          wall_mounted: boolean | null
        }
        Insert: {
          component_id?: string | null
          created_at?: string
          default_y_position?: number | null
          deprecated?: boolean
          detail_level?: number | null
          geometry_type: string
          has_doors?: boolean | null
          has_drawers?: boolean | null
          has_handles?: boolean | null
          has_legs?: boolean | null
          id?: string
          model_type: Database["public"]["Enums"]["model_type"]
          primary_color?: string
          primary_material?: Database["public"]["Enums"]["material_type"]
          secondary_color?: string | null
          secondary_material?:
            | Database["public"]["Enums"]["material_type"]
            | null
          special_features?: Json | null
          updated_at?: string
          version?: string
          wall_mounted?: boolean | null
        }
        Update: {
          component_id?: string | null
          created_at?: string
          default_y_position?: number | null
          deprecated?: boolean
          detail_level?: number | null
          geometry_type?: string
          has_doors?: boolean | null
          has_drawers?: boolean | null
          has_handles?: boolean | null
          has_legs?: boolean | null
          id?: string
          model_type?: Database["public"]["Enums"]["model_type"]
          primary_color?: string
          primary_material?: Database["public"]["Enums"]["material_type"]
          secondary_color?: string | null
          secondary_material?:
            | Database["public"]["Enums"]["material_type"]
            | null
          special_features?: Json | null
          updated_at?: string
          version?: string
          wall_mounted?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "model_3d_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "components"
            referencedColumns: ["id"]
          },
        ]
      }
      model_3d_config: {
        Row: {
          component_id: string | null
          corner_door_style: string | null
          corner_interior_shelving: boolean | null
          created_at: string
          deprecated: boolean
          detail_level: number
          door_gap: number | null
          enable_detailed_handles: boolean
          enable_door_detail: boolean
          enable_realistic_lighting: boolean
          enable_wood_grain_texture: boolean
          handle_style: string | null
          id: string
          metal_finish: string | null
          metalness: number
          plinth_height: number | null
          primary_color: string
          primary_material: string
          roughness: number
          secondary_color: string | null
          transparency: number | null
          updated_at: string
          use_lod: boolean
          version: string
          wood_finish: string | null
        }
        Insert: {
          component_id?: string | null
          corner_door_style?: string | null
          corner_interior_shelving?: boolean | null
          created_at?: string
          deprecated?: boolean
          detail_level?: number
          door_gap?: number | null
          enable_detailed_handles?: boolean
          enable_door_detail?: boolean
          enable_realistic_lighting?: boolean
          enable_wood_grain_texture?: boolean
          handle_style?: string | null
          id?: string
          metal_finish?: string | null
          metalness?: number
          plinth_height?: number | null
          primary_color?: string
          primary_material?: string
          roughness?: number
          secondary_color?: string | null
          transparency?: number | null
          updated_at?: string
          use_lod?: boolean
          version?: string
          wood_finish?: string | null
        }
        Update: {
          component_id?: string | null
          corner_door_style?: string | null
          corner_interior_shelving?: boolean | null
          created_at?: string
          deprecated?: boolean
          detail_level?: number
          door_gap?: number | null
          enable_detailed_handles?: boolean
          enable_door_detail?: boolean
          enable_realistic_lighting?: boolean
          enable_wood_grain_texture?: boolean
          handle_style?: string | null
          id?: string
          metal_finish?: string | null
          metalness?: number
          plinth_height?: number | null
          primary_color?: string
          primary_material?: string
          roughness?: number
          secondary_color?: string | null
          transparency?: number | null
          updated_at?: string
          use_lod?: boolean
          version?: string
          wood_finish?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "model_3d_config_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "components"
            referencedColumns: ["id"]
          },
        ]
      }
      model_3d_patterns: {
        Row: {
          active: boolean
          config_overrides: Json
          created_at: string
          description: string | null
          element_type: string | null
          id: string
          id_includes: string[] | null
          name: string
          priority: number
          style_includes: string[] | null
        }
        Insert: {
          active?: boolean
          config_overrides?: Json
          created_at?: string
          description?: string | null
          element_type?: string | null
          id?: string
          id_includes?: string[] | null
          name: string
          priority?: number
          style_includes?: string[] | null
        }
        Update: {
          active?: boolean
          config_overrides?: Json
          created_at?: string
          description?: string | null
          element_type?: string | null
          id?: string
          id_includes?: string[] | null
          name?: string
          priority?: number
          style_includes?: string[] | null
        }
        Relationships: []
      }
      model_3d_variants: {
        Row: {
          feature_overrides: Json | null
          geometry_overrides: Json | null
          id: string
          id_pattern: string[] | null
          material_overrides: Json | null
          model_3d_id: string
          style_pattern: string[] | null
          variant_key: string
          variant_name: string
        }
        Insert: {
          feature_overrides?: Json | null
          geometry_overrides?: Json | null
          id?: string
          id_pattern?: string[] | null
          material_overrides?: Json | null
          model_3d_id: string
          style_pattern?: string[] | null
          variant_key: string
          variant_name: string
        }
        Update: {
          feature_overrides?: Json | null
          geometry_overrides?: Json | null
          id?: string
          id_pattern?: string[] | null
          material_overrides?: Json | null
          model_3d_id?: string
          style_pattern?: string[] | null
          variant_key?: string
          variant_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "model_3d_variants_model_3d_id_fkey"
            columns: ["model_3d_id"]
            isOneToOne: false
            referencedRelation: "model_3d"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          public_profile: boolean | null
          updated_at: string
          user_id: string
          user_tier: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          public_profile?: boolean | null
          updated_at?: string
          user_id: string
          user_tier?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          public_profile?: boolean | null
          updated_at?: string
          user_id?: string
          user_tier?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          name: string
          thumbnail_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name: string
          thumbnail_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name?: string
          thumbnail_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      regional_material_pricing: {
        Row: {
          availability_notes: string | null
          cost_per_lm_local: number | null
          cost_per_piece_local: number | null
          cost_per_sqm_local: number | null
          created_at: string
          exchange_rate_used: number | null
          hardware_id: string | null
          id: string
          is_available: boolean | null
          lead_time_days: number | null
          local_supplier_code: string | null
          local_supplier_name: string | null
          local_supplier_part_number: string | null
          material_id: string | null
          minimum_order_quantity: number | null
          price_last_updated: string | null
          region_id: string
          updated_at: string
        }
        Insert: {
          availability_notes?: string | null
          cost_per_lm_local?: number | null
          cost_per_piece_local?: number | null
          cost_per_sqm_local?: number | null
          created_at?: string
          exchange_rate_used?: number | null
          hardware_id?: string | null
          id?: string
          is_available?: boolean | null
          lead_time_days?: number | null
          local_supplier_code?: string | null
          local_supplier_name?: string | null
          local_supplier_part_number?: string | null
          material_id?: string | null
          minimum_order_quantity?: number | null
          price_last_updated?: string | null
          region_id: string
          updated_at?: string
        }
        Update: {
          availability_notes?: string | null
          cost_per_lm_local?: number | null
          cost_per_piece_local?: number | null
          cost_per_sqm_local?: number | null
          created_at?: string
          exchange_rate_used?: number | null
          hardware_id?: string | null
          id?: string
          is_available?: boolean | null
          lead_time_days?: number | null
          local_supplier_code?: string | null
          local_supplier_name?: string | null
          local_supplier_part_number?: string | null
          material_id?: string | null
          minimum_order_quantity?: number | null
          price_last_updated?: string | null
          region_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "regional_material_pricing_hardware_id_fkey"
            columns: ["hardware_id"]
            isOneToOne: false
            referencedRelation: "hardware"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "regional_material_pricing_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "regional_material_pricing_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      regional_tier_pricing: {
        Row: {
          annual_price_local: number | null
          created_at: string
          feature_adjustments: Json | null
          id: string
          is_active: boolean | null
          launch_date: string | null
          monthly_price_local: number
          price_adjustment_percent: number | null
          promotional_discount_percent: number | null
          promotional_end_date: string | null
          region_id: string
          setup_fee_local: number | null
          tier_id: string
        }
        Insert: {
          annual_price_local?: number | null
          created_at?: string
          feature_adjustments?: Json | null
          id?: string
          is_active?: boolean | null
          launch_date?: string | null
          monthly_price_local: number
          price_adjustment_percent?: number | null
          promotional_discount_percent?: number | null
          promotional_end_date?: string | null
          region_id: string
          setup_fee_local?: number | null
          tier_id: string
        }
        Update: {
          annual_price_local?: number | null
          created_at?: string
          feature_adjustments?: Json | null
          id?: string
          is_active?: boolean | null
          launch_date?: string | null
          monthly_price_local?: number
          price_adjustment_percent?: number | null
          promotional_discount_percent?: number | null
          promotional_end_date?: string | null
          region_id?: string
          setup_fee_local?: number | null
          tier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "regional_tier_pricing_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "regional_tier_pricing_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "user_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      regions: {
        Row: {
          country_codes: string[] | null
          created_at: string
          currency_code: string
          currency_multiplier: number
          currency_symbol: string
          default_tax_rate: number | null
          free_shipping_threshold: number | null
          id: string
          is_active: boolean
          launch_date: string | null
          minimum_order_value: number | null
          region_code: string
          region_name: string
          shipping_cost: number | null
          supports_delivery: boolean | null
          supports_installation: boolean | null
          supports_manufacturing: boolean | null
          tax_inclusive: boolean | null
          tax_name: string | null
          updated_at: string
        }
        Insert: {
          country_codes?: string[] | null
          created_at?: string
          currency_code: string
          currency_multiplier?: number
          currency_symbol: string
          default_tax_rate?: number | null
          free_shipping_threshold?: number | null
          id?: string
          is_active?: boolean
          launch_date?: string | null
          minimum_order_value?: number | null
          region_code: string
          region_name: string
          shipping_cost?: number | null
          supports_delivery?: boolean | null
          supports_installation?: boolean | null
          supports_manufacturing?: boolean | null
          tax_inclusive?: boolean | null
          tax_name?: string | null
          updated_at?: string
        }
        Update: {
          country_codes?: string[] | null
          created_at?: string
          currency_code?: string
          currency_multiplier?: number
          currency_symbol?: string
          default_tax_rate?: number | null
          free_shipping_threshold?: number | null
          id?: string
          is_active?: boolean
          launch_date?: string | null
          minimum_order_value?: number | null
          region_code?: string
          region_name?: string
          shipping_cost?: number | null
          supports_delivery?: boolean | null
          supports_installation?: boolean | null
          supports_manufacturing?: boolean | null
          tax_inclusive?: boolean | null
          tax_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      room_designs: {
        Row: {
          ceiling_height: number | null
          created_at: string
          design_elements: Json
          design_settings: Json
          floor_thickness: number | null
          id: string
          name: string | null
          project_id: string
          room_dimensions: Json
          room_style: Json | null
          room_type: string
          updated_at: string
          wall_height: number | null
        }
        Insert: {
          ceiling_height?: number | null
          created_at?: string
          design_elements?: Json
          design_settings?: Json
          floor_thickness?: number | null
          id?: string
          name?: string | null
          project_id: string
          room_dimensions?: Json
          room_style?: Json | null
          room_type: string
          updated_at?: string
          wall_height?: number | null
        }
        Update: {
          ceiling_height?: number | null
          created_at?: string
          design_elements?: Json
          design_settings?: Json
          floor_thickness?: number | null
          id?: string
          name?: string | null
          project_id?: string
          room_dimensions?: Json
          room_style?: Json | null
          room_type?: string
          updated_at?: string
          wall_height?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "room_designs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      room_type_templates: {
        Row: {
          created_at: string | null
          default_ceiling_height: number | null
          default_height: number
          default_settings: Json | null
          default_wall_height: number | null
          default_width: number
          description: string
          icon_name: string
          id: string
          name: string
          room_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_ceiling_height?: number | null
          default_height: number
          default_settings?: Json | null
          default_wall_height?: number | null
          default_width: number
          description: string
          icon_name: string
          id?: string
          name: string
          room_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_ceiling_height?: number | null
          default_height?: number
          default_settings?: Json | null
          default_wall_height?: number | null
          default_width?: number
          description?: string
          icon_name?: string
          id?: string
          name?: string
          room_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      room_types: {
        Row: {
          allowed_component_categories: string[] | null
          beta_description: string | null
          color_background: string | null
          color_primary: string
          color_secondary: string | null
          created_at: string
          default_component_categories: string[] | null
          default_depth: number | null
          default_height: number | null
          default_width: number | null
          display_order: number
          icon_name: string
          id: string
          is_active: boolean
          is_beta: boolean | null
          is_premium_feature: boolean | null
          minimum_tier_code: string | null
          room_code: string
          room_description_key: string | null
          room_features: Json | null
          room_name_key: string
          supports_2d_planning: boolean | null
          supports_3d_visualization: boolean | null
          supports_cost_calculation: boolean | null
          supports_export: boolean | null
          supports_measurements: boolean | null
          updated_at: string
        }
        Insert: {
          allowed_component_categories?: string[] | null
          beta_description?: string | null
          color_background?: string | null
          color_primary?: string
          color_secondary?: string | null
          created_at?: string
          default_component_categories?: string[] | null
          default_depth?: number | null
          default_height?: number | null
          default_width?: number | null
          display_order?: number
          icon_name: string
          id?: string
          is_active?: boolean
          is_beta?: boolean | null
          is_premium_feature?: boolean | null
          minimum_tier_code?: string | null
          room_code: string
          room_description_key?: string | null
          room_features?: Json | null
          room_name_key: string
          supports_2d_planning?: boolean | null
          supports_3d_visualization?: boolean | null
          supports_cost_calculation?: boolean | null
          supports_export?: boolean | null
          supports_measurements?: boolean | null
          updated_at?: string
        }
        Update: {
          allowed_component_categories?: string[] | null
          beta_description?: string | null
          color_background?: string | null
          color_primary?: string
          color_secondary?: string | null
          created_at?: string
          default_component_categories?: string[] | null
          default_depth?: number | null
          default_height?: number | null
          default_width?: number | null
          display_order?: number
          icon_name?: string
          id?: string
          is_active?: boolean
          is_beta?: boolean | null
          is_premium_feature?: boolean | null
          minimum_tier_code?: string | null
          room_code?: string
          room_description_key?: string | null
          room_features?: Json | null
          room_name_key?: string
          supports_2d_planning?: boolean | null
          supports_3d_visualization?: boolean | null
          supports_cost_calculation?: boolean | null
          supports_export?: boolean | null
          supports_measurements?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      translations: {
        Row: {
          created_at: string
          id: string
          is_approved: boolean | null
          language_code: string
          plural_forms: Json | null
          region_code: string | null
          reviewer_id: string | null
          translation_context: string | null
          translation_key: string
          translation_notes: string | null
          translation_value: string
          translator_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_approved?: boolean | null
          language_code: string
          plural_forms?: Json | null
          region_code?: string | null
          reviewer_id?: string | null
          translation_context?: string | null
          translation_key: string
          translation_notes?: string | null
          translation_value: string
          translator_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_approved?: boolean | null
          language_code?: string
          plural_forms?: Json | null
          region_code?: string | null
          reviewer_id?: string | null
          translation_context?: string | null
          translation_key?: string
          translation_notes?: string | null
          translation_value?: string
          translator_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ui_configurations: {
        Row: {
          brand_accent_color: string | null
          brand_background_color: string | null
          brand_favicon_url: string | null
          brand_logo_url: string | null
          brand_name: string | null
          brand_primary_color: string | null
          brand_secondary_color: string | null
          brand_text_color: string | null
          config_code: string
          config_description: string | null
          config_name: string
          created_at: string
          custom_css: string | null
          custom_javascript: string | null
          default_language: string | null
          font_family: string | null
          font_size_base: number | null
          font_weight_bold: number | null
          font_weight_normal: number | null
          header_height: number | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          is_public: boolean | null
          is_white_label: boolean | null
          menu_items: Json | null
          navigation_style: string | null
          panel_border_radius: number | null
          panel_shadow_intensity: string | null
          quick_actions: Json | null
          requires_tier_code: string | null
          room_ui_overrides: Json | null
          rtl_support: boolean | null
          show_feedback_button: boolean | null
          show_help_button: boolean | null
          show_logo: boolean | null
          show_powered_by: boolean | null
          show_user_menu: boolean | null
          show_version_info: boolean | null
          sidebar_width: number | null
          supported_languages: string[] | null
          updated_at: string
        }
        Insert: {
          brand_accent_color?: string | null
          brand_background_color?: string | null
          brand_favicon_url?: string | null
          brand_logo_url?: string | null
          brand_name?: string | null
          brand_primary_color?: string | null
          brand_secondary_color?: string | null
          brand_text_color?: string | null
          config_code: string
          config_description?: string | null
          config_name: string
          created_at?: string
          custom_css?: string | null
          custom_javascript?: string | null
          default_language?: string | null
          font_family?: string | null
          font_size_base?: number | null
          font_weight_bold?: number | null
          font_weight_normal?: number | null
          header_height?: number | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          is_public?: boolean | null
          is_white_label?: boolean | null
          menu_items?: Json | null
          navigation_style?: string | null
          panel_border_radius?: number | null
          panel_shadow_intensity?: string | null
          quick_actions?: Json | null
          requires_tier_code?: string | null
          room_ui_overrides?: Json | null
          rtl_support?: boolean | null
          show_feedback_button?: boolean | null
          show_help_button?: boolean | null
          show_logo?: boolean | null
          show_powered_by?: boolean | null
          show_user_menu?: boolean | null
          show_version_info?: boolean | null
          sidebar_width?: number | null
          supported_languages?: string[] | null
          updated_at?: string
        }
        Update: {
          brand_accent_color?: string | null
          brand_background_color?: string | null
          brand_favicon_url?: string | null
          brand_logo_url?: string | null
          brand_name?: string | null
          brand_primary_color?: string | null
          brand_secondary_color?: string | null
          brand_text_color?: string | null
          config_code?: string
          config_description?: string | null
          config_name?: string
          created_at?: string
          custom_css?: string | null
          custom_javascript?: string | null
          default_language?: string | null
          font_family?: string | null
          font_size_base?: number | null
          font_weight_bold?: number | null
          font_weight_normal?: number | null
          header_height?: number | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          is_public?: boolean | null
          is_white_label?: boolean | null
          menu_items?: Json | null
          navigation_style?: string | null
          panel_border_radius?: number | null
          panel_shadow_intensity?: string | null
          quick_actions?: Json | null
          requires_tier_code?: string | null
          room_ui_overrides?: Json | null
          rtl_support?: boolean | null
          show_feedback_button?: boolean | null
          show_help_button?: boolean | null
          show_logo?: boolean | null
          show_powered_by?: boolean | null
          show_user_menu?: boolean | null
          show_version_info?: boolean | null
          sidebar_width?: number | null
          supported_languages?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      user_tier_assignments: {
        Row: {
          api_calls_this_month: number | null
          billing_cycle: string | null
          created_at: string
          custom_discount_percent: number | null
          custom_pricing_notes: string | null
          designs_created_this_month: number | null
          exports_this_month: number | null
          id: string
          is_active: boolean | null
          last_payment_date: string | null
          next_billing_date: string | null
          payment_status: string | null
          region_id: string
          subscription_end: string | null
          subscription_start: string
          tier_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          api_calls_this_month?: number | null
          billing_cycle?: string | null
          created_at?: string
          custom_discount_percent?: number | null
          custom_pricing_notes?: string | null
          designs_created_this_month?: number | null
          exports_this_month?: number | null
          id?: string
          is_active?: boolean | null
          last_payment_date?: string | null
          next_billing_date?: string | null
          payment_status?: string | null
          region_id: string
          subscription_end?: string | null
          subscription_start?: string
          tier_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          api_calls_this_month?: number | null
          billing_cycle?: string | null
          created_at?: string
          custom_discount_percent?: number | null
          custom_pricing_notes?: string | null
          designs_created_this_month?: number | null
          exports_this_month?: number | null
          id?: string
          is_active?: boolean | null
          last_payment_date?: string | null
          next_billing_date?: string | null
          payment_status?: string | null
          region_id?: string
          subscription_end?: string | null
          subscription_start?: string
          tier_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_tier_assignments_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_tier_assignments_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "user_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_tiers: {
        Row: {
          annual_price_pence: number | null
          api_calls_per_month: number | null
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          is_legacy: boolean | null
          is_public: boolean | null
          manufacturing_discount_percent: number | null
          material_discount_percent: number | null
          max_components_per_design: number | null
          max_designs: number | null
          max_exports_per_month: number | null
          max_render_resolution: number | null
          max_rooms_per_design: number | null
          max_team_members: number | null
          monthly_price_pence: number
          setup_fee_pence: number | null
          support_level: string | null
          support_response_hours: number | null
          supports_3d_view: boolean | null
          supports_advanced_materials: boolean | null
          supports_client_sharing: boolean | null
          supports_cost_calculation: boolean | null
          supports_custom_branding: boolean | null
          supports_custom_domain: boolean | null
          supports_custom_integrations: boolean | null
          supports_custom_materials: boolean | null
          supports_cutting_lists: boolean | null
          supports_inventory_tracking: boolean | null
          supports_manufacturing_export: boolean | null
          supports_photorealistic_render: boolean | null
          supports_real_time_collaboration: boolean | null
          supports_supplier_integration: boolean | null
          supports_version_history: boolean | null
          supports_webhook_notifications: boolean | null
          supports_white_label: boolean | null
          tier_code: string
          tier_description: string | null
          tier_name: string
          updated_at: string
          volume_discount_percent: number | null
          volume_discount_threshold: number | null
        }
        Insert: {
          annual_price_pence?: number | null
          api_calls_per_month?: number | null
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          is_legacy?: boolean | null
          is_public?: boolean | null
          manufacturing_discount_percent?: number | null
          material_discount_percent?: number | null
          max_components_per_design?: number | null
          max_designs?: number | null
          max_exports_per_month?: number | null
          max_render_resolution?: number | null
          max_rooms_per_design?: number | null
          max_team_members?: number | null
          monthly_price_pence?: number
          setup_fee_pence?: number | null
          support_level?: string | null
          support_response_hours?: number | null
          supports_3d_view?: boolean | null
          supports_advanced_materials?: boolean | null
          supports_client_sharing?: boolean | null
          supports_cost_calculation?: boolean | null
          supports_custom_branding?: boolean | null
          supports_custom_domain?: boolean | null
          supports_custom_integrations?: boolean | null
          supports_custom_materials?: boolean | null
          supports_cutting_lists?: boolean | null
          supports_inventory_tracking?: boolean | null
          supports_manufacturing_export?: boolean | null
          supports_photorealistic_render?: boolean | null
          supports_real_time_collaboration?: boolean | null
          supports_supplier_integration?: boolean | null
          supports_version_history?: boolean | null
          supports_webhook_notifications?: boolean | null
          supports_white_label?: boolean | null
          tier_code: string
          tier_description?: string | null
          tier_name: string
          updated_at?: string
          volume_discount_percent?: number | null
          volume_discount_threshold?: number | null
        }
        Update: {
          annual_price_pence?: number | null
          api_calls_per_month?: number | null
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          is_legacy?: boolean | null
          is_public?: boolean | null
          manufacturing_discount_percent?: number | null
          material_discount_percent?: number | null
          max_components_per_design?: number | null
          max_designs?: number | null
          max_exports_per_month?: number | null
          max_render_resolution?: number | null
          max_rooms_per_design?: number | null
          max_team_members?: number | null
          monthly_price_pence?: number
          setup_fee_pence?: number | null
          support_level?: string | null
          support_response_hours?: number | null
          supports_3d_view?: boolean | null
          supports_advanced_materials?: boolean | null
          supports_client_sharing?: boolean | null
          supports_cost_calculation?: boolean | null
          supports_custom_branding?: boolean | null
          supports_custom_domain?: boolean | null
          supports_custom_integrations?: boolean | null
          supports_custom_materials?: boolean | null
          supports_cutting_lists?: boolean | null
          supports_inventory_tracking?: boolean | null
          supports_manufacturing_export?: boolean | null
          supports_photorealistic_render?: boolean | null
          supports_real_time_collaboration?: boolean | null
          supports_supplier_integration?: boolean | null
          supports_version_history?: boolean | null
          supports_webhook_notifications?: boolean | null
          supports_white_label?: boolean | null
          tier_code?: string
          tier_description?: string | null
          tier_name?: string
          updated_at?: string
          volume_discount_percent?: number | null
          volume_discount_threshold?: number | null
        }
        Relationships: []
      }
      user_ui_preferences: {
        Row: {
          analytics_enabled: boolean | null
          auto_save_interval: number | null
          color_scheme: string | null
          completed_onboarding: boolean | null
          crash_reporting_enabled: boolean | null
          created_at: string
          custom_shortcuts: Json | null
          date_format: string | null
          dismissed_tips: string[] | null
          enable_3d_acceleration: boolean | null
          font_size_adjustment: number | null
          grid_snap_enabled: boolean | null
          id: string
          max_undo_steps: number | null
          measurement_units: string | null
          panel_positions: Json | null
          preferred_language: string | null
          preferred_region: string | null
          render_quality: string | null
          room_preferences: Json | null
          show_animations: boolean | null
          show_tooltips: boolean | null
          show_welcome_tour: boolean | null
          sidebar_collapsed: boolean | null
          theme: string | null
          time_format: string | null
          timezone: string | null
          toolbar_customization: Json | null
          ui_config_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          analytics_enabled?: boolean | null
          auto_save_interval?: number | null
          color_scheme?: string | null
          completed_onboarding?: boolean | null
          crash_reporting_enabled?: boolean | null
          created_at?: string
          custom_shortcuts?: Json | null
          date_format?: string | null
          dismissed_tips?: string[] | null
          enable_3d_acceleration?: boolean | null
          font_size_adjustment?: number | null
          grid_snap_enabled?: boolean | null
          id?: string
          max_undo_steps?: number | null
          measurement_units?: string | null
          panel_positions?: Json | null
          preferred_language?: string | null
          preferred_region?: string | null
          render_quality?: string | null
          room_preferences?: Json | null
          show_animations?: boolean | null
          show_tooltips?: boolean | null
          show_welcome_tour?: boolean | null
          sidebar_collapsed?: boolean | null
          theme?: string | null
          time_format?: string | null
          timezone?: string | null
          toolbar_customization?: Json | null
          ui_config_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          analytics_enabled?: boolean | null
          auto_save_interval?: number | null
          color_scheme?: string | null
          completed_onboarding?: boolean | null
          crash_reporting_enabled?: boolean | null
          created_at?: string
          custom_shortcuts?: Json | null
          date_format?: string | null
          dismissed_tips?: string[] | null
          enable_3d_acceleration?: boolean | null
          font_size_adjustment?: number | null
          grid_snap_enabled?: boolean | null
          id?: string
          max_undo_steps?: number | null
          measurement_units?: string | null
          panel_positions?: Json | null
          preferred_language?: string | null
          preferred_region?: string | null
          render_quality?: string | null
          room_preferences?: Json | null
          show_animations?: boolean | null
          show_tooltips?: boolean | null
          show_welcome_tour?: boolean | null
          sidebar_collapsed?: boolean | null
          theme?: string | null
          time_format?: string | null
          timezone?: string | null
          toolbar_customization?: Json | null
          ui_config_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_ui_preferences_ui_config_id_fkey"
            columns: ["ui_config_id"]
            isOneToOne: false
            referencedRelation: "ui_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
      validation_rules: {
        Row: {
          applies_to_component_types: string[] | null
          applies_to_room_types: string[] | null
          configurable_parameters: Json | null
          created_at: string
          default_parameters: Json | null
          error_message_key: string
          id: string
          is_active: boolean | null
          is_beta: boolean | null
          is_blocking: boolean | null
          region_specific: boolean | null
          requires_tier_code: string | null
          rule_code: string
          rule_description_key: string | null
          rule_name_key: string
          rule_type: string
          severity: string | null
          updated_at: string
          validation_logic: Json
        }
        Insert: {
          applies_to_component_types?: string[] | null
          applies_to_room_types?: string[] | null
          configurable_parameters?: Json | null
          created_at?: string
          default_parameters?: Json | null
          error_message_key: string
          id?: string
          is_active?: boolean | null
          is_beta?: boolean | null
          is_blocking?: boolean | null
          region_specific?: boolean | null
          requires_tier_code?: string | null
          rule_code: string
          rule_description_key?: string | null
          rule_name_key: string
          rule_type: string
          severity?: string | null
          updated_at?: string
          validation_logic: Json
        }
        Update: {
          applies_to_component_types?: string[] | null
          applies_to_room_types?: string[] | null
          configurable_parameters?: Json | null
          created_at?: string
          default_parameters?: Json | null
          error_message_key?: string
          id?: string
          is_active?: boolean | null
          is_beta?: boolean | null
          is_blocking?: boolean | null
          region_specific?: boolean | null
          requires_tier_code?: string | null
          rule_code?: string
          rule_description_key?: string | null
          rule_name_key?: string
          rule_type?: string
          severity?: string | null
          updated_at?: string
          validation_logic?: Json
        }
        Relationships: []
      }
    }
    Views: {
      active_subscriptions: {
        Row: {
          avg_designs_per_user: number | null
          currency_code: string | null
          monthly_revenue_local: number | null
          region_name: string | null
          subscriber_count: number | null
          tier_name: string | null
        }
        Relationships: []
      }
      component_material_costs: {
        Row: {
          component_id: string | null
          component_name: string | null
          material_category: string | null
          material_name: string | null
          part_name: string | null
          quantity: number | null
          quantity_with_waste: number | null
          total_cost_pence: number | null
          unit: string | null
          unit_cost_pence: number | null
          waste_factor: number | null
        }
        Relationships: [
          {
            foreignKeyName: "component_materials_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "components"
            referencedColumns: ["id"]
          },
        ]
      }
      component_total_costs: {
        Row: {
          component_id: string | null
          component_name: string | null
          material_count: number | null
          total_material_cost_gbp: number | null
          total_material_cost_pence: number | null
        }
        Relationships: [
          {
            foreignKeyName: "component_materials_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "components"
            referencedColumns: ["id"]
          },
        ]
      }
      regional_revenue: {
        Row: {
          annual_revenue: number | null
          avg_designs_per_user: number | null
          currency_code: string | null
          currency_symbol: string | null
          monthly_revenue: number | null
          region_name: string | null
          total_subscribers: number | null
        }
        Relationships: []
      }
      room_types_localized: {
        Row: {
          allowed_component_categories: string[] | null
          beta_description: string | null
          color_background: string | null
          color_primary: string | null
          color_secondary: string | null
          created_at: string | null
          default_component_categories: string[] | null
          default_depth: number | null
          default_height: number | null
          default_width: number | null
          display_order: number | null
          icon_name: string | null
          id: string | null
          is_active: boolean | null
          is_beta: boolean | null
          is_premium_feature: boolean | null
          minimum_tier_code: string | null
          room_code: string | null
          room_description_en: string | null
          room_description_key: string | null
          room_features: Json | null
          room_name_en: string | null
          room_name_key: string | null
          supports_2d_planning: boolean | null
          supports_3d_visualization: boolean | null
          supports_cost_calculation: boolean | null
          supports_export: boolean | null
          supports_measurements: boolean | null
          updated_at: string | null
        }
        Insert: {
          allowed_component_categories?: string[] | null
          beta_description?: string | null
          color_background?: string | null
          color_primary?: string | null
          color_secondary?: string | null
          created_at?: string | null
          default_component_categories?: string[] | null
          default_depth?: number | null
          default_height?: number | null
          default_width?: number | null
          display_order?: number | null
          icon_name?: string | null
          id?: string | null
          is_active?: boolean | null
          is_beta?: boolean | null
          is_premium_feature?: boolean | null
          minimum_tier_code?: string | null
          room_code?: string | null
          room_description_en?: never
          room_description_key?: string | null
          room_features?: Json | null
          room_name_en?: never
          room_name_key?: string | null
          supports_2d_planning?: boolean | null
          supports_3d_visualization?: boolean | null
          supports_cost_calculation?: boolean | null
          supports_export?: boolean | null
          supports_measurements?: boolean | null
          updated_at?: string | null
        }
        Update: {
          allowed_component_categories?: string[] | null
          beta_description?: string | null
          color_background?: string | null
          color_primary?: string | null
          color_secondary?: string | null
          created_at?: string | null
          default_component_categories?: string[] | null
          default_depth?: number | null
          default_height?: number | null
          default_width?: number | null
          display_order?: number | null
          icon_name?: string | null
          id?: string | null
          is_active?: boolean | null
          is_beta?: boolean | null
          is_premium_feature?: boolean | null
          minimum_tier_code?: string | null
          room_code?: string | null
          room_description_en?: never
          room_description_key?: string | null
          room_features?: Json | null
          room_name_en?: never
          room_name_key?: string | null
          supports_2d_planning?: boolean | null
          supports_3d_visualization?: boolean | null
          supports_cost_calculation?: boolean | null
          supports_export?: boolean | null
          supports_measurements?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_preferences_summary: {
        Row: {
          brand_name: string | null
          currency_code: string | null
          is_white_label: boolean | null
          measurement_units: string | null
          preferred_language: string | null
          region_name: string | null
          theme: string | null
          ui_config_name: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_3d_config_for_element: {
        Args: {
          element_id: string
          element_style?: string
          element_type: string
        }
        Returns: {
          config_id: string
          door_gap: number
          enable_detailed_handles: boolean
          handle_style: string
          metalness: number
          plinth_height: number
          primary_color: string
          primary_material: string
          roughness: number
        }[]
      }
      get_3d_model_for_component: {
        Args: { comp_id: string }
        Returns: {
          geometry_type: string
          has_doors: boolean
          has_drawers: boolean
          model_id: string
          model_type: Database["public"]["Enums"]["model_type"]
          primary_color: string
          primary_material: Database["public"]["Enums"]["material_type"]
          special_features: Json
        }[]
      }
      get_3d_model_variant: {
        Args: { comp_id: string; element_id: string; element_style?: string }
        Returns: {
          feature_overrides: Json
          geometry_overrides: Json
          material_overrides: Json
          variant_id: string
          variant_key: string
          variant_name: string
        }[]
      }
      get_component_by_id: {
        Args: { component_id_param: string; version_param?: string }
        Returns: {
          category: string
          color: string
          component_id: string
          deprecated: boolean
          depth: number
          description: string
          height: number
          icon_name: string
          id: string
          metadata: Json
          name: string
          room_types: string[]
          tags: string[]
          type: string
          version: string
          width: number
        }[]
      }
      get_components_by_room_type: {
        Args: { room_type_param: string }
        Returns: {
          category: string
          color: string
          component_id: string
          deprecated: boolean
          depth: number
          description: string
          height: number
          icon_name: string
          id: string
          metadata: Json
          name: string
          room_types: string[]
          tags: string[]
          type: string
          version: string
          width: number
        }[]
      }
      get_design_cutting_list: {
        Args: { design_id_param: string }
        Returns: {
          category: string
          material_name: string
          supplier_name: string
          total_cost_pence: number
          total_quantity: number
          unit: string
        }[]
      }
      get_design_total_cost: {
        Args: { design_id_param: string }
        Returns: {
          total_cost_gbp: number
          total_cost_pence: number
          total_hardware_cost_pence: number
          total_material_cost_pence: number
        }[]
      }
      get_tier_level: {
        Args: { tier_name: string }
        Returns: number
      }
      get_translation: {
        Args: {
          key_param: string
          language_param?: string
          region_param?: string
        }
        Returns: string
      }
      get_user_design_cost: {
        Args: { design_id_param: string; user_id_param: string }
        Returns: {
          currency_code: string
          currency_symbol: string
          discount_percent: number
          total_base_cost_local: number
          total_discount_amount_local: number
          total_discounted_cost_local: number
        }[]
      }
      get_user_material_price: {
        Args: {
          hardware_id_param?: string
          material_id_param?: string
          user_id_param: string
        }
        Returns: {
          base_price_local: number
          currency_code: string
          currency_symbol: string
          discount_percent: number
          discounted_price_local: number
        }[]
      }
      get_user_ui_config: {
        Args: { user_id_param: string }
        Returns: Json
      }
      user_has_tier_level: {
        Args: { required_tier: string; user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      material_type:
        | "wood"
        | "metal"
        | "glass"
        | "plastic"
        | "fabric"
        | "ceramic"
        | "stone"
        | "composite"
      model_type:
        | "cabinet"
        | "appliance"
        | "counter-top"
        | "end-panel"
        | "window"
        | "door"
        | "flooring"
        | "toe-kick"
        | "cornice"
        | "pelmet"
        | "wall-unit-end-panel"
        | "furniture"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      material_type: [
        "wood",
        "metal",
        "glass",
        "plastic",
        "fabric",
        "ceramic",
        "stone",
        "composite",
      ],
      model_type: [
        "cabinet",
        "appliance",
        "counter-top",
        "end-panel",
        "window",
        "door",
        "flooring",
        "toe-kick",
        "cornice",
        "pelmet",
        "wall-unit-end-panel",
        "furniture",
      ],
    },
  },
} as const
