# Comprehensive Testing Strategy
**Date:** 2025-10-17
**Status:** 📋 READY FOR TESTING
**Priority:** 🔴 CRITICAL - Must pass before deployment

---

## 🎯 Testing Approach

**Philosophy:** Test early, test often, test thoroughly

**Strategy:**
1. Unit tests for utilities
2. Integration tests for systems
3. Manual tests for UX
4. Regression tests for existing features

---

## 📋 Testing Checklist

### ✅ Phase 1: Configuration Tests

#### Unit Tests
```typescript
// test/services/ConfigurationService.test.ts
describe('ConfigurationService', () => {
  beforeAll(async () => {
    await ConfigurationService.preload();
  });

  test('loads all config values', () => {
    expect(ConfigurationService.getSync('wall_clearance', 0)).toBe(5);
    expect(ConfigurationService.getSync('corner_snap_threshold', 0)).toBe(60);
  });

  test('returns fallback for missing config', () => {
    expect(ConfigurationService.getSync('non_existent_key', 999)).toBe(999);
  });

  test('loads JSON config correctly', () => {
    const rotations = ConfigurationService.getJSON('rotation_defaults');
    expect(rotations?.corners.top_left).toBe(0);
  });
});
```

#### Integration Tests
- [ ] App starts with config preloaded
- [ ] All hardcoded values replaced
- [ ] Config changes reflected in behavior
- [ ] Fallbacks work if database unavailable

---

### ✅ Phase 2: Wall Rendering Tests

#### Visual Tests (Manual)
- [ ] Walls render as 2px lines
- [ ] No filled rectangles visible
- [ ] Lines clear at zoom 0.5x
- [ ] Lines clear at zoom 1.0x
- [ ] Lines clear at zoom 2.0x
- [ ] Lines clear at zoom 4.0x
- [ ] Complex room walls render correctly

#### Regression Tests
- [ ] Components still visible
- [ ] Grid not affected
- [ ] Room dimensions label visible

---

### ✅ Phase 3: Rotation Tests

#### Unit Tests
```typescript
// test/utils/RotationUtils.test.ts
describe('RotationUtils', () => {
  test('getRotatedBounds() at 0°', () => {
    const bounds = getRotatedBounds(100, 100, 60, 40, 0);
    expect(bounds.minX).toBeCloseTo(70);
    expect(bounds.maxX).toBeCloseTo(130);
    expect(bounds.minY).toBeCloseTo(80);
    expect(bounds.maxY).toBeCloseTo(120);
  });

  test('getRotatedBounds() at 90°', () => {
    const bounds = getRotatedBounds(100, 100, 60, 40, 90);
    // Width and height swapped
    expect(bounds.maxX - bounds.minX).toBeCloseTo(40);
    expect(bounds.maxY - bounds.minY).toBeCloseTo(60);
  });

  test('isPointInRotatedRect() center hit', () => {
    expect(isPointInRotatedRect(100, 100, 100, 100, 60, 40, 0)).toBe(true);
  });

  test('isPointInRotatedRect() outside', () => {
    expect(isPointInRotatedRect(200, 200, 100, 100, 60, 40, 0)).toBe(false);
  });
});
```

#### Integration Tests
- [ ] Rotate 0° - component stable
- [ ] Rotate 90° - component stable
- [ ] Rotate 180° - component stable
- [ ] Rotate 270° - component stable
- [ ] Rotate 45° - component stable
- [ ] Center position unchanged during rotation
- [ ] Bounding box matches rotated component

#### Manual Tests
- [ ] Click on rotated component (hit detection)
- [ ] Drag rotated component
- [ ] Rotate component with handles
- [ ] Selection box matches component
- [ ] Handles at correct corners

---

### ✅ Phase 4: Snapping Tests

#### Integration Tests
- [ ] Drop near left wall → snaps
- [ ] Drop near right wall → snaps
- [ ] Drop near top wall → snaps
- [ ] Drop near bottom wall → snaps
- [ ] Drop in top-left corner → snaps
- [ ] Drop in top-right corner → snaps
- [ ] Drop in bottom-left corner → snaps
- [ ] Drop in bottom-right corner → snaps
- [ ] Drop in center → no snap
- [ ] No double-snapping

#### Regression Tests
- [ ] Snapping threshold from database
- [ ] Corner threshold from database
- [ ] Rotation correct after snap

---

### ✅ Phase 5: Drag Preview Tests

#### Manual Tests
- [ ] Preview size matches final at zoom 0.5x
- [ ] Preview size matches final at zoom 1.0x
- [ ] Preview size matches final at zoom 2.0x
- [ ] Preview size matches final at zoom 4.0x
- [ ] Preview centered on cursor
- [ ] Drop position matches preview position

#### Regression Tests
- [ ] Corner component preview correct
- [ ] Regular component preview correct
- [ ] Large component preview correct

---

### ✅ Phase 6: End-to-End Tests

#### Complete User Workflows

**Workflow 1: Add Component**
1. Select component from sidebar
2. Drag to canvas
3. Drop in room center
4. Component appears at drop position
5. Component snaps to grid (optional)

**Expected:** ✅ Component exactly where dropped

**Workflow 2: Add & Snap to Wall**
1. Select component
2. Drag to near left wall
3. Drop
4. Component snaps to wall
5. Rotation set to face into room

**Expected:** ✅ Component flush against wall, correct rotation

**Workflow 3: Add & Snap to Corner**
1. Select corner component
2. Drag to top-left corner
3. Drop
4. Component snaps to corner
5. Rotation set for corner

**Expected:** ✅ Component in corner, correct rotation

**Workflow 4: Rotate Component**
1. Select component
2. Grab rotation handle
3. Rotate 90°
4. Release

**Expected:** ✅ Component rotates around center, no position jump

**Workflow 5: Complex Room**
1. Create L-shaped room
2. Add component near return wall
3. Component snaps correctly
4. Walls visible as lines

**Expected:** ✅ All features work in complex rooms

---

### ✅ Regression Testing

**Test EVERYTHING that could break:**

#### Canvas Functionality
- [ ] Pan works
- [ ] Zoom works
- [ ] Select component
- [ ] Move component
- [ ] Rotate component
- [ ] Delete component
- [ ] Undo/redo
- [ ] Copy/paste
- [ ] Multi-select

#### Component Features
- [ ] Properties panel
- [ ] Component color
- [ ] Component dimensions
- [ ] Component type
- [ ] Component visibility
- [ ] Z-index layering

#### 3D View
- [ ] 3D rendering still works
- [ ] Components visible in 3D
- [ ] Positions match 2D
- [ ] Rotation matches 2D
- [ ] Complex rooms render

#### Elevation Views
- [ ] Front elevation works
- [ ] Back elevation works
- [ ] Left elevation works
- [ ] Right elevation works
- [ ] Components filtered correctly

#### Save/Load
- [ ] Save project
- [ ] Load project
- [ ] Auto-save works
- [ ] Positions preserved
- [ ] Rotations preserved

---

## 📊 Test Coverage Goals

### Unit Tests: 80%+
- All utility functions
- All calculation functions
- All configuration access

### Integration Tests: 60%+
- Component placement flow
- Rotation flow
- Snapping flow
- Configuration loading

### Manual Tests: 100%
- All user workflows
- All visual elements
- All edge cases

---

## 🎯 Acceptance Criteria

### Must Pass (Blocking)
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] All regressions fixed

### Should Pass (Important)
- [ ] Manual tests complete
- [ ] Performance benchmarks met
- [ ] Visual quality verified
- [ ] UX smooth and intuitive

### Nice to Have (Polish)
- [ ] Edge cases handled gracefully
- [ ] Error messages helpful
- [ ] Animations smooth
- [ ] Loading states clear

---

## 🐛 Bug Reporting Template

**When you find a bug:**

```markdown
## Bug Report

**Title:** [Short description]

**Severity:** [Critical / High / Medium / Low]

**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Screenshots:**
[If applicable]

**Environment:**
- Browser: [Chrome/Firefox/Safari]
- OS: [Windows/Mac/Linux]
- Zoom level: [0.5x/1.0x/2.0x/etc.]
- Room type: [Rectangular/L-shaped/U-shaped]

**Console Logs:**
[Any errors or warnings]
```

---

## 📈 Testing Progress Tracker

### Phase 1: Configuration ⬜ 0/10
- [ ] Unit tests written
- [ ] Unit tests passing
- [ ] Integration tests written
- [ ] Integration tests passing
- [ ] Manual verification
- [ ] Database records verified
- [ ] Type checking passes
- [ ] No console errors
- [ ] Fallbacks tested
- [ ] Performance acceptable

### Phase 2: Walls ⬜ 0/7
- [ ] Visual tests complete
- [ ] Zoom levels tested
- [ ] Complex rooms tested
- [ ] Regression tests pass
- [ ] Performance acceptable
- [ ] No visual artifacts
- [ ] User feedback positive

### Phase 3: Rotation ⬜ 0/15
- [ ] Unit tests written
- [ ] Unit tests passing
- [ ] 0° rotation tested
- [ ] 90° rotation tested
- [ ] 180° rotation tested
- [ ] 270° rotation tested
- [ ] Arbitrary angles tested
- [ ] Center stability verified
- [ ] Hit detection working
- [ ] Handles positioned correctly
- [ ] Selection box correct
- [ ] Performance acceptable
- [ ] No position jumping
- [ ] Smooth animation
- [ ] User feedback positive

### Phase 4: Snapping ⬜ 0/12
- [ ] Wall snap left
- [ ] Wall snap right
- [ ] Wall snap top
- [ ] Wall snap bottom
- [ ] Corner snap TL
- [ ] Corner snap TR
- [ ] Corner snap BR
- [ ] Corner snap BL
- [ ] No double-snapping
- [ ] Thresholds from DB
- [ ] Rotation correct
- [ ] User feedback positive

### Phase 5: Preview ⬜ 0/8
- [ ] Zoom 0.5x tested
- [ ] Zoom 1.0x tested
- [ ] Zoom 2.0x tested
- [ ] Zoom 4.0x tested
- [ ] Position matches
- [ ] Size matches
- [ ] Center correct
- [ ] User feedback positive

### Phase 6: End-to-End ⬜ 0/5
- [ ] Workflow 1 complete
- [ ] Workflow 2 complete
- [ ] Workflow 3 complete
- [ ] Workflow 4 complete
- [ ] Workflow 5 complete

### Regression Tests ⬜ 0/25
- [ ] Pan
- [ ] Zoom
- [ ] Select
- [ ] Move
- [ ] Rotate
- [ ] Delete
- [ ] Undo
- [ ] Redo
- [ ] Copy
- [ ] Paste
- [ ] Multi-select
- [ ] Properties
- [ ] Color
- [ ] Dimensions
- [ ] Type
- [ ] Visibility
- [ ] Z-index
- [ ] 3D view
- [ ] Elevations (4 views)
- [ ] Save
- [ ] Load
- [ ] Auto-save

**Overall Progress:** ⬜ 0/82 tests

---

**Document Status:** ✅ COMPLETE
**Next Step:** Begin Implementation
**Estimated Testing Time:** 12-16 hours
