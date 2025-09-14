-- Materials & Manufacturing System
-- Phase 1: Component Materials Database
-- Created: 2025-09-14
-- Purpose: Enable manufacturing features, cutting lists, and cost calculation

-- =============================================================================
-- PART 1: MATERIALS MASTER TABLE
-- =============================================================================

-- Core materials database - the foundation of manufacturing
CREATE TABLE IF NOT EXISTS public.materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Core material data
  material_code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'wood', 'metal', 'glass', 'plastic', 'fabric', 'ceramic', 'stone', 'composite'
  subcategory VARCHAR(50), -- 'oak', 'pine', 'steel', 'aluminum', etc.
  
  -- Visual properties (for 3D rendering)
  color_hex VARCHAR(7) NOT NULL DEFAULT '#8B4513',
  roughness DECIMAL(3,2) NOT NULL DEFAULT 0.7,
  metalness DECIMAL(3,2) NOT NULL DEFAULT 0.1,
  
  -- Manufacturing properties
  density_kg_per_m3 DECIMAL(8,2), -- Material density for weight calculations
  thickness_mm DECIMAL(6,2), -- Standard thickness for sheet materials
  
  -- Pricing data
  cost_per_sqm_pence INTEGER, -- Cost in pence per square meter
  cost_per_lm_pence INTEGER, -- Cost in pence per linear meter  
  cost_per_piece_pence INTEGER, -- Cost in pence per piece/unit
  
  -- Supplier information
  supplier_code VARCHAR(50),
  supplier_name VARCHAR(100),
  supplier_part_number VARCHAR(50),
  lead_time_days INTEGER DEFAULT 7,
  minimum_order_quantity DECIMAL(8,2) DEFAULT 1,
  
  -- Availability and status
  is_available BOOLEAN NOT NULL DEFAULT true,
  is_standard BOOLEAN NOT NULL DEFAULT false, -- Standard materials vs custom
  region VARCHAR(10) DEFAULT 'UK',
  
  -- Constraints
  CONSTRAINT valid_roughness CHECK (roughness >= 0 AND roughness <= 1),
  CONSTRAINT valid_metalness CHECK (metalness >= 0 AND metalness <= 1),
  CONSTRAINT valid_costs CHECK (
    cost_per_sqm_pence >= 0 OR cost_per_sqm_pence IS NULL
  )
);

-- =============================================================================
-- PART 2: COMPONENT MATERIALS JUNCTION TABLE
-- =============================================================================

-- Links components to their materials with quantities
CREATE TABLE IF NOT EXISTS public.component_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Relationships
  component_id UUID NOT NULL REFERENCES public.components(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  
  -- Part specification
  part_name VARCHAR(50) NOT NULL, -- 'door', 'frame', 'handle', 'back_panel', etc.
  part_description TEXT,
  
  -- Quantity and units
  quantity DECIMAL(10,3) NOT NULL, -- Amount needed
  unit VARCHAR(20) NOT NULL, -- 'sqm', 'lm', 'piece', 'kg'
  
  -- Manufacturing details
  waste_factor DECIMAL(4,3) DEFAULT 1.1, -- 10% waste factor by default
  cutting_complexity VARCHAR(20) DEFAULT 'simple', -- 'simple', 'medium', 'complex'
  requires_edge_banding BOOLEAN DEFAULT false,
  grain_direction VARCHAR(20), -- 'with_grain', 'against_grain', 'any'
  
  -- Priority and flags
  is_primary_material BOOLEAN DEFAULT false, -- Main material for the component
  is_visible BOOLEAN DEFAULT true, -- Visible in final product
  is_structural BOOLEAN DEFAULT false, -- Load-bearing element
  
  -- Constraints
  CONSTRAINT valid_quantity CHECK (quantity > 0),
  CONSTRAINT valid_waste_factor CHECK (waste_factor >= 1.0),
  CONSTRAINT unique_component_part UNIQUE(component_id, part_name)
);

-- =============================================================================
-- PART 3: MATERIAL FINISHES TABLE
-- =============================================================================

-- Different finishes available for materials (paint, stain, etc.)
CREATE TABLE IF NOT EXISTS public.material_finishes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Core finish data
  finish_code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  finish_type VARCHAR(30) NOT NULL, -- 'paint', 'stain', 'laminate', 'veneer', 'raw'
  
  -- Visual properties
  color_hex VARCHAR(7) NOT NULL,
  gloss_level VARCHAR(20) DEFAULT 'satin', -- 'matte', 'satin', 'semi-gloss', 'gloss'
  
  -- Material compatibility
  compatible_materials TEXT[], -- Array of material categories this finish works with
  
  -- Pricing
  cost_per_sqm_pence INTEGER,
  
  -- Properties
  durability_rating INTEGER DEFAULT 5, -- 1-10 scale
  maintenance_level VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high'
  
  -- Status
  is_available BOOLEAN DEFAULT true
);

-- =============================================================================
-- PART 4: COMPONENT MATERIAL FINISHES JUNCTION
-- =============================================================================

-- Links component materials to their finishes
CREATE TABLE IF NOT EXISTS public.component_material_finishes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  component_material_id UUID NOT NULL REFERENCES public.component_materials(id) ON DELETE CASCADE,
  finish_id UUID NOT NULL REFERENCES public.material_finishes(id) ON DELETE CASCADE,
  
  -- Application details
  coverage_sqm DECIMAL(8,3), -- How much area to cover
  coats_required INTEGER DEFAULT 1,
  
  CONSTRAINT unique_component_material_finish UNIQUE(component_material_id, finish_id)
);

-- =============================================================================
-- PART 5: HARDWARE TABLE
-- =============================================================================

-- Handles, hinges, screws, etc.
CREATE TABLE IF NOT EXISTS public.hardware (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Core hardware data
  hardware_code VARCHAR(30) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(30) NOT NULL, -- 'handle', 'hinge', 'screw', 'bracket', 'slide'
  subcategory VARCHAR(30), -- 'cabinet_handle', 'door_hinge', 'soft_close', etc.
  
  -- Specifications
  material VARCHAR(30), -- 'stainless_steel', 'brass', 'plastic', etc.
  finish VARCHAR(30), -- 'chrome', 'brushed', 'black', etc.
  dimensions JSONB, -- {length: 128, width: 25, height: 30} in mm
  
  -- Pricing
  cost_per_piece_pence INTEGER NOT NULL,
  
  -- Supplier info
  supplier_code VARCHAR(50),
  supplier_part_number VARCHAR(50),
  
  -- Status
  is_available BOOLEAN DEFAULT true,
  is_standard BOOLEAN DEFAULT false
);

-- =============================================================================
-- PART 6: COMPONENT HARDWARE JUNCTION
-- =============================================================================

-- Links components to required hardware
CREATE TABLE IF NOT EXISTS public.component_hardware (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  component_id UUID NOT NULL REFERENCES public.components(id) ON DELETE CASCADE,
  hardware_id UUID NOT NULL REFERENCES public.hardware(id) ON DELETE CASCADE,
  
  -- Quantity and placement
  quantity_per_component INTEGER NOT NULL DEFAULT 1,
  placement_notes TEXT, -- 'top rail', 'door center', etc.
  
  -- Constraints
  CONSTRAINT valid_hardware_quantity CHECK (quantity_per_component > 0)
);

-- =============================================================================
-- PART 7: INDEXES FOR PERFORMANCE
-- =============================================================================

-- Materials indexes
CREATE INDEX IF NOT EXISTS idx_materials_category ON public.materials(category);
CREATE INDEX IF NOT EXISTS idx_materials_available ON public.materials(is_available);
CREATE INDEX IF NOT EXISTS idx_materials_standard ON public.materials(is_standard);
CREATE INDEX IF NOT EXISTS idx_materials_supplier ON public.materials(supplier_code);

-- Component materials indexes
CREATE INDEX IF NOT EXISTS idx_component_materials_component ON public.component_materials(component_id);
CREATE INDEX IF NOT EXISTS idx_component_materials_material ON public.component_materials(material_id);
CREATE INDEX IF NOT EXISTS idx_component_materials_primary ON public.component_materials(is_primary_material);

-- Hardware indexes
CREATE INDEX IF NOT EXISTS idx_hardware_category ON public.hardware(category);
CREATE INDEX IF NOT EXISTS idx_hardware_available ON public.hardware(is_available);

-- Component hardware indexes
CREATE INDEX IF NOT EXISTS idx_component_hardware_component ON public.component_hardware(component_id);
CREATE INDEX IF NOT EXISTS idx_component_hardware_hardware ON public.component_hardware(hardware_id);

-- =============================================================================
-- PART 8: VIEWS FOR BUSINESS LOGIC
-- =============================================================================

-- Complete material cost view
CREATE OR REPLACE VIEW component_material_costs AS
SELECT 
  cm.component_id,
  c.name as component_name,
  cm.part_name,
  m.name as material_name,
  m.category as material_category,
  cm.quantity,
  cm.unit,
  cm.waste_factor,
  (cm.quantity * cm.waste_factor) as quantity_with_waste,
  CASE 
    WHEN cm.unit = 'sqm' THEN COALESCE(m.cost_per_sqm_pence, 0)
    WHEN cm.unit = 'lm' THEN COALESCE(m.cost_per_lm_pence, 0)
    WHEN cm.unit = 'piece' THEN COALESCE(m.cost_per_piece_pence, 0)
    ELSE 0
  END as unit_cost_pence,
  CASE 
    WHEN cm.unit = 'sqm' THEN (cm.quantity * cm.waste_factor * COALESCE(m.cost_per_sqm_pence, 0))
    WHEN cm.unit = 'lm' THEN (cm.quantity * cm.waste_factor * COALESCE(m.cost_per_lm_pence, 0))
    WHEN cm.unit = 'piece' THEN (cm.quantity * cm.waste_factor * COALESCE(m.cost_per_piece_pence, 0))
    ELSE 0
  END as total_cost_pence
FROM component_materials cm
JOIN components c ON cm.component_id = c.id
JOIN materials m ON cm.material_id = m.id
WHERE m.is_available = true;

-- Component total cost view
CREATE OR REPLACE VIEW component_total_costs AS
SELECT 
  component_id,
  component_name,
  COUNT(*) as material_count,
  SUM(total_cost_pence) as total_material_cost_pence,
  SUM(total_cost_pence) / 100.0 as total_material_cost_gbp
FROM component_material_costs
GROUP BY component_id, component_name;

-- =============================================================================
-- PART 9: FUNCTIONS FOR MANUFACTURING
-- =============================================================================

-- Function to calculate cutting list for a design
CREATE OR REPLACE FUNCTION get_design_cutting_list(design_id_param UUID)
RETURNS TABLE (
  material_name VARCHAR(100),
  category VARCHAR(50),
  total_quantity DECIMAL(10,3),
  unit VARCHAR(20),
  total_cost_pence BIGINT,
  supplier_name VARCHAR(100)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.name,
    m.category,
    SUM(cm.quantity * cm.waste_factor) as total_quantity,
    cm.unit,
    SUM(
      CASE 
        WHEN cm.unit = 'sqm' THEN (cm.quantity * cm.waste_factor * COALESCE(m.cost_per_sqm_pence, 0))
        WHEN cm.unit = 'lm' THEN (cm.quantity * cm.waste_factor * COALESCE(m.cost_per_lm_pence, 0))
        WHEN cm.unit = 'piece' THEN (cm.quantity * cm.waste_factor * COALESCE(m.cost_per_piece_pence, 0))
        ELSE 0
      END
    )::BIGINT as total_cost_pence,
    m.supplier_name
  FROM design_elements de
  JOIN component_materials cm ON de.component_id = cm.component_id
  JOIN materials m ON cm.material_id = m.id
  WHERE de.design_id = design_id_param
    AND m.is_available = true
  GROUP BY m.name, m.category, cm.unit, m.supplier_name
  ORDER BY total_cost_pence DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate design total cost
CREATE OR REPLACE FUNCTION get_design_total_cost(design_id_param UUID)
RETURNS TABLE (
  total_material_cost_pence BIGINT,
  total_hardware_cost_pence BIGINT,
  total_cost_pence BIGINT,
  total_cost_gbp DECIMAL(10,2)
) AS $$
BEGIN
  RETURN QUERY
  WITH material_costs AS (
    SELECT SUM(
      CASE 
        WHEN cm.unit = 'sqm' THEN (cm.quantity * cm.waste_factor * COALESCE(m.cost_per_sqm_pence, 0))
        WHEN cm.unit = 'lm' THEN (cm.quantity * cm.waste_factor * COALESCE(m.cost_per_lm_pence, 0))
        WHEN cm.unit = 'piece' THEN (cm.quantity * cm.waste_factor * COALESCE(m.cost_per_piece_pence, 0))
        ELSE 0
      END
    )::BIGINT as material_total
    FROM design_elements de
    JOIN component_materials cm ON de.component_id = cm.component_id
    JOIN materials m ON cm.material_id = m.id
    WHERE de.design_id = design_id_param
  ),
  hardware_costs AS (
    SELECT SUM(ch.quantity_per_component * h.cost_per_piece_pence)::BIGINT as hardware_total
    FROM design_elements de
    JOIN component_hardware ch ON de.component_id = ch.component_id
    JOIN hardware h ON ch.hardware_id = h.id
    WHERE de.design_id = design_id_param
  )
  SELECT 
    COALESCE(mc.material_total, 0) as total_material_cost_pence,
    COALESCE(hc.hardware_total, 0) as total_hardware_cost_pence,
    COALESCE(mc.material_total, 0) + COALESCE(hc.hardware_total, 0) as total_cost_pence,
    (COALESCE(mc.material_total, 0) + COALESCE(hc.hardware_total, 0)) / 100.0 as total_cost_gbp
  FROM material_costs mc
  CROSS JOIN hardware_costs hc;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- PART 10: ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.component_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_finishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.component_material_finishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hardware ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.component_hardware ENABLE ROW LEVEL SECURITY;

-- Basic read policies (can be refined later)
CREATE POLICY "Materials are viewable by everyone" ON public.materials FOR SELECT USING (true);
CREATE POLICY "Component materials are viewable by everyone" ON public.component_materials FOR SELECT USING (true);
CREATE POLICY "Material finishes are viewable by everyone" ON public.material_finishes FOR SELECT USING (true);
CREATE POLICY "Component material finishes are viewable by everyone" ON public.component_material_finishes FOR SELECT USING (true);
CREATE POLICY "Hardware is viewable by everyone" ON public.hardware FOR SELECT USING (true);
CREATE POLICY "Component hardware is viewable by everyone" ON public.component_hardware FOR SELECT USING (true);
