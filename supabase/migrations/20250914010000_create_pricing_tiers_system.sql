-- Dynamic Pricing & User Tiers System
-- Phase 2: Global Pricing Engine
-- Created: 2025-09-14
-- Purpose: Enable regional pricing, user tiers, and dynamic business models

-- =============================================================================
-- PART 1: REGIONS & CURRENCIES TABLE
-- =============================================================================

-- Regional markets with currency and tax information
CREATE TABLE IF NOT EXISTS public.regions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Region identification
  region_code VARCHAR(10) UNIQUE NOT NULL, -- 'UK', 'EU', 'US', 'CA', 'AU'
  region_name VARCHAR(50) NOT NULL,
  country_codes TEXT[], -- ['GB', 'IE'] for UK region
  
  -- Currency settings
  currency_code VARCHAR(3) NOT NULL, -- 'GBP', 'EUR', 'USD'
  currency_symbol VARCHAR(5) NOT NULL, -- '£', '€', '$'
  currency_multiplier DECIMAL(8,4) NOT NULL DEFAULT 1.0000, -- Conversion from base currency
  
  -- Tax and business settings
  default_tax_rate DECIMAL(5,4) DEFAULT 0.2000, -- 20% VAT in UK
  tax_name VARCHAR(20) DEFAULT 'VAT', -- 'VAT', 'Sales Tax', 'GST'
  tax_inclusive BOOLEAN DEFAULT true, -- Prices include tax
  
  -- Business rules
  minimum_order_value INTEGER DEFAULT 0, -- In local currency minor units
  shipping_cost INTEGER DEFAULT 0, -- Standard shipping cost
  free_shipping_threshold INTEGER, -- Free shipping over this amount
  
  -- Regional features
  supports_manufacturing BOOLEAN DEFAULT true,
  supports_installation BOOLEAN DEFAULT false,
  supports_delivery BOOLEAN DEFAULT true,
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  launch_date DATE,
  
  -- Constraints
  CONSTRAINT valid_tax_rate CHECK (default_tax_rate >= 0 AND default_tax_rate <= 1),
  CONSTRAINT valid_multiplier CHECK (currency_multiplier > 0)
);

-- =============================================================================
-- PART 2: USER TIERS TABLE
-- =============================================================================

-- User subscription tiers with capabilities and pricing
CREATE TABLE IF NOT EXISTS public.user_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Tier identification
  tier_code VARCHAR(20) UNIQUE NOT NULL, -- 'FREE', 'BASIC', 'PRO', 'ENTERPRISE'
  tier_name VARCHAR(50) NOT NULL,
  tier_description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  
  -- Pricing (in pence/cents for base currency)
  monthly_price_pence INTEGER NOT NULL DEFAULT 0,
  annual_price_pence INTEGER, -- Annual discount pricing
  setup_fee_pence INTEGER DEFAULT 0,
  
  -- Design capabilities
  max_designs INTEGER, -- NULL = unlimited
  max_rooms_per_design INTEGER DEFAULT 1,
  max_components_per_design INTEGER, -- NULL = unlimited
  max_exports_per_month INTEGER, -- NULL = unlimited
  
  -- 3D and visualization features
  supports_3d_view BOOLEAN DEFAULT true,
  supports_advanced_materials BOOLEAN DEFAULT false,
  supports_custom_materials BOOLEAN DEFAULT false,
  supports_photorealistic_render BOOLEAN DEFAULT false,
  max_render_resolution INTEGER DEFAULT 1080, -- Max height in pixels
  
  -- Manufacturing and business features
  supports_cutting_lists BOOLEAN DEFAULT false,
  supports_cost_calculation BOOLEAN DEFAULT false,
  supports_supplier_integration BOOLEAN DEFAULT false,
  supports_manufacturing_export BOOLEAN DEFAULT false,
  supports_inventory_tracking BOOLEAN DEFAULT false,
  
  -- Collaboration features
  max_team_members INTEGER DEFAULT 1,
  supports_client_sharing BOOLEAN DEFAULT false,
  supports_real_time_collaboration BOOLEAN DEFAULT false,
  supports_version_history BOOLEAN DEFAULT false,
  
  -- API and integration features
  api_calls_per_month INTEGER, -- NULL = unlimited
  supports_webhook_notifications BOOLEAN DEFAULT false,
  supports_custom_integrations BOOLEAN DEFAULT false,
  
  -- Support level
  support_level VARCHAR(20) DEFAULT 'community', -- 'community', 'email', 'priority', 'dedicated'
  support_response_hours INTEGER, -- Target response time
  
  -- Discounting capabilities
  material_discount_percent DECIMAL(5,2) DEFAULT 0.00, -- % discount on materials
  manufacturing_discount_percent DECIMAL(5,2) DEFAULT 0.00,
  volume_discount_threshold INTEGER, -- Orders over this get extra discount
  volume_discount_percent DECIMAL(5,2) DEFAULT 0.00,
  
  -- White label and customization
  supports_white_label BOOLEAN DEFAULT false,
  supports_custom_branding BOOLEAN DEFAULT false,
  supports_custom_domain BOOLEAN DEFAULT false,
  
  -- Status and visibility
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_public BOOLEAN DEFAULT true, -- Show on pricing page
  is_legacy BOOLEAN DEFAULT false, -- Grandfathered plans
  
  -- Constraints
  CONSTRAINT valid_discount CHECK (
    material_discount_percent >= 0 AND material_discount_percent <= 100 AND
    manufacturing_discount_percent >= 0 AND manufacturing_discount_percent <= 100 AND
    volume_discount_percent >= 0 AND volume_discount_percent <= 100
  )
);

-- =============================================================================
-- PART 3: REGIONAL TIER PRICING TABLE
-- =============================================================================

-- Region-specific pricing for each tier
CREATE TABLE IF NOT EXISTS public.regional_tier_pricing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Relationships
  tier_id UUID NOT NULL REFERENCES public.user_tiers(id) ON DELETE CASCADE,
  region_id UUID NOT NULL REFERENCES public.regions(id) ON DELETE CASCADE,
  
  -- Regional pricing (in local currency minor units)
  monthly_price_local INTEGER NOT NULL,
  annual_price_local INTEGER,
  setup_fee_local INTEGER DEFAULT 0,
  
  -- Regional adjustments
  price_adjustment_percent DECIMAL(6,2) DEFAULT 0.00, -- +/- adjustment from base
  promotional_discount_percent DECIMAL(5,2) DEFAULT 0.00,
  promotional_end_date DATE,
  
  -- Regional features override
  feature_adjustments JSONB, -- Override specific features for this region
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  launch_date DATE DEFAULT CURRENT_DATE,
  
  -- Constraints
  CONSTRAINT unique_tier_region UNIQUE(tier_id, region_id),
  CONSTRAINT valid_adjustments CHECK (
    price_adjustment_percent >= -50 AND price_adjustment_percent <= 100 AND
    promotional_discount_percent >= 0 AND promotional_discount_percent <= 100
  )
);

-- =============================================================================
-- PART 4: MATERIAL PRICING BY REGION
-- =============================================================================

-- Regional pricing for materials and hardware
CREATE TABLE IF NOT EXISTS public.regional_material_pricing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Relationships
  material_id UUID REFERENCES public.materials(id) ON DELETE CASCADE,
  hardware_id UUID REFERENCES public.hardware(id) ON DELETE CASCADE,
  region_id UUID NOT NULL REFERENCES public.regions(id) ON DELETE CASCADE,
  
  -- Regional pricing (in local currency minor units)
  cost_per_sqm_local INTEGER,
  cost_per_lm_local INTEGER,
  cost_per_piece_local INTEGER,
  
  -- Regional supplier information
  local_supplier_code VARCHAR(50),
  local_supplier_name VARCHAR(100),
  local_supplier_part_number VARCHAR(50),
  lead_time_days INTEGER,
  minimum_order_quantity DECIMAL(8,2),
  
  -- Currency and conversion
  price_last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  exchange_rate_used DECIMAL(8,4),
  
  -- Availability
  is_available BOOLEAN DEFAULT true,
  availability_notes TEXT,
  
  -- Constraints
  CONSTRAINT material_or_hardware CHECK (
    (material_id IS NOT NULL AND hardware_id IS NULL) OR
    (material_id IS NULL AND hardware_id IS NOT NULL)
  ),
  CONSTRAINT unique_material_region UNIQUE(material_id, region_id),
  CONSTRAINT unique_hardware_region UNIQUE(hardware_id, region_id)
);

-- =============================================================================
-- PART 5: USER TIER ASSIGNMENTS
-- =============================================================================

-- Track which tier each user is on
CREATE TABLE IF NOT EXISTS public.user_tier_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- User and tier
  user_id UUID NOT NULL, -- References auth.users(id)
  tier_id UUID NOT NULL REFERENCES public.user_tiers(id),
  region_id UUID NOT NULL REFERENCES public.regions(id),
  
  -- Subscription details
  subscription_start DATE NOT NULL DEFAULT CURRENT_DATE,
  subscription_end DATE, -- NULL for active subscriptions
  billing_cycle VARCHAR(20) DEFAULT 'monthly', -- 'monthly', 'annual', 'lifetime'
  
  -- Payment and billing
  last_payment_date DATE,
  next_billing_date DATE,
  payment_status VARCHAR(20) DEFAULT 'active', -- 'active', 'past_due', 'cancelled', 'paused'
  
  -- Usage tracking
  designs_created_this_month INTEGER DEFAULT 0,
  exports_this_month INTEGER DEFAULT 0,
  api_calls_this_month INTEGER DEFAULT 0,
  
  -- Special pricing
  custom_discount_percent DECIMAL(5,2) DEFAULT 0.00,
  custom_pricing_notes TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Constraints
  CONSTRAINT valid_billing_cycle CHECK (billing_cycle IN ('monthly', 'annual', 'lifetime')),
  CONSTRAINT valid_payment_status CHECK (
    payment_status IN ('active', 'past_due', 'cancelled', 'paused', 'trial')
  )
);

-- =============================================================================
-- PART 6: PRICING CALCULATION FUNCTIONS
-- =============================================================================

-- Function to get user's effective pricing for materials
CREATE OR REPLACE FUNCTION get_user_material_price(
  user_id_param UUID,
  material_id_param UUID DEFAULT NULL,
  hardware_id_param UUID DEFAULT NULL
)
RETURNS TABLE (
  base_price_local INTEGER,
  discounted_price_local INTEGER,
  discount_percent DECIMAL(5,2),
  currency_code VARCHAR(3),
  currency_symbol VARCHAR(5)
) AS $$
DECLARE
  user_tier RECORD;
  user_region RECORD;
  material_price RECORD;
BEGIN
  -- Get user's current tier and region
  SELECT ut.*, uta.region_id INTO user_tier
  FROM user_tier_assignments uta
  JOIN user_tiers ut ON uta.tier_id = ut.id
  WHERE uta.user_id = user_id_param 
    AND uta.is_active = true
    AND (uta.subscription_end IS NULL OR uta.subscription_end >= CURRENT_DATE)
  LIMIT 1;
  
  IF NOT FOUND THEN
    -- Default to free tier and UK region
    SELECT * INTO user_tier FROM user_tiers WHERE tier_code = 'FREE' LIMIT 1;
    SELECT * INTO user_region FROM regions WHERE region_code = 'UK' LIMIT 1;
  ELSE
    SELECT * INTO user_region FROM regions WHERE id = user_tier.region_id;
  END IF;
  
  -- Get regional pricing for the material/hardware
  IF material_id_param IS NOT NULL THEN
    SELECT 
      COALESCE(rmp.cost_per_sqm_local, rmp.cost_per_lm_local, rmp.cost_per_piece_local) as price,
      user_region.currency_code,
      user_region.currency_symbol
    INTO material_price
    FROM regional_material_pricing rmp
    WHERE rmp.material_id = material_id_param 
      AND rmp.region_id = user_region.id
      AND rmp.is_available = true;
  ELSE
    SELECT 
      rmp.cost_per_piece_local as price,
      user_region.currency_code,
      user_region.currency_symbol
    INTO material_price
    FROM regional_material_pricing rmp
    WHERE rmp.hardware_id = hardware_id_param 
      AND rmp.region_id = user_region.id
      AND rmp.is_available = true;
  END IF;
  
  -- Calculate discount
  RETURN QUERY
  SELECT 
    material_price.price as base_price_local,
    (material_price.price * (100 - user_tier.material_discount_percent) / 100)::INTEGER as discounted_price_local,
    user_tier.material_discount_percent as discount_percent,
    material_price.currency_code,
    material_price.currency_symbol;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate total design cost for a user
CREATE OR REPLACE FUNCTION get_user_design_cost(
  user_id_param UUID,
  design_id_param UUID
)
RETURNS TABLE (
  total_base_cost_local INTEGER,
  total_discounted_cost_local INTEGER,
  total_discount_amount_local INTEGER,
  currency_code VARCHAR(3),
  currency_symbol VARCHAR(5),
  discount_percent DECIMAL(5,2)
) AS $$
DECLARE
  user_tier RECORD;
  user_region RECORD;
  total_base INTEGER := 0;
  total_discounted INTEGER := 0;
BEGIN
  -- Get user's current tier and region
  SELECT ut.*, uta.region_id INTO user_tier
  FROM user_tier_assignments uta
  JOIN user_tiers ut ON uta.tier_id = ut.id
  WHERE uta.user_id = user_id_param 
    AND uta.is_active = true
    AND (uta.subscription_end IS NULL OR uta.subscription_end >= CURRENT_DATE)
  LIMIT 1;
  
  IF NOT FOUND THEN
    SELECT * INTO user_tier FROM user_tiers WHERE tier_code = 'FREE' LIMIT 1;
    SELECT * INTO user_region FROM regions WHERE region_code = 'UK' LIMIT 1;
  ELSE
    SELECT * INTO user_region FROM regions WHERE id = user_tier.region_id;
  END IF;
  
  -- Calculate total material costs
  SELECT 
    SUM(COALESCE(rmp.cost_per_sqm_local, rmp.cost_per_lm_local, rmp.cost_per_piece_local) * cm.quantity * cm.waste_factor)::INTEGER,
    SUM(COALESCE(rmp.cost_per_sqm_local, rmp.cost_per_lm_local, rmp.cost_per_piece_local) * cm.quantity * cm.waste_factor * (100 - user_tier.material_discount_percent) / 100)::INTEGER
  INTO total_base, total_discounted
  FROM design_elements de
  JOIN component_materials cm ON de.component_id = cm.component_id
  JOIN materials m ON cm.material_id = m.id
  JOIN regional_material_pricing rmp ON m.id = rmp.material_id AND rmp.region_id = user_region.id
  WHERE de.design_id = design_id_param;
  
  -- Add hardware costs
  SELECT 
    total_base + SUM(rmp.cost_per_piece_local * ch.quantity_per_component)::INTEGER,
    total_discounted + SUM(rmp.cost_per_piece_local * ch.quantity_per_component * (100 - user_tier.material_discount_percent) / 100)::INTEGER
  INTO total_base, total_discounted
  FROM design_elements de
  JOIN component_hardware ch ON de.component_id = ch.component_id
  JOIN hardware h ON ch.hardware_id = h.id
  JOIN regional_material_pricing rmp ON h.id = rmp.hardware_id AND rmp.region_id = user_region.id
  WHERE de.design_id = design_id_param;
  
  RETURN QUERY
  SELECT 
    COALESCE(total_base, 0) as total_base_cost_local,
    COALESCE(total_discounted, 0) as total_discounted_cost_local,
    COALESCE(total_base - total_discounted, 0) as total_discount_amount_local,
    user_region.currency_code,
    user_region.currency_symbol,
    user_tier.material_discount_percent as discount_percent;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- PART 7: INDEXES FOR PERFORMANCE
-- =============================================================================

-- Regions indexes
CREATE INDEX IF NOT EXISTS idx_regions_code ON public.regions(region_code);
CREATE INDEX IF NOT EXISTS idx_regions_active ON public.regions(is_active);

-- User tiers indexes
CREATE INDEX IF NOT EXISTS idx_user_tiers_code ON public.user_tiers(tier_code);
CREATE INDEX IF NOT EXISTS idx_user_tiers_active ON public.user_tiers(is_active);
CREATE INDEX IF NOT EXISTS idx_user_tiers_public ON public.user_tiers(is_public);

-- Regional tier pricing indexes
CREATE INDEX IF NOT EXISTS idx_regional_tier_pricing_tier ON public.regional_tier_pricing(tier_id);
CREATE INDEX IF NOT EXISTS idx_regional_tier_pricing_region ON public.regional_tier_pricing(region_id);
CREATE INDEX IF NOT EXISTS idx_regional_tier_pricing_active ON public.regional_tier_pricing(is_active);

-- Regional material pricing indexes
CREATE INDEX IF NOT EXISTS idx_regional_material_pricing_material ON public.regional_material_pricing(material_id);
CREATE INDEX IF NOT EXISTS idx_regional_material_pricing_hardware ON public.regional_material_pricing(hardware_id);
CREATE INDEX IF NOT EXISTS idx_regional_material_pricing_region ON public.regional_material_pricing(region_id);

-- User tier assignments indexes
CREATE INDEX IF NOT EXISTS idx_user_tier_assignments_user ON public.user_tier_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tier_assignments_tier ON public.user_tier_assignments(tier_id);
CREATE INDEX IF NOT EXISTS idx_user_tier_assignments_active ON public.user_tier_assignments(is_active);

-- =============================================================================
-- PART 8: VIEWS FOR BUSINESS ANALYTICS
-- =============================================================================

-- Active subscriptions summary
CREATE OR REPLACE VIEW active_subscriptions AS
SELECT 
  ut.tier_name,
  r.region_name,
  r.currency_code,
  COUNT(*) as subscriber_count,
  SUM(rtp.monthly_price_local) as monthly_revenue_local,
  AVG(uta.designs_created_this_month) as avg_designs_per_user
FROM user_tier_assignments uta
JOIN user_tiers ut ON uta.tier_id = ut.id
JOIN regions r ON uta.region_id = r.id
JOIN regional_tier_pricing rtp ON ut.id = rtp.tier_id AND r.id = rtp.region_id
WHERE uta.is_active = true 
  AND (uta.subscription_end IS NULL OR uta.subscription_end >= CURRENT_DATE)
  AND uta.payment_status = 'active'
GROUP BY ut.tier_name, r.region_name, r.currency_code;

-- Regional revenue summary
CREATE OR REPLACE VIEW regional_revenue AS
SELECT 
  r.region_name,
  r.currency_code,
  r.currency_symbol,
  COUNT(uta.id) as total_subscribers,
  SUM(CASE WHEN uta.billing_cycle = 'monthly' THEN rtp.monthly_price_local ELSE 0 END) as monthly_revenue,
  SUM(CASE WHEN uta.billing_cycle = 'annual' THEN rtp.annual_price_local ELSE 0 END) as annual_revenue,
  AVG(uta.designs_created_this_month) as avg_designs_per_user
FROM user_tier_assignments uta
JOIN user_tiers ut ON uta.tier_id = ut.id
JOIN regions r ON uta.region_id = r.id
JOIN regional_tier_pricing rtp ON ut.id = rtp.tier_id AND r.id = rtp.region_id
WHERE uta.is_active = true 
  AND (uta.subscription_end IS NULL OR uta.subscription_end >= CURRENT_DATE)
GROUP BY r.region_name, r.currency_code, r.currency_symbol;

-- =============================================================================
-- PART 9: ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regional_tier_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regional_material_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tier_assignments ENABLE ROW LEVEL SECURITY;

-- Basic read policies (can be refined later)
CREATE POLICY "Regions are viewable by everyone" ON public.regions FOR SELECT USING (is_active = true);
CREATE POLICY "User tiers are viewable by everyone" ON public.user_tiers FOR SELECT USING (is_public = true);
CREATE POLICY "Regional tier pricing is viewable by everyone" ON public.regional_tier_pricing FOR SELECT USING (is_active = true);
CREATE POLICY "Regional material pricing is viewable by everyone" ON public.regional_material_pricing FOR SELECT USING (is_available = true);
CREATE POLICY "Users can view their own tier assignments" ON public.user_tier_assignments FOR SELECT USING (auth.uid() = user_id);
