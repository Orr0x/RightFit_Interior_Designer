# Visual Test Plan: Database Integration
**Date:** 2025-10-10
**Features Tested:** ComponentTypeService, RoomService, 3D rendering colors
**Test Type:** Manual visual testing
**Tester:** Human

---

## Test Environment Setup

### Prerequisites
- [ ] Dev server running: `npm run dev`
- [ ] Browser console open (F12) for logs
- [ ] Database migrations applied successfully
- [ ] Supabase connection working

### Expected Database State
The following tables should be populated:
- `appliance_types` - 12 appliances with colors
- `furniture_types` - 21 furniture items with colors
- `room_type_templates` - 12 room types with default_colors
- `components` - All components with default_z_position and plinth_height

---

## Test Suite

## TEST 1: Room Colors Load from Database
**Feature:** Room floor/wall colors load from room_type_templates table
**Time:** 2 minutes

### Steps:
1. Start dev server: `npm run dev`
2. Navigate to: `/designer`
3. Create a new kitchen design
4. Switch to 3D view
5. Open browser console (F12)

### Expected Results:
✅ Console should show:
```
✅ [AdaptiveView3D] Loaded room colors from database for kitchen: {floor: "#f5f5f5", walls: "#ffffff", ceiling: "#fafafa", text: "#666666"}
```

✅ 3D room should render with:
- **Floor:** Light grey (#f5f5f5)
- **Walls:** White (#ffffff)

### Evidence Required:
📸 **Screenshot:** `test1_room_colors_console.png`
- Browser console showing the log message with room colors

📸 **Screenshot:** `test1_3d_view_colors.png`
- 3D view showing floor and wall colors

### Pass Criteria:
- Console log appears
- Floor is light grey (not dark or wrong color)
- Walls are white (not colored)

---

## TEST 2: Appliance Colors Load from Database
**Feature:** Appliances load colors from appliance_types table
**Time:** 3 minutes

### Steps:
1. In the same kitchen design from Test 1
2. Add these appliances from the component panel:
   - Oven (should be dark grey #2c2c2c)
   - Dishwasher (should be light grey #e0e0e0)
   - Fridge (should be off-white #f0f0f0)
3. Switch to 3D view
4. Open browser console

### Expected Results:
✅ Console should show for EACH appliance:
```
✅ [EnhancedAppliance3D] Loaded color from database: #2c2c2c for oven
✅ [EnhancedAppliance3D] Loaded color from database: #e0e0e0 for dishwasher
✅ [EnhancedAppliance3D] Loaded color from database: #f0f0f0 for refrigerator
```

✅ 3D view should show:
- **Oven:** Dark grey (almost black)
- **Dishwasher:** Light grey
- **Fridge:** Off-white (almost white but slightly grey)

### Evidence Required:
📸 **Screenshot:** `test2_appliance_colors_console.png`
- Console showing all 3 color loading messages

📸 **Screenshot:** `test2_3d_appliances.png`
- 3D view showing the 3 appliances with distinct colors

### Pass Criteria:
- 3 console logs appear (one per appliance)
- Colors match database values
- Each appliance has a different color (not all the same)

---

## TEST 3: Furniture Colors Load from Database
**Feature:** Furniture items load colors from furniture_types table
**Time:** 3 minutes

### Steps:
1. Create a new bedroom design
2. Add these furniture items:
   - Bed (should be wood brown #8B7355)
   - Sofa (should be grey #808080)
   - Dining chair (should be wood brown #8B7355)
3. Switch to 3D view
4. Open browser console

### Expected Results:
✅ Console should show:
```
✅ [EnhancedAppliance3D] Loaded color from database: #8B7355 for bed
✅ [EnhancedAppliance3D] Loaded color from database: #808080 for sofa
✅ [EnhancedAppliance3D] Loaded color from database: #8B7355 for chair
```

✅ 3D view should show:
- **Bed:** Brown wood color
- **Sofa:** Grey fabric color
- **Chair:** Brown wood color (same as bed)

### Evidence Required:
📸 **Screenshot:** `test3_furniture_colors_console.png`
- Console showing color loading messages

📸 **Screenshot:** `test3_3d_furniture.png`
- 3D view showing furniture with proper colors

### Pass Criteria:
- Console logs appear for all 3 items
- Bed and chair have same brown color (wood)
- Sofa has different grey color (fabric)

---

## TEST 4: Different Room Types Have Different Colors
**Feature:** Room colors vary by room type
**Time:** 5 minutes

### Steps:
1. Create designs for 3 different room types:
   - Kitchen
   - Bedroom
   - Bathroom
2. For each room, switch to 3D view
3. Check console logs
4. Note the floor/wall colors

### Expected Results:
✅ Each room type should load its own color scheme from database
✅ Console should show different room type names:
```
✅ [AdaptiveView3D] Loaded room colors from database for kitchen: {...}
✅ [AdaptiveView3D] Loaded room colors from database for bedroom: {...}
✅ [AdaptiveView3D] Loaded room colors from database for bathroom: {...}
```

### Evidence Required:
📸 **Screenshot:** `test4_kitchen_console.png` + `test4_kitchen_3d.png`
📸 **Screenshot:** `test4_bedroom_console.png` + `test4_bedroom_3d.png`
📸 **Screenshot:** `test4_bathroom_console.png` + `test4_bathroom_3d.png`

### Pass Criteria:
- Each room type shows correct name in console
- Colors load successfully (even if currently the same)
- No errors in console

---

## TEST 5: Admin UI - View Appliance Types
**Feature:** Admin can view all appliance types from database
**Time:** 2 minutes

### Steps:
1. Navigate to: `/dev/types`
2. Verify you can access the page (DEV tier required)
3. Click "Appliances" tab (should be default)
4. Scroll through the list

### Expected Results:
✅ Page loads successfully
✅ Shows "Appliances (12)" in tab
✅ Displays 12 appliance cards including:
- Oven (dark grey color swatch)
- Dishwasher (light grey color swatch)
- Fridge (off-white color swatch)
- Washing machine, tumble dryer, microwave, hob, etc.

✅ Each card shows:
- Appliance name
- Appliance code (e.g., "oven")
- Category badge
- Color swatch (visual square)
- Hex color code
- Dimensions (if available)
- Description

### Evidence Required:
📸 **Screenshot:** `test5_admin_appliances_list.png`
- Full view of appliances tab showing multiple cards

📸 **Screenshot:** `test5_admin_appliance_detail.png`
- Close-up of one appliance card showing all fields

### Pass Criteria:
- 12 appliances displayed
- Color swatches render correctly
- All fields populated
- No loading errors

---

## TEST 6: Admin UI - View Furniture Types
**Feature:** Admin can view all furniture types from database
**Time:** 2 minutes

### Steps:
1. Still on `/dev/types` page
2. Click "Furniture" tab
3. Scroll through the list

### Expected Results:
✅ Shows "Furniture (21)" in tab
✅ Displays 21 furniture cards including:
- Single bed, double bed, king bed
- Wardrobes, chest of drawers
- Sofas (2-seater, 3-seater)
- Dining tables, chairs
- Office desks, chairs

✅ Each card shows:
- Furniture name
- Furniture code
- Category badge (Bedroom, Living Room, Dining Room, Office)
- Color swatch (may be null for some)
- Material (wood, fabric, metal)
- Dimensions
- Style tags (modern, classic, etc.)
- Weight capacity (if applicable)

### Evidence Required:
📸 **Screenshot:** `test6_admin_furniture_list.png`
- Full view of furniture tab

📸 **Screenshot:** `test6_admin_furniture_detail.png`
- Close-up of one furniture card showing all fields

### Pass Criteria:
- 21 furniture items displayed
- Different categories visible
- Style tags render correctly
- No loading errors

---

## TEST 7: Fallback Behavior (No Database)
**Feature:** System gracefully falls back to hardcoded colors if database fails
**Time:** 3 minutes

### Steps:
1. This test requires temporarily breaking the database connection
2. **OR** simply check console for any database errors during normal operation
3. If no errors appear in Tests 1-6, this test PASSES

### Expected Results:
✅ If database query fails, console should show:
```
⚠️ [AdaptiveView3D] Failed to load room colors for kitchen: [error]
⚠️ [EnhancedAppliance3D] Loaded color from database: null for oven
```

✅ BUT rendering should still work with fallback colors:
- Oven: #2c2c2c (same as database default)
- Dishwasher: #e0e0e0
- Fridge: #f0f0f0

### Evidence Required:
📝 **Note:** `test7_fallback_result.txt`
- If all previous tests passed without errors, write:
  "No database errors observed. Fallback not triggered. PASS"
- If errors occurred, capture screenshot showing fallback in action

### Pass Criteria:
- Either: No database errors (all previous tests passed)
- Or: Fallback colors render correctly when database fails

---

## TEST 8: TypeScript Compilation & Build
**Feature:** All new code compiles and builds successfully
**Time:** 2 minutes

### Steps:
1. Stop dev server (Ctrl+C)
2. Run: `npm run type-check`
3. Run: `npm run build`

### Expected Results:
✅ Type check completes with no errors:
```
> tsc --noEmit
[no output = success]
```

✅ Build completes successfully:
```
✓ built in 8.01s
```

### Evidence Required:
📋 **Console Output:** `test8_build_output.txt`
- Copy/paste the full terminal output from both commands

### Pass Criteria:
- Type check: No errors
- Build: Completes successfully (warnings OK)

---

## Test Results Summary Template

After completing all tests, create a summary file:

**File:** `TEST_RESULTS_SUMMARY.md`

```markdown
# Test Results Summary
**Date:** 2025-10-10
**Tester:** [Your Name]
**Duration:** [Total time taken]

## Results Overview
- Total Tests: 8
- Passed: X
- Failed: X
- Skipped: X

## Test Results

### TEST 1: Room Colors Load from Database
**Status:** ✅ PASS / ❌ FAIL
**Notes:** [Any observations]

### TEST 2: Appliance Colors Load from Database
**Status:** ✅ PASS / ❌ FAIL
**Notes:** [Any observations]

### TEST 3: Furniture Colors Load from Database
**Status:** ✅ PASS / ❌ FAIL
**Notes:** [Any observations]

### TEST 4: Different Room Types Have Different Colors
**Status:** ✅ PASS / ❌ FAIL
**Notes:** [Any observations]

### TEST 5: Admin UI - View Appliance Types
**Status:** ✅ PASS / ❌ FAIL
**Notes:** [Any observations]

### TEST 6: Admin UI - View Furniture Types
**Status:** ✅ PASS / ❌ FAIL
**Notes:** [Any observations]

### TEST 7: Fallback Behavior
**Status:** ✅ PASS / ❌ FAIL
**Notes:** [Any observations]

### TEST 8: TypeScript Compilation & Build
**Status:** ✅ PASS / ❌ FAIL
**Notes:** [Any observations]

## Issues Found
[List any bugs, errors, or unexpected behavior]

## Recommendations
[Any suggestions for improvements]
```

---

## File Organization

Save all test evidence in: `docs/test-results/2025-10-10-database-integration/`

### Expected Files:
```
docs/test-results/2025-10-10-database-integration/
├── VISUAL_TEST_PLAN.md (this file)
├── TEST_RESULTS_SUMMARY.md (you create)
├── test1_room_colors_console.png
├── test1_3d_view_colors.png
├── test2_appliance_colors_console.png
├── test2_3d_appliances.png
├── test3_furniture_colors_console.png
├── test3_3d_furniture.png
├── test4_kitchen_console.png
├── test4_kitchen_3d.png
├── test4_bedroom_console.png
├── test4_bedroom_3d.png
├── test4_bathroom_console.png
├── test4_bathroom_3d.png
├── test5_admin_appliances_list.png
├── test5_admin_appliance_detail.png
├── test6_admin_furniture_list.png
├── test6_admin_furniture_detail.png
├── test7_fallback_result.txt
└── test8_build_output.txt
```

---

## Tips for Effective Testing

### Browser Console
- Keep F12 DevTools open throughout testing
- Use Console tab to see logs
- Clear console between tests (Ctrl+L) for clarity
- Use Console filter to search for specific messages (e.g., "AdaptiveView3D")

### Screenshots
- Use Windows Snipping Tool (Win+Shift+S)
- Capture enough context (include URL bar and console)
- Save with descriptive filenames matching test plan
- Highlight important areas if needed

### Console Logs to Look For
**Success indicators:**
- ✅ (green checkmark)
- "Loaded color from database"
- "Loaded room colors from database"

**Warning indicators:**
- ⚠️ (warning symbol)
- "Failed to load"
- "No template found"

**Error indicators:**
- ❌ (red X)
- "[ERROR]"
- Red text in console

### Common Issues
1. **Colors don't load:** Check Supabase connection in browser Network tab
2. **Admin page won't load:** Check user tier (needs DEV or god mode)
3. **Console logs missing:** Check if console is filtering by level (show "Info" and "Log")
4. **Wrong colors:** Check database has correct values using Supabase dashboard

---

## What I Need to See

When you complete testing, provide:

1. ✅ **TEST_RESULTS_SUMMARY.md** - Overall results
2. 📸 **Key screenshots** - At minimum:
   - test2_appliance_colors_console.png (proves database query works)
   - test2_3d_appliances.png (proves colors render correctly)
   - test5_admin_appliances_list.png (proves admin UI works)
3. 📋 **test8_build_output.txt** - Build success confirmation

Optional but helpful:
- Any error messages you encounter
- Unexpected behavior notes
- Performance observations (slow loading, lag, etc.)

---

## Success Criteria

**All 8 tests should PASS** ✅

If any test fails:
1. Note the failure in TEST_RESULTS_SUMMARY.md
2. Capture error screenshots/logs
3. Describe what happened vs. what was expected
4. Report back and I'll investigate/fix

**Estimated Total Time:** 20-25 minutes

---

**Ready to start testing?**

1. Start dev server: `npm run dev`
2. Open browser to localhost
3. Open DevTools (F12)
4. Begin with TEST 1
5. Take screenshots as you go
6. Complete summary when done

Good luck! 🚀
