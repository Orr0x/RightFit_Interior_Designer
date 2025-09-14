# 🎯 HARDCODED DATA MIGRATION PLAN

## 🚀 **BUSINESS VALUE: MASSIVE OPPORTUNITIES**

This migration will unlock **manufacturing features**, **dynamic pricing**, **multi-region support**, and **white-label customization**.

---

## 📊 **DATABASE SCHEMA PROPOSALS**

### **1. 🏠 ROOM CONFIGURATION TABLE**
```sql
CREATE TABLE room_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_type VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  icon_name VARCHAR(50) NOT NULL,
  description TEXT,
  default_color VARCHAR(7),
  region VARCHAR(10) DEFAULT 'UK',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**🎯 Enables:** Multi-language, regional room types, custom branding

---

### **2. 💰 USER TIERS & PRICING**
```sql
CREATE TABLE user_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name VARCHAR(20) UNIQUE NOT NULL,
  display_name VARCHAR(50) NOT NULL,
  max_rooms INTEGER,
  allowed_room_types TEXT[],
  can_save BOOLEAN DEFAULT false,
  can_load VARCHAR(20) DEFAULT 'none',
  component_access VARCHAR(20) DEFAULT 'basic',
  available_views TEXT[],
  has_3d_viewer VARCHAR(20) DEFAULT 'false',
  can_export VARCHAR(20) DEFAULT 'false',
  monthly_price_pence INTEGER DEFAULT 0,
  yearly_price_pence INTEGER DEFAULT 0,
  region VARCHAR(10) DEFAULT 'UK',
  currency VARCHAR(3) DEFAULT 'GBP',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**🎯 Enables:** Dynamic pricing, A/B testing, regional pricing

---

### **3. ⌨️ KEYBOARD SHORTCUTS**
```sql
CREATE TABLE keyboard_shortcuts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_name VARCHAR(50) NOT NULL,
  default_key_combo VARCHAR(50) NOT NULL,
  description TEXT,
  category VARCHAR(30),
  is_customizable BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_shortcuts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  shortcut_id UUID REFERENCES keyboard_shortcuts(id),
  custom_key_combo VARCHAR(50) NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  UNIQUE(user_id, shortcut_id)
);
```

**🎯 Enables:** User customization, accessibility, power-user features

---

### **4. 🎨 MATERIALS & MANUFACTURING**
```sql
CREATE TABLE materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50), -- 'wood', 'metal', 'glass', etc.
  subcategory VARCHAR(50), -- 'oak', 'pine', 'steel', etc.
  color_hex VARCHAR(7),
  roughness DECIMAL(3,2) DEFAULT 0.7,
  metalness DECIMAL(3,2) DEFAULT 0.1,
  cost_per_sqm_pence INTEGER,
  supplier_code VARCHAR(50),
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE component_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_id UUID REFERENCES components(id),
  material_id UUID REFERENCES materials(id),
  part_name VARCHAR(50), -- 'door', 'frame', 'handle'
  quantity DECIMAL(8,3), -- square meters, linear meters, etc.
  unit VARCHAR(10), -- 'sqm', 'm', 'piece'
  is_primary BOOLEAN DEFAULT false
);
```

**🎯 Enables:** **MANUFACTURING GOLDMINE!** Cost calculation, cutting lists, supplier integration

---

### **5. 📏 VALIDATION RULES**
```sql
CREATE TABLE validation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name VARCHAR(100) NOT NULL,
  component_type VARCHAR(50),
  room_type VARCHAR(50),
  rule_type VARCHAR(20), -- 'error', 'warning', 'info'
  condition_sql TEXT, -- SQL condition to evaluate
  message_template TEXT,
  region VARCHAR(10) DEFAULT 'UK',
  regulation_reference VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**🎯 Enables:** Building regulations, regional compliance, dynamic validation

---

### **6. 🏷️ COMPONENT CATEGORIES**
```sql
CREATE TABLE component_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_code VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  icon_name VARCHAR(50),
  sort_order INTEGER DEFAULT 0,
  parent_category_id UUID REFERENCES component_categories(id),
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE component_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_code VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  icon_name VARCHAR(50),
  default_dimensions JSONB, -- {width: 60, depth: 60, height: 90}
  is_active BOOLEAN DEFAULT true
);
```

**🎯 Enables:** Dynamic catalogs, hierarchical categories, supplier integration

---

### **7. 🎨 UI THEMES & BRANDING**
```sql
CREATE TABLE ui_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  color_palette JSONB, -- Array of color objects
  logo_url VARCHAR(255),
  brand_name VARCHAR(100),
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true
);
```

**🎯 Enables:** White-label solutions, brand customization

---

## 💰 **MANUFACTURING & BUSINESS FEATURES**

### **🏭 CUTTING LISTS & COSTING**
```sql
-- Generate cutting list for a design
WITH design_materials AS (
  SELECT 
    m.name as material_name,
    m.cost_per_sqm_pence,
    cm.quantity,
    cm.unit,
    (cm.quantity * m.cost_per_sqm_pence / 100.0) as cost_gbp
  FROM design_elements de
  JOIN component_materials cm ON de.component_id = cm.component_id
  JOIN materials m ON cm.material_id = m.id
  WHERE de.design_id = $1
)
SELECT 
  material_name,
  SUM(quantity) as total_quantity,
  unit,
  SUM(cost_gbp) as total_cost
FROM design_materials
GROUP BY material_name, unit
ORDER BY total_cost DESC;
```

### **📊 REAL-TIME PRICING**
```sql
-- Calculate design cost with current pricing
SELECT 
  d.name as design_name,
  COUNT(de.id) as component_count,
  SUM(COALESCE(cm.quantity * m.cost_per_sqm_pence, 0)) / 100.0 as material_cost_gbp,
  SUM(COALESCE(cm.quantity * m.cost_per_sqm_pence, 0)) * 1.4 / 100.0 as retail_price_gbp
FROM designs d
JOIN design_elements de ON d.id = de.design_id
LEFT JOIN component_materials cm ON de.component_id = cm.component_id
LEFT JOIN materials m ON cm.material_id = m.id
WHERE d.id = $1
GROUP BY d.id, d.name;
```

---

## 🎯 **IMPLEMENTATION PRIORITY**

### **Phase 1: Foundation (Immediate Business Value)**
1. **💰 User Tiers** - Enable dynamic pricing & A/B testing
2. **🎨 Materials** - Unlock manufacturing features
3. **🏠 Room Types** - Multi-region support

### **Phase 2: User Experience**
4. **⌨️ Keyboard Shortcuts** - User customization
5. **📏 Validation Rules** - Compliance & quality
6. **🏷️ Component Categories** - Dynamic catalogs

### **Phase 3: Enterprise**
7. **🎨 UI Themes** - White-label solutions
8. **📊 Advanced Analytics** - Business intelligence
9. **🏭 Supplier Integration** - Real-time pricing APIs

---

## 🚀 **BUSINESS IMPACT**

### **💰 Revenue Opportunities:**
- **Dynamic Pricing:** A/B test pricing tiers
- **Manufacturing:** Cutting lists, material costing
- **White-Label:** Sell customized versions
- **Regional:** Expand to EU, US markets

### **🎯 User Experience:**
- **Personalization:** Custom shortcuts, themes
- **Compliance:** Regional building regulations
- **Quality:** Smart design validation
- **Performance:** Faster, more flexible system

### **📈 Scalability:**
- **Multi-Tenant:** Different brands, regions
- **API-Driven:** External integrations
- **Real-Time:** Live pricing, availability
- **Analytics:** Usage patterns, popular components

---

## 🎉 **NEXT STEPS**

1. **Choose Phase 1 priority** - Which unlocks most business value?
2. **Design first schema** - Start with highest ROI table
3. **Build migration scripts** - Move hardcoded data to DB
4. **Create admin interface** - Manage dynamic data
5. **Test with real data** - Validate business logic

**This migration will transform RightFit from a static app to a dynamic, scalable business platform!** 🚀
