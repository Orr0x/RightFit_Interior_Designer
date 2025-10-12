# BACKLOG: Interchangeable Hardware Feature

**Status:** 📋 Backlog - Future Feature
**Priority:** Medium
**Estimated Effort:** 2-3 weeks
**Dependencies:** Door/drawer config migration (must be completed first)

---

## Vision

Allow users to customize cabinet doors, handles, and hardware for each placed component, creating personalized kitchen designs with different styles and finishes.

## User Story

```
As a kitchen designer,
I want to change door styles and handles on individual cabinets,
So that I can create custom designs mixing modern and traditional elements.
```

**Example Workflow:**
1. User drags base cabinet onto canvas (shows default shaker doors)
2. User clicks cabinet → "Customize Hardware" panel appears
3. User selects:
   - Door style: Glass
   - Handle: Brass knobs
   - Door color: Navy blue
4. Cabinet updates in real-time (2D and 3D views)
5. User saves design → customizations persist
6. User reopens design → customizations load correctly

## Key Features

### Phase 1: Basic Customization (Week 1)
- **Door Styles:**
  - Flat (slab)
  - Shaker
  - Glass (clear, frosted)
  - Solid wood grain

- **Handle Types:**
  - Bar handle (modern)
  - Knob (traditional)
  - Recessed/integrated
  - None (push-to-open)

- **Handle Finishes:**
  - Chrome
  - Brushed steel
  - Brass
  - Black matte
  - White

### Phase 2: Advanced Options (Week 2)
- **Door Colors:**
  - Full color picker
  - Material presets (oak, walnut, painted)
  - Texture mapping

- **Handle Positioning:**
  - Top, center, bottom
  - Custom offset

- **Drawer Configuration:**
  - Number of drawers
  - Drawer height distribution
  - Mixed door/drawer layouts

### Phase 3: Templates & Catalog (Week 3)
- **Style Presets:**
  - Modern minimalist
  - Classic traditional
  - Farmhouse
  - Contemporary
  - Industrial

- **Hardware Catalog:**
  - Browse handle library
  - 3D preview of handles
  - Manufacturer integration (IKEA, etc.)

- **Save Custom Configs:**
  - Save as template
  - Apply to multiple cabinets
  - Share with team

## Technical Architecture

### Database Schema

**components.component_behavior (defaults & options):**
```json
{
  "door": {
    "default_style": "shaker",
    "available_styles": ["flat", "shaker", "glass", "solid"],
    "default_color": "#F5DEB3",
    "count": 2,
    "width_cm": 30
  },
  "handle": {
    "default_style": "bar",
    "available_styles": ["bar", "knob", "recessed", "none"],
    "default_finish": "brushed-steel",
    "available_finishes": ["chrome", "brushed-steel", "brass", "black", "white"],
    "default_position": "center"
  },
  "drawer": {
    "count": 0,
    "heights_cm": [],
    "max_drawers": 4
  },
  "customizable": true,
  "hardware_catalog_compatible": true
}
```

**designs.elements (user customizations):**
```typescript
interface DesignElement {
  // ... existing fields

  hardware_config?: {
    door?: {
      style: 'flat' | 'shaker' | 'glass' | 'solid' | 'custom';
      color?: string; // Hex color override
      material?: string; // Wood grain, painted, etc.
      finish?: 'matte' | 'gloss' | 'textured';
    };

    handle?: {
      style: 'bar' | 'knob' | 'recessed' | 'integrated' | 'none' | 'custom';
      finish: 'chrome' | 'brushed-steel' | 'brass' | 'black' | 'white' | 'custom';
      position: 'top' | 'center' | 'bottom' | number; // number = custom offset cm
      size?: number; // Handle length/diameter in cm
      model_id?: string; // For catalog items
    };

    drawer?: {
      count: number;
      heights_cm: number[];
      style?: 'standard' | 'soft-close' | 'push-open';
    };

    // Advanced
    hinge_side?: 'left' | 'right'; // For single doors
    door_swing?: number; // Degrees (for 3D animation)
    hardware_template_id?: string; // Reference to saved template
  };
}
```

### UI Components

**1. Hardware Customization Panel**
```tsx
<CabinetCustomizer
  element={selectedElement}
  availableOptions={componentBehavior}
  onUpdate={handleHardwareUpdate}
>
  <Tab label="Doors">
    <DoorStylePicker />
    <ColorPicker label="Door Color" />
    <MaterialSelector />
  </Tab>

  <Tab label="Handles">
    <HandleStylePicker />
    <FinishSelector />
    <PositionSlider />
  </Tab>

  <Tab label="Drawers">
    <DrawerCountSelector />
    <HeightDistribution />
  </Tab>

  <Tab label="Templates">
    <TemplateGallery />
    <SaveAsTemplate />
  </Tab>
</CabinetCustomizer>
```

**2. Quick Style Selector**
```tsx
// Floating toolbar on cabinet selection
<QuickStyleBar element={element}>
  <IconButton icon="doors" onClick={openDoorPicker} />
  <IconButton icon="handle" onClick={openHandlePicker} />
  <ColorSwatch color={currentColor} onClick={openColorPicker} />
  <Button>More Options...</Button>
</QuickStyleBar>
```

**3. Template Manager**
```tsx
<TemplateManager>
  <TemplateCard
    name="Modern Minimalist"
    preview={<3DPreview />}
    config={modernConfig}
  />
  <TemplateCard
    name="Classic Traditional"
    preview={<3DPreview />}
    config={classicConfig}
  />
  <CreateNewTemplate />
</TemplateManager>
```

### Rendering Updates

**2D Renderer:**
```typescript
// elevation-view-handlers.ts

function renderCabinetDoors(ctx, element, config) {
  const doorStyle = element.hardware_config?.door?.style ||
                    componentBehavior.door.default_style;

  switch (doorStyle) {
    case 'shaker':
      drawShakerPanels(ctx, ...);
      break;
    case 'glass':
      drawGlassDoors(ctx, ...);
      applyFrostedEffect();
      break;
    case 'flat':
      drawFlatDoors(ctx, ...);
      break;
  }

  const handleStyle = element.hardware_config?.handle?.style || 'bar';
  drawHandle(ctx, handleStyle, ...);
}
```

**3D Renderer:**
```tsx
// EnhancedModels3D.tsx

{element.hardware_config?.door?.style === 'shaker' && (
  <ShakerDoorMesh
    color={element.hardware_config.door.color}
    material={element.hardware_config.door.material}
  />
)}

{element.hardware_config?.door?.style === 'glass' && (
  <GlassDoorMesh
    transparency={0.7}
    finish="frosted"
  />
)}

<HandleMesh
  type={element.hardware_config?.handle?.style}
  finish={element.hardware_config?.handle?.finish}
  position={calculateHandlePosition(...)}
/>
```

### Services

**HardwareService.ts (new):**
```typescript
class HardwareService {
  // Template management
  static async saveTemplate(name: string, config: HardwareConfig): Promise<string>;
  static async loadTemplate(templateId: string): Promise<HardwareConfig>;
  static async listTemplates(): Promise<Template[]>;

  // Validation
  static validateConfig(config: HardwareConfig, component: ComponentType): ValidationResult;
  static getCompatibleHandles(doorStyle: string): HandleStyle[];

  // Catalog integration (future)
  static async searchHardwareCatalog(query: string): Promise<CatalogItem[]>;
  static async getHandleModel(modelId: string): Promise<3DModel>;
}
```

**ComponentBehaviorCache.ts (enhance existing):**
```typescript
// Cache hardware options per component type
const hardwareOptionsCache = new Map<string, HardwareOptions>();

export function getHardwareOptions(componentId: string): HardwareOptions {
  // Returns available_styles, finishes, etc. from component_behavior
}
```

## Implementation Phases

### ✅ **Prerequisites** (Complete First)
1. ✅ Migrate door/drawer config to `component_behavior` (DOOR_DRAWER_CONFIG_MIGRATION.md)
2. ✅ Consolidate plinth_height (PLINTH_HEIGHT_MIGRATION_PLAN.md)
3. ✅ Ensure 2D/3D rendering consistency

### 📋 **Phase 1: Foundation** (Week 1)
**Goal:** Basic door/handle swapping works

**Day 1-2: Data Layer**
- Add `hardware_config` to DesignElement interface
- Create HardwareService basic methods
- Update ComponentService to load hardware options

**Day 3-4: Rendering**
- Implement door style rendering (flat, shaker, glass)
- Implement handle rendering (bar, knob, none)
- Update 2D and 3D renderers

**Day 5: UI**
- Create basic customization panel
- Wire up to state management
- Test real-time updates

**Deliverable:** User can change door style and handle on placed cabinet

---

### 📋 **Phase 2: Customization** (Week 2)
**Goal:** Full color/finish/material control

**Day 1-2: Colors & Materials**
- Color picker integration
- Material texture library
- Finish options (matte/gloss)

**Day 3-4: Advanced Config**
- Drawer count/height control
- Handle positioning
- Hinge side selection

**Day 5: Polish**
- Real-time preview updates
- Undo/redo support
- Performance optimization

**Deliverable:** User has full control over hardware appearance

---

### 📋 **Phase 3: Templates & Catalog** (Week 3)
**Goal:** Preset templates and hardware library

**Day 1-2: Templates**
- Template save/load system
- Style presets (modern, traditional, etc.)
- Apply template to multiple cabinets

**Day 3-4: Catalog**
- Hardware catalog browser
- 3D handle previews
- Filter by style/finish/manufacturer

**Day 5: Integration**
- Save templates with designs
- Share templates between projects
- Export hardware specifications

**Deliverable:** Complete hardware customization system

---

## User Experience Flow

### Discovery
```
User places cabinet
→ Cabinet appears with default hardware
→ Subtle hint: "Click to customize hardware"
```

### Customization
```
User clicks cabinet
→ Quick style bar appears
→ User clicks "Doors" icon
→ Door style picker opens (flat, shaker, glass, solid)
→ User selects "Glass"
→ Cabinet updates instantly in 2D and 3D
→ User clicks "Handle" icon
→ Handle picker opens with finishes
→ User selects "Brass knob"
→ Cabinet updates with brass knobs
```

### Templates
```
User happy with combination
→ Clicks "Save as template"
→ Names it "Modern Brass"
→ Later places another cabinet
→ Clicks "Apply template"
→ Selects "Modern Brass"
→ Cabinet matches first one instantly
```

### Bulk Operations
```
User has 10 base cabinets
→ Selects all 10 (Shift+click)
→ Clicks "Apply hardware to selection"
→ All update to same style
```

## Business Value

### For Users
- ✅ Personalized designs
- ✅ Mix and match styles
- ✅ See realistic hardware in 3D
- ✅ Fast iteration (try different looks)

### For Business
- ✅ Differentiation (competitor analysis needed)
- ✅ Higher engagement (customization = longer sessions)
- ✅ Upsell opportunity (premium handles/materials)
- ✅ Integration with suppliers (affiliate commissions)

## Technical Debt Prevention

**Good practices:**
- ✅ Validate configs against component_behavior rules
- ✅ Fallback to defaults if invalid
- ✅ Version hardware_config schema (for future changes)
- ✅ Cache 3D handle models (performance)
- ✅ Lazy-load catalog (don't load all handles upfront)

**Avoid:**
- ❌ Don't hardcode handle positions
- ❌ Don't store 3D models in database (use URLs/IDs)
- ❌ Don't allow invalid combinations (validate)
- ❌ Don't forget to update both 2D and 3D

## Testing Strategy

**Unit Tests:**
- HardwareService methods
- Config validation
- Template save/load

**Integration Tests:**
- Apply hardware → verify 2D render
- Apply hardware → verify 3D render
- Save design → load design → hardware persists

**Manual Tests:**
- Try all door/handle combinations
- Test performance with 50+ customized cabinets
- Test template system
- Test bulk operations

**User Testing:**
- Can users find customization?
- Is it intuitive?
- Any confusing combinations?

## Future Enhancements (Beyond v1)

**Advanced Materials:**
- Wood grain textures
- Metallic finishes
- Custom UV mapping

**3D Handle Catalog:**
- 1000+ handle models
- Real manufacturer data
- Price integration

**Hardware Animations:**
- Doors open/close in 3D
- Drawer slide animations
- Soft-close simulation

**AR Preview:**
- View hardware on phone camera
- See real scale in real space

**Supplier Integration:**
- Direct link to purchase
- Price calculator
- Stock availability

---

## Decision Log

**Why hardware_config in DesignElement, not components table?**
- ✅ Per-instance customization (each cabinet can differ)
- ✅ Persists with design (part of user's project)
- ✅ Doesn't pollute shared component definitions

**Why keep defaults in component_behavior?**
- ✅ Defines what's possible for each component type
- ✅ Provides sensible starting point
- ✅ Can restrict options (some cabinets don't support glass)

**Why templates, not just favorites?**
- ✅ Captures full configuration (doors + handles + drawers)
- ✅ Can name and organize
- ✅ Reusable across projects
- ✅ Shareable with team

---

## Success Metrics

**Technical:**
- [ ] Config applied in < 100ms
- [ ] 2D and 3D always match
- [ ] No performance degradation with 100 customized cabinets
- [ ] Template save/load < 500ms

**User:**
- [ ] 60%+ of users try customization feature
- [ ] Average 3+ customizations per design
- [ ] 40%+ save at least one template
- [ ] < 5% support tickets related to hardware

---

**Status:** 📋 Ready for prioritization
**Next Step:** Complete prerequisites, then schedule Phase 1
**Owner:** TBD
**Est. Launch:** TBD (after door/drawer migration + plinth migration)
