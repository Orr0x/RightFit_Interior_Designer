-- Room Types & UI Configuration System
-- Phase 3: Customization & Localization Engine
-- Created: 2025-09-14
-- Purpose: Enable multi-language, white-label, and complete UI customization

-- =============================================================================
-- PART 1: ROOM TYPES TABLE
-- =============================================================================

-- Configurable room types with localization support
CREATE TABLE IF NOT EXISTS public.room_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Room identification
  room_code VARCHAR(30) UNIQUE NOT NULL, -- 'kitchen', 'bedroom', 'living_room'
  room_name_key VARCHAR(50) NOT NULL, -- Translation key: 'room.kitchen.name'
  room_description_key VARCHAR(50), -- Translation key: 'room.kitchen.description'
  
  -- Visual properties
  icon_name VARCHAR(30) NOT NULL, -- 'ChefHat', 'Bed', 'Sofa'
  color_primary VARCHAR(7) NOT NULL DEFAULT '#3B82F6', -- Primary brand color
  color_secondary VARCHAR(7) DEFAULT '#1E40AF', -- Secondary/accent color
  color_background VARCHAR(7) DEFAULT '#F8FAFC', -- Background color
  
  -- Room capabilities
  supports_2d_planning BOOLEAN DEFAULT true,
  supports_3d_visualization BOOLEAN DEFAULT true,
  supports_measurements BOOLEAN DEFAULT true,
  supports_cost_calculation BOOLEAN DEFAULT true,
  supports_export BOOLEAN DEFAULT true,
  
  -- Default room dimensions (in cm)
  default_width INTEGER DEFAULT 400, -- 4m
  default_height INTEGER DEFAULT 240, -- 2.4m
  default_depth INTEGER DEFAULT 300, -- 3m
  
  -- Component categories allowed in this room
  allowed_component_categories TEXT[], -- ['cabinet', 'appliance', 'countertop']
  default_component_categories TEXT[], -- Categories shown by default
  
  -- Room-specific features
  room_features JSONB, -- Custom features per room type
  
  -- Display and ordering
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_premium_feature BOOLEAN DEFAULT false, -- Requires paid tier
  minimum_tier_code VARCHAR(20), -- Minimum tier required
  
  -- Status
  is_beta BOOLEAN DEFAULT false,
  beta_description TEXT
);

-- =============================================================================
-- PART 2: UI CONFIGURATION TABLE
-- =============================================================================

-- Complete UI configuration and customization
CREATE TABLE IF NOT EXISTS public.ui_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Configuration identification
  config_code VARCHAR(30) UNIQUE NOT NULL, -- 'default', 'rightfit', 'white_label_1'
  config_name VARCHAR(100) NOT NULL,
  config_description TEXT,
  
  -- Branding and theming
  brand_name VARCHAR(100) DEFAULT 'RightFit Interior Designer',
  brand_logo_url TEXT,
  brand_favicon_url TEXT,
  brand_primary_color VARCHAR(7) DEFAULT '#3B82F6',
  brand_secondary_color VARCHAR(7) DEFAULT '#1E40AF',
  brand_accent_color VARCHAR(7) DEFAULT '#F59E0B',
  brand_text_color VARCHAR(7) DEFAULT '#1F2937',
  brand_background_color VARCHAR(7) DEFAULT '#FFFFFF',
  
  -- Typography
  font_family VARCHAR(100) DEFAULT 'Inter, system-ui, sans-serif',
  font_size_base INTEGER DEFAULT 16, -- Base font size in px
  font_weight_normal INTEGER DEFAULT 400,
  font_weight_bold INTEGER DEFAULT 600,
  
  -- Layout configuration
  sidebar_width INTEGER DEFAULT 320, -- Sidebar width in px
  header_height INTEGER DEFAULT 64, -- Header height in px
  panel_border_radius INTEGER DEFAULT 8, -- Border radius in px
  panel_shadow_intensity VARCHAR(20) DEFAULT 'medium', -- 'none', 'light', 'medium', 'heavy'
  
  -- Feature toggles
  show_logo BOOLEAN DEFAULT true,
  show_user_menu BOOLEAN DEFAULT true,
  show_help_button BOOLEAN DEFAULT true,
  show_feedback_button BOOLEAN DEFAULT true,
  show_version_info BOOLEAN DEFAULT false,
  show_powered_by BOOLEAN DEFAULT true,
  
  -- Navigation and menu
  navigation_style VARCHAR(20) DEFAULT 'sidebar', -- 'sidebar', 'top_nav', 'hybrid'
  menu_items JSONB, -- Custom menu structure
  quick_actions JSONB, -- Quick action buttons
  
  -- Room-specific UI settings
  room_ui_overrides JSONB, -- Per-room UI customizations
  
  -- Advanced customization
  custom_css TEXT, -- Custom CSS injection
  custom_javascript TEXT, -- Custom JS (Enterprise only)
  
  -- Localization
  default_language VARCHAR(10) DEFAULT 'en-GB',
  supported_languages TEXT[] DEFAULT ARRAY['en-GB'],
  rtl_support BOOLEAN DEFAULT false, -- Right-to-left languages
  
  -- Business rules
  is_default BOOLEAN DEFAULT false,
  is_white_label BOOLEAN DEFAULT false,
  requires_tier_code VARCHAR(20), -- Minimum tier for this config
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT false -- Can be selected by users
);

-- =============================================================================
-- PART 3: TRANSLATIONS TABLE
-- =============================================================================

-- Multi-language translation system
CREATE TABLE IF NOT EXISTS public.translations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Translation identification
  translation_key VARCHAR(100) NOT NULL, -- 'room.kitchen.name'
  language_code VARCHAR(10) NOT NULL, -- 'en-GB', 'en-US', 'fr-FR', 'de-DE'
  region_code VARCHAR(10), -- Optional region override
  
  -- Translation content
  translation_value TEXT NOT NULL,
  translation_context TEXT, -- Context for translators
  translation_notes TEXT, -- Notes for translators
  
  -- Pluralization support
  plural_forms JSONB, -- {one: "item", other: "items"}
  
  -- Status and quality
  is_approved BOOLEAN DEFAULT false,
  translator_id UUID, -- Who translated this
  reviewer_id UUID, -- Who reviewed this
  
  -- Constraints
  CONSTRAINT unique_translation UNIQUE(translation_key, language_code, region_code)
);

-- =============================================================================
-- PART 4: KEYBOARD SHORTCUTS TABLE
-- =============================================================================

-- Configurable keyboard shortcuts
CREATE TABLE IF NOT EXISTS public.keyboard_shortcuts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Shortcut identification
  shortcut_code VARCHAR(50) UNIQUE NOT NULL, -- 'save_design', 'toggle_3d'
  shortcut_name_key VARCHAR(50) NOT NULL, -- Translation key
  shortcut_description_key VARCHAR(50),
  
  -- Shortcut definition
  key_combination VARCHAR(50) NOT NULL, -- 'Ctrl+S', 'Alt+3', 'Shift+Ctrl+E'
  action_type VARCHAR(30) NOT NULL, -- 'function', 'navigation', 'toggle'
  action_target VARCHAR(100) NOT NULL, -- Function name or route
  
  -- Context and scope
  context VARCHAR(30) DEFAULT 'global', -- 'global', 'designer', 'room_specific'
  room_types TEXT[], -- Specific room types if room_specific
  
  -- User customization
  is_customizable BOOLEAN DEFAULT true,
  is_enabled_by_default BOOLEAN DEFAULT true,
  
  -- Tier requirements
  minimum_tier_code VARCHAR(20), -- Tier required for this shortcut
  
  -- Categories for organization
  category VARCHAR(30) DEFAULT 'general', -- 'general', 'design', 'view', 'export'
  display_order INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true
);

-- =============================================================================
-- PART 5: USER UI PREFERENCES
-- =============================================================================

-- Individual user UI preferences and customizations
CREATE TABLE IF NOT EXISTS public.user_ui_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- User identification
  user_id UUID NOT NULL, -- References auth.users(id)
  
  -- UI Configuration
  ui_config_id UUID REFERENCES public.ui_configurations(id),
  
  -- Language and localization
  preferred_language VARCHAR(10) DEFAULT 'en-GB',
  preferred_region VARCHAR(10),
  timezone VARCHAR(50) DEFAULT 'Europe/London',
  date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
  time_format VARCHAR(10) DEFAULT '24h', -- '12h' or '24h'
  measurement_units VARCHAR(10) DEFAULT 'metric', -- 'metric' or 'imperial'
  
  -- Theme preferences
  theme VARCHAR(20) DEFAULT 'light', -- 'light', 'dark', 'auto'
  color_scheme VARCHAR(20) DEFAULT 'default', -- 'default', 'high_contrast', 'colorblind'
  font_size_adjustment INTEGER DEFAULT 0, -- -2 to +4 size adjustment
  
  -- Layout preferences
  sidebar_collapsed BOOLEAN DEFAULT false,
  panel_positions JSONB, -- Custom panel positions
  toolbar_customization JSONB, -- Custom toolbar layout
  
  -- Feature preferences
  show_tooltips BOOLEAN DEFAULT true,
  show_animations BOOLEAN DEFAULT true,
  auto_save_interval INTEGER DEFAULT 30, -- Seconds
  grid_snap_enabled BOOLEAN DEFAULT true,
  
  -- Keyboard shortcuts customization
  custom_shortcuts JSONB, -- User's custom shortcut overrides
  
  -- Room-specific preferences
  room_preferences JSONB, -- Per-room settings
  
  -- Onboarding and help
  completed_onboarding BOOLEAN DEFAULT false,
  show_welcome_tour BOOLEAN DEFAULT true,
  dismissed_tips TEXT[], -- Array of dismissed tip IDs
  
  -- Performance preferences
  enable_3d_acceleration BOOLEAN DEFAULT true,
  render_quality VARCHAR(20) DEFAULT 'high', -- 'low', 'medium', 'high', 'ultra'
  max_undo_steps INTEGER DEFAULT 50,
  
  -- Privacy preferences
  analytics_enabled BOOLEAN DEFAULT true,
  crash_reporting_enabled BOOLEAN DEFAULT true,
  
  -- Constraints
  CONSTRAINT unique_user_preferences UNIQUE(user_id)
);

-- =============================================================================
-- PART 6: COMPONENT METADATA TABLE
-- =============================================================================

-- Extended metadata for components with localization
CREATE TABLE IF NOT EXISTS public.component_metadata (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Component reference
  component_id UUID NOT NULL REFERENCES public.components(id) ON DELETE CASCADE,
  
  -- Localized content
  name_key VARCHAR(50), -- Translation key for name
  description_key VARCHAR(50), -- Translation key for description
  category_key VARCHAR(50), -- Translation key for category
  
  -- Manufacturing metadata
  manufacturer VARCHAR(100),
  model_number VARCHAR(50),
  sku VARCHAR(50),
  barcode VARCHAR(50),
  
  -- Specifications
  specifications JSONB, -- Detailed technical specs
  certifications TEXT[], -- CE, ISO, etc.
  warranty_months INTEGER,
  
  -- Installation and assembly
  installation_complexity VARCHAR(20) DEFAULT 'medium', -- 'easy', 'medium', 'hard', 'professional'
  assembly_time_minutes INTEGER,
  tools_required TEXT[],
  installation_notes_key VARCHAR(50), -- Translation key
  
  -- Sustainability and compliance
  eco_rating VARCHAR(10), -- A+, A, B, C, D, E, F
  recycling_info_key VARCHAR(50),
  compliance_standards TEXT[], -- Standards compliance
  
  -- Business metadata
  launch_date DATE,
  discontinue_date DATE,
  replacement_component_id UUID REFERENCES public.components(id),
  
  -- SEO and marketing
  seo_keywords TEXT[],
  marketing_tags TEXT[],
  
  -- Constraints
  CONSTRAINT unique_component_metadata UNIQUE(component_id)
);

-- =============================================================================
-- PART 7: VALIDATION RULES TABLE
-- =============================================================================

-- Configurable design validation rules
CREATE TABLE IF NOT EXISTS public.validation_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Rule identification
  rule_code VARCHAR(50) UNIQUE NOT NULL, -- 'min_cabinet_width', 'appliance_clearance'
  rule_name_key VARCHAR(50) NOT NULL, -- Translation key
  rule_description_key VARCHAR(50),
  
  -- Rule definition
  rule_type VARCHAR(30) NOT NULL, -- 'dimension', 'spacing', 'compatibility', 'count'
  validation_logic JSONB NOT NULL, -- Rule logic definition
  error_message_key VARCHAR(50) NOT NULL, -- Translation key for error
  
  -- Scope and context
  applies_to_room_types TEXT[], -- Room types this rule applies to
  applies_to_component_types TEXT[], -- Component types
  
  -- Rule severity
  severity VARCHAR(20) DEFAULT 'error', -- 'warning', 'error', 'info'
  is_blocking BOOLEAN DEFAULT true, -- Prevents save if violated
  
  -- Business rules
  requires_tier_code VARCHAR(20), -- Tier required for this validation
  region_specific BOOLEAN DEFAULT false,
  
  -- Rule parameters
  configurable_parameters JSONB, -- User-adjustable parameters
  default_parameters JSONB,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_beta BOOLEAN DEFAULT false
);

-- =============================================================================
-- PART 8: INDEXES FOR PERFORMANCE
-- =============================================================================

-- Room types indexes
CREATE INDEX IF NOT EXISTS idx_room_types_code ON public.room_types(room_code);
CREATE INDEX IF NOT EXISTS idx_room_types_active ON public.room_types(is_active);
CREATE INDEX IF NOT EXISTS idx_room_types_premium ON public.room_types(is_premium_feature);

-- UI configurations indexes
CREATE INDEX IF NOT EXISTS idx_ui_configurations_code ON public.ui_configurations(config_code);
CREATE INDEX IF NOT EXISTS idx_ui_configurations_active ON public.ui_configurations(is_active);
CREATE INDEX IF NOT EXISTS idx_ui_configurations_public ON public.ui_configurations(is_public);

-- Translations indexes
CREATE INDEX IF NOT EXISTS idx_translations_key ON public.translations(translation_key);
CREATE INDEX IF NOT EXISTS idx_translations_language ON public.translations(language_code);
CREATE INDEX IF NOT EXISTS idx_translations_approved ON public.translations(is_approved);

-- Keyboard shortcuts indexes
CREATE INDEX IF NOT EXISTS idx_keyboard_shortcuts_code ON public.keyboard_shortcuts(shortcut_code);
CREATE INDEX IF NOT EXISTS idx_keyboard_shortcuts_context ON public.keyboard_shortcuts(context);
CREATE INDEX IF NOT EXISTS idx_keyboard_shortcuts_active ON public.keyboard_shortcuts(is_active);

-- User UI preferences indexes
CREATE INDEX IF NOT EXISTS idx_user_ui_preferences_user ON public.user_ui_preferences(user_id);

-- Component metadata indexes
CREATE INDEX IF NOT EXISTS idx_component_metadata_component ON public.component_metadata(component_id);

-- Validation rules indexes
CREATE INDEX IF NOT EXISTS idx_validation_rules_code ON public.validation_rules(rule_code);
CREATE INDEX IF NOT EXISTS idx_validation_rules_type ON public.validation_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_validation_rules_active ON public.validation_rules(is_active);

-- =============================================================================
-- PART 9: FUNCTIONS FOR LOCALIZATION
-- =============================================================================

-- Function to get translated text
CREATE OR REPLACE FUNCTION get_translation(
  key_param VARCHAR(100),
  language_param VARCHAR(10) DEFAULT 'en-GB',
  region_param VARCHAR(10) DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  translation_text TEXT;
BEGIN
  -- Try region-specific translation first
  IF region_param IS NOT NULL THEN
    SELECT translation_value INTO translation_text
    FROM translations 
    WHERE translation_key = key_param 
      AND language_code = language_param 
      AND region_code = region_param
      AND is_approved = true
    LIMIT 1;
    
    IF translation_text IS NOT NULL THEN
      RETURN translation_text;
    END IF;
  END IF;
  
  -- Fall back to language-only translation
  SELECT translation_value INTO translation_text
  FROM translations 
  WHERE translation_key = key_param 
    AND language_code = language_param 
    AND region_code IS NULL
    AND is_approved = true
  LIMIT 1;
  
  IF translation_text IS NOT NULL THEN
    RETURN translation_text;
  END IF;
  
  -- Fall back to default English
  SELECT translation_value INTO translation_text
  FROM translations 
  WHERE translation_key = key_param 
    AND language_code = 'en-GB'
    AND is_approved = true
  LIMIT 1;
  
  -- If still no translation, return the key
  RETURN COALESCE(translation_text, key_param);
END;
$$ LANGUAGE plpgsql;

-- Function to get user's effective UI configuration
CREATE OR REPLACE FUNCTION get_user_ui_config(user_id_param UUID)
RETURNS JSONB AS $$
DECLARE
  user_config JSONB;
  base_config JSONB;
BEGIN
  -- Get user's preferences
  SELECT row_to_json(uup)::jsonb INTO user_config
  FROM user_ui_preferences uup
  WHERE uup.user_id = user_id_param;
  
  -- Get base UI configuration
  SELECT row_to_json(uic)::jsonb INTO base_config
  FROM ui_configurations uic
  JOIN user_ui_preferences uup ON uic.id = uup.ui_config_id
  WHERE uup.user_id = user_id_param;
  
  -- If no user config, use default
  IF base_config IS NULL THEN
    SELECT row_to_json(uic)::jsonb INTO base_config
    FROM ui_configurations uic
    WHERE uic.is_default = true
    LIMIT 1;
  END IF;
  
  -- Merge configurations (user preferences override base config)
  RETURN COALESCE(base_config, '{}'::jsonb) || COALESCE(user_config, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- PART 10: VIEWS FOR BUSINESS LOGIC
-- =============================================================================

-- Active room types with translations
CREATE OR REPLACE VIEW room_types_localized AS
SELECT 
  rt.*,
  get_translation(rt.room_name_key, 'en-GB') as room_name_en,
  get_translation(rt.room_description_key, 'en-GB') as room_description_en
FROM room_types rt
WHERE rt.is_active = true
ORDER BY rt.display_order;

-- User preferences summary
CREATE OR REPLACE VIEW user_preferences_summary AS
SELECT 
  uup.user_id,
  uup.preferred_language,
  uup.theme,
  uup.measurement_units,
  uic.config_name as ui_config_name,
  uic.brand_name,
  uic.is_white_label,
  r.region_name,
  r.currency_code
FROM user_ui_preferences uup
LEFT JOIN ui_configurations uic ON uup.ui_config_id = uic.id
LEFT JOIN user_tier_assignments uta ON uup.user_id = uta.user_id AND uta.is_active = true
LEFT JOIN regions r ON uta.region_id = r.id;

-- =============================================================================
-- PART 11: ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ui_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keyboard_shortcuts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ui_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.component_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.validation_rules ENABLE ROW LEVEL SECURITY;

-- Basic read policies
CREATE POLICY "Room types are viewable by everyone" ON public.room_types FOR SELECT USING (is_active = true);
CREATE POLICY "UI configurations are viewable by authorized users" ON public.ui_configurations FOR SELECT USING (is_public = true OR is_default = true);
CREATE POLICY "Translations are viewable by everyone" ON public.translations FOR SELECT USING (is_approved = true);
CREATE POLICY "Keyboard shortcuts are viewable by everyone" ON public.keyboard_shortcuts FOR SELECT USING (is_active = true);
CREATE POLICY "Users can view their own preferences" ON public.user_ui_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Component metadata is viewable by everyone" ON public.component_metadata FOR SELECT USING (true);
CREATE POLICY "Validation rules are viewable by everyone" ON public.validation_rules FOR SELECT USING (is_active = true);
