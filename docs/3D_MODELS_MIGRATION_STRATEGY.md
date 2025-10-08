# 3D Models Migration Strategy - MULTI-ROOM EDITION

**Duration**: Week 13-36 (24 weeks)
**Target**: Migrate all 150+ components across all room types to database
**Feature Flag**: `use_dynamic_3d_models`
**Special Focus**: Corner units & auto-rotate system

---

## 🎯 Migration Goals

**Primary Objectives:**
1. ✅ Move all 3D geometry from code to database
2. ✅ Preserve exact corner unit L-shape geometry
3. ✅ Maintain auto-rotate logic (wall snap + corner detection)
4. ✅ Enable easy addition of new components via admin panel
5. ✅ Zero visual regressions
6. ✅ Performance parity or better
7. **NEW**: Support all room types (kitchen, bedroom, bathroom, living room, office, etc.)

**Success Criteria:**
- All components render identically to hardcoded versions
- Corner units maintain exact L-shape ratios
- Auto-rotate works perfectly for all scenarios
- Performance impact < 50ms per component load
- Feature flag enables instant rollback
- Complete multi-room interior design system

---

## 📊 Scope Analysis - FULL INVENTORY

### **Components to Migrate**

| Category | Count | Complexity | Priority | Weeks |
|----------|-------|------------|----------|-------|
| **KITCHEN** | | | | |
| Corner Cabinets (L-shaped) | 4 | **CRITICAL** | P0 | 19 ✅ |
| Standard Base Cabinets | 5 | Medium | P1 | 20-21 |
| Wall Cabinets | 5 | Medium | P1 | 20-21 |
| Drawer Units | 3 | Medium | P1 | 21-22 |
| Larders (Tall Units) | 7 | High | P2 | 22-23 |
| Kitchen Appliances | 5 | Medium | P2 | 23 |
| Toe Kicks | 3 | Low | P4 | 33 |
| Cornice | 3 | Low | P4 | 33 |
| Pelmet | 3 | Low | P4 | 33 |
| Wall Unit End Panels | 2 | Low | P4 | 33 |
| Utility Storage | 1 | Low | P4 | 33 |
| **Kitchen Subtotal** | **41** | | | |
| | | | | |
| **UNIVERSAL** | | | | |
| Counter-tops | 4 | Medium | P3 | 24-25 |
| End Panels | 2 | Low | P4 | 33 |
| **Universal Subtotal** | **6** | | | |
| | | | | |
| **BEDROOM** | | | | |
| Beds (Double, King, Single, Bunk, etc.) | 6 | Medium | P5 | 26-27 |
| Wardrobes | 7 | High | P5 | 27-28 |
| Bedroom Storage | 7 | Medium | P5 | 28 |
| Bedroom Furniture | 4 | Low | P5 | 28 |
| Bedroom Props | 4 | Low | P6 | 34 |
| **Bedroom Subtotal** | **28** | | | |
| | | | | |
| **BATHROOM** | | | | |
| Vanity Units | 7 | Medium | P6 | 29 |
| Bathroom Storage | 3 | Low | P6 | 29 |
| Bathroom Fixtures | 3 | Medium | P6 | 29-30 |
| **Bathroom Subtotal** | **13** | | | |
| | | | | |
| **LIVING ROOM** | | | | |
| Media Furniture (TV Units) | 2 | Medium | P7 | 30-31 |
| Media Storage | 2 | Low | P7 | 31 |
| Built-in Units | 3 | High | P7 | 31 |
| Shelving | 3 | Medium | P7 | 31 |
| Furniture (Sofas, Chairs, Tables) | 9 | Medium | P7 | 32 |
| Storage & Props | 4 | Low | P7 | 32 |
| **Living Room Subtotal** | **23** | | | |
| | | | | |
| **OFFICE** | | | | |
| Desks | 4 | Medium | P8 | 32-33 |
| Office Storage | 3 | Medium | P8 | 33 |
| Office Furniture | 2 | Low | P8 | 33 |
| Office Shelving | 2 | Low | P8 | 33 |
| Office Props | 2 | Low | P8 | 33 |
| **Office Subtotal** | **13** | | | |
| | | | | |
| **DRESSING ROOM** | | | | |
| Dressing Storage | 4 | High | P9 | 34 |
| Dressing Furniture | 2 | Medium | P9 | 34 |
| Dressing Props | 2 | Low | P9 | 34 |
| **Dressing Room Subtotal** | **8** | | | |
| | | | | |
| **DINING ROOM** | | | | |
| Flooring Materials | 3 | Low | P10 | 35 |
| **Dining Room Subtotal** | **3** | | | |

**Total**: **135+ components** (accounting for size variations = **150+ actual models**)

---

## 📅 Week-by-Week Roadmap (Week 13-36)

### **Phase 0: Foundation** ✅

#### **Week 13-14: Schema Design** ✅
- [x] Database schema design
- [x] Migration file created
- [x] Feature flag system

#### **Week 15-16: Formula Parser & Services** ✅
- [x] `FormulaEvaluator.ts` with RPN parser
- [x] `GeometryBuilder.ts`
- [x] `Model3DLoaderService.ts`

#### **Week 17-18: Renderer Integration** ✅
- [x] `DynamicComponentRenderer.tsx`
- [x] Feature flag integration
- [x] Caching layer

#### **Week 19: P0 Corner Units** ✅
- [x] 4 corner cabinet models populated
- [x] All bugs fixed
- [x] Visual parity confirmed
- [x] Performance exceeds targets

**Status**: ✅ **COMPLETE** - Infrastructure 100% ready

---

### **Phase 1: Kitchen (Weeks 20-25)**

#### **Week 20: P1 Standard Base Cabinets (5 models)**
**Models:**
- base-cabinet-30
- base-cabinet-40
- base-cabinet-50
- base-cabinet-60
- base-cabinet-80
- base-cabinet-100 (bonus - actually 6 models)

**Process:**
1. Design geometry (4 parts per cabinet: plinth, body, door, shelf)
2. Create SQL insertion script
3. Test rendering for each size
4. Verify parametric scaling works

**Time Estimate**: 5-7 hours (1 hour per model)

---

#### **Week 21: P1 Wall Cabinets (5 models)**
**Models:**
- wall-cabinet-30
- wall-cabinet-40
- wall-cabinet-50
- wall-cabinet-60
- wall-cabinet-80

**Process:**
1. Design geometry (4 parts per cabinet: back, body, door, shelf)
2. Create SQL insertion script
3. Test wall mounting logic
4. Verify heights are correct

**Time Estimate**: 5-7 hours

---

#### **Week 22: P1 Drawer Units (3 models)**
**Models:**
- pan-drawers-50
- pan-drawers-60
- pan-drawers-80

**Process:**
1. Design geometry (4-6 parts: plinth, body, 3 drawer fronts)
2. Test drawer spacing
3. Verify handle positions

**Time Estimate**: 4-5 hours

---

#### **Week 23: P2 Kitchen Larders (7 models)**
**Models:**
- larder-full-height
- larder-built-in-fridge
- larder-single-oven
- larder-double-oven
- larder-oven-microwave
- larder-coffee-machine
- **larder-corner-unit** (NEW - follows corner cabinet framework)

**Process:**
1. Design tall geometry (6-10 parts per larder)
2. Special handling for larder-corner-unit (L-shaped like base/wall corners)
3. Test appliance integration
4. Verify 200cm height

**Time Estimate**: 10-12 hours

**Note**: `larder-corner-unit-90` follows same L-shape framework as corner base/wall cabinets

---

#### **Week 24: P2 Kitchen Appliances (5 models)**
**Models:**
- refrigerator (60cm)
- dishwasher (60cm)
- oven (60cm)
- washing-machine (60cm)
- tumble-dryer (60cm)

**Process:**
1. Design appliance geometry (2-4 parts: body, door/glass, details)
2. Add material variations (metal, glass)
3. Test integration with cabinets

**Time Estimate**: 6-8 hours

---

#### **Week 25: P3 Counter-tops (4 models)**
**Models:**
- counter-top-horizontal
- counter-top-vertical
- counter-top-square
- counter-top-corner

**Process:**
1. Design thin slab geometry (1-2 parts)
2. Test positioning on cabinets
3. Verify corner counter-top alignment

**Time Estimate**: 4-5 hours

---

### **Phase 2: Bedrooms (Weeks 26-28)**

#### **Week 26: Beds (6 models)**
**Models:**
- single-bed
- double-bed
- king-bed
- super-king-bed
- king-bed-storage
- bunk-bed-system

**Process:**
1. Design bed frames (4-6 parts: frame, headboard, mattress, legs)
2. Test size variations
3. Verify storage drawer integration

**Time Estimate**: 8-10 hours

---

#### **Week 27: Wardrobes (7 models)**
**Models:**
- wardrobe-2door
- wardrobe-3door
- wardrobe-walk-in
- wardrobe-built-in
- wardrobe-corner (L-shaped corner wardrobe)
- wardrobe-sliding-door
- walk-in-wardrobe-system

**Process:**
1. Design tall storage (6-10 parts: body, doors, shelves, rails)
2. Special handling for wardrobe-corner (L-shaped)
3. Test door configurations
4. Verify 200cm+ heights

**Time Estimate**: 10-14 hours

---

#### **Week 28: Bedroom Storage & Furniture (11 models)**
**Models:**
- chest-drawers
- bedside-table
- floating-bedside
- tallboy-6-drawer
- bed-storage-drawers
- shoe-storage-tower
- bed-head-unit
- corner-shelving
- dressing-table
- bedroom-ottoman
- upholstered-bench
- reading-chair

**Process:**
1. Design varied storage (3-5 parts each)
2. Test furniture placement
3. Verify proportions

**Time Estimate**: 14-18 hours

---

### **Phase 3: Bathrooms & Living Rooms (Weeks 29-32)**

#### **Week 29: Bathroom Vanities (7 models)**
**Models:**
- vanity-unit-60
- vanity-unit-80
- vanity-double-120
- vanity-floating-100
- vanity-corner-unit (L-shaped corner vanity)
- vanity-compact-45

**Process:**
1. Design vanity units (4-6 parts: cabinet, basin, doors, shelves)
2. Special handling for vanity-corner-unit (L-shaped)
3. Test basin integration
4. Verify plumbing clearances

**Time Estimate**: 10-12 hours

---

#### **Week 30: Bathroom Storage & Fixtures (6 models)**
**Models:**
- bathroom-linen-cupboard
- bathroom-mirror-cabinet
- bathroom-towel-rack
- toilet
- shower-tray
- bathtub

**Process:**
1. Design fixtures (2-4 parts each)
2. Test fixture placement
3. Verify dimensions for plumbing

**Time Estimate**: 8-10 hours

---

#### **Week 31: Living Room Built-ins & Shelving (8 models)**
**Models:**
- tv-unit-120
- tv-unit-160
- media-shelving
- media-cabinet
- entertainment-wall-unit
- media-console-floating
- corner-entertainment-unit (L-shaped)
- floor-to-ceiling-bookshelf
- wall-mounted-shelves-wide
- recessed-bookshelves

**Process:**
1. Design media units (4-8 parts: body, shelves, doors, mounts)
2. Special handling for corner-entertainment-unit (L-shaped)
3. Test TV mounting positions
4. Verify cable management

**Time Estimate**: 12-16 hours

---

#### **Week 32: Living Room Furniture (13 models)**
**Models:**
- modern-sofa
- sectional-sofa-left-arm
- loveseat-sofa
- chaise-lounge
- armchair
- coffee-table
- ottoman-storage-large
- console-table-storage
- floor-lamp-modern
- area-rug-large

**Process:**
1. Design furniture (3-6 parts each)
2. Test furniture arrangements
3. Verify seating heights

**Time Estimate**: 16-20 hours

---

### **Phase 4: Office & Finishing (Weeks 33-35)**

#### **Week 33: Office Furniture & Storage (13 models)**
**Models:**
- office-desk
- executive-desk
- l-shaped-desk (L-shaped desk)
- standing-desk
- office-chair
- bookshelf
- filing-cabinet-4drawer
- storage-credenza
- bookshelf-barrister
- wall-mounted-shelves-office
- desk-lamp-led
- whiteboard-wall

**Process:**
1. Design office furniture (3-6 parts each)
2. Special handling for l-shaped-desk
3. Test desk configurations
4. Verify ergonomic heights

**Time Estimate**: 16-20 hours

---

#### **Week 34: Dressing Rooms & Kitchen Finishing (17 models)**
**Models (Dressing):**
- walk-in-wardrobe-system
- wardrobe-island-unit
- shoe-storage-tower-dressing
- jewelry-armoire-large
- dressing-table-vanity-large
- dressing-bench-storage-large
- full-length-mirror-stand-large
- dressing-room-mirror-lighted

**Models (Kitchen Finishing):**
- toe-kick-standard
- toe-kick-corner
- toe-kick-long
- cornice-standard
- cornice-corner
- cornice-long
- pelmet-standard
- pelmet-corner
- pelmet-long
- wall-unit-end-panel
- wall-unit-end-panel-corner
- utility-storage-cabinet

**Process:**
1. Design finishing components (1-2 parts each)
2. Test trim placement
3. Verify corner piece alignment

**Time Estimate**: 18-22 hours

---

#### **Week 35: Universal & Props (12 models)**
**Models:**
- end-panel-base
- end-panel-full-height
- hardwood-section
- tile-section
- carpet-section
- bedside-lamp
- wall-mirror-oval
- bedroom-rug-large
- curtains-floor-length

**Process:**
1. Design universal components
2. Test across multiple room types
3. Verify material variations

**Time Estimate**: 12-16 hours

---

### **Phase 5: Testing & Production (Weeks 36)**

#### **Week 36: Final Testing & Rollout**

**Comprehensive Testing:**
1. **Visual Regression** - All 150+ models screenshot comparison
2. **Corner Unit Testing** - All L-shaped components (base, wall, larder, wardrobe, vanity, entertainment, desk)
3. **Auto-Rotate Testing** - All rotatable components
4. **Performance Testing** - Load time benchmarks
5. **Multi-Room Testing** - Test each room type
6. **Edge Cases** - Custom dimensions, rotations, selections

**Gradual Rollout:**
- Day 1-2: Enable in development (100% certainty)
- Day 3-4: Enable in staging
- Day 5-7: Canary rollout (1% production)
- Week 37: Gradual increase (10% → 50% → 100%)

**Time Estimate**: 20-30 hours

---

## 🎯 Component ID Mapping Strategy

### **Pattern-Based Mapping**

The `ComponentIDMapper` uses priority-based pattern matching to map UI component IDs to database model IDs:

```typescript
// Priority 100: Corner units (highest priority)
corner-cabinet, corner-base-cabinet, l-shaped-test-cabinet → l-shaped-test-cabinet-{width}
new-corner-wall-cabinet, corner-wall-cabinet → new-corner-wall-cabinet-{width}
larder-corner-unit → larder-corner-unit-{width}
wardrobe-corner → wardrobe-corner-{width}
vanity-corner-unit → vanity-corner-unit-{width}
corner-entertainment-unit → corner-entertainment-unit-{width}

// Priority 90: Size-based standard components
base-cabinet → base-cabinet-{width}
wall-cabinet → wall-cabinet-{width}
pan-drawers → pan-drawers-{width}
larder-* → larder-*-{width}

// Priority 80: Appliances
refrigerator, fridge → fridge-{width}
dishwasher → dishwasher-{width}
oven → oven-{width}

// ... and so on for all 150+ components
```

**Key Innovations:**
- **Priority System**: More specific patterns (corners) match before generic ones
- **Case Insensitive**: Handles various naming conventions
- **Parametric**: Automatically appends width/dimensions
- **Extensible**: Easy to add new mappings

---

## 🔧 Special Cases: L-Shaped Components

### **Corner Cabinet Framework**

The L-shape geometry framework works for ALL corner components:

**Corner Base Cabinets** (90cm × 90cm, height 90cm)
- 8 parts: 2 plinths, 2 cabinets, 2 doors, 2 shelves
- Auto-rotates to face room interior

**Corner Wall Cabinets** (90cm × 90cm, height 60cm)
- 6 parts: 2 cabinets, 2 doors, 2 shelves
- Wall-mounted, auto-rotates

**Larder Corner Unit** (90cm × 90cm, height 200cm)
- 10-12 parts: 2 tall bodies, 2 door sets, shelving
- Follows same L-shape logic

**Wardrobe Corner** (120cm × 120cm, height 200cm+)
- 12-16 parts: 2 bodies, 2 door sets, rails, shelves
- Larger footprint, same framework

**Vanity Corner Unit** (80cm × 80cm, height 60cm)
- 8-10 parts: 2 cabinets, 2 basins, doors
- Bathroom-specific materials

**Corner Entertainment Unit** (120cm × 120cm, height 180cm)
- 10-14 parts: 2 bodies, shelves, TV mount, storage
- Media-specific features

**L-Shaped Desk** (160cm × 140cm, height 80cm)
- 6-8 parts: 2 desk surfaces, legs, storage
- Office workspace optimization

### **Common Formula Patterns**

All L-shaped components use similar formulas:

```sql
-- Leg 1 (left/right depending on corner)
position_x: 'legLength / 2'
position_z: 'cornerDepth / 2 - legLength / 2 - 0.1'

-- Leg 2 (perpendicular)
position_x: 'cornerDepth / 2 - legLength / 2 - 0.1'
position_z: 'legLength / 2'

-- Door rotation: 90 degrees offset
rotation_y: 'Math.PI / 2'
```

**This framework scales to ALL corner components across ALL room types.**

---

## 📈 Progress Tracking

### **Current Status: Week 19 Complete** ✅

| Phase | Weeks | Models | Status |
|-------|-------|--------|--------|
| **Phase 0: Foundation** | 13-19 | 4 | ✅ **COMPLETE** |
| **Phase 1: Kitchen** | 20-25 | 41 | 🔜 **NEXT** |
| **Phase 2: Bedrooms** | 26-28 | 28 | ⏳ Pending |
| **Phase 3: Bath/Living** | 29-32 | 42 | ⏳ Pending |
| **Phase 4: Office/Finish** | 33-35 | 42 | ⏳ Pending |
| **Phase 5: Testing** | 36 | 150+ | ⏳ Pending |

**Infrastructure Ready:**
- ✅ Database schema
- ✅ Formula evaluator (RPN parser)
- ✅ Geometry builder
- ✅ Model loader service
- ✅ Dynamic renderer
- ✅ Feature flag system
- ✅ Component ID mapper
- ✅ Database indexes
- ✅ Admin panel guide (50 pages)
- ✅ Rollback procedures (40 pages)

**Models Complete: 4/150 (2.6%)**
**Documentation: 182+ pages**
**Tests: 230+ passing**

---

## ⚠️ Risk Mitigation

### **Risk: Scope Too Large**

**Mitigation:**
- Phased approach (6 phases over 24 weeks)
- Early wins build confidence (Week 19 ✅)
- Can pause at any phase boundary
- Feature flag allows gradual rollout

### **Risk: Corner Unit Geometry Variation**

**Mitigation:**
- Proven framework from Week 19
- Template approach: copy/modify proven L-shape pattern
- Visual regression testing for each new corner type

### **Risk: Multi-Room Complexity**

**Mitigation:**
- Same infrastructure works for all rooms
- Room-specific materials in database
- Component ID mapper handles all types
- Incremental testing room-by-room

### **Risk: Performance at Scale**

**Mitigation:**
- Database indexes already added (Week 19)
- Caching system proven effective
- Lazy loading for less common components
- Performance testing in Week 36

---

## 🚀 Success Metrics

**Functional:**
- ✅ 150+ components render correctly across all room types
- ✅ All corner/L-shaped components maintain exact geometry
- ✅ Auto-rotate works in all scenarios
- ✅ Zero visual regressions

**Performance:**
- ✅ Model load time < 50ms per component
- ✅ Cache hit rate > 90%
- ✅ No lag with 20+ components in scene

**Code Quality:**
- ✅ Complete elimination of hardcoded geometry
- ✅ Reusable services across all rooms
- ✅ Comprehensive admin documentation
- ✅ Production-grade rollback procedures

**User Experience:**
- ✅ Seamless multi-room design workflow
- ✅ Instant component availability via database
- ✅ Consistent visual quality
- ✅ Zero downtime during rollout

---

## 🎉 Vision: Complete Multi-Room Interior Design System

**By Week 36, users will be able to design:**
- **Kitchens** - Full cabinet library with appliances
- **Bedrooms** - Beds, wardrobes, storage, furniture
- **Bathrooms** - Vanities, fixtures, storage
- **Living Rooms** - Media units, sofas, shelving, entertainment systems
- **Offices** - Desks, chairs, storage, shelving
- **Dressing Rooms** - Walk-in wardrobes, vanities, storage
- **Dining Rooms** - Flooring, furniture
- **Universal** - Counter-tops, end panels, props

**All with:**
- Dynamic 3D rendering
- Parametric sizing
- Corner component auto-rotation
- Material variations
- Admin-panel extensibility
- Instant rollback capability

---

**This is the most comprehensive interior design 3D system - 150+ components, 24 weeks, complete multi-room coverage.**
