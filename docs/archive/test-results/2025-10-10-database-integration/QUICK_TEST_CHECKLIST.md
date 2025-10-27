# Quick Test Checklist

## Setup
- [ ] Run `npm run dev`
- [ ] Open browser DevTools (F12)
- [ ] Navigate to `/designer`

## Tests (20 minutes)

### ☑️ TEST 1: Room Colors (2 min)
- Create kitchen → 3D view → Check console for room color log
- **Screenshot:** Console log + 3D view

### ☑️ TEST 2: Appliance Colors (3 min)
- Add oven, dishwasher, fridge → 3D view → Check console
- **Screenshot:** Console logs + 3D view

### ☑️ TEST 3: Furniture Colors (3 min)
- New bedroom → Add bed, sofa, chair → 3D view → Check console
- **Screenshot:** Console logs + 3D view

### ☑️ TEST 4: Room Type Colors (5 min)
- Create kitchen, bedroom, bathroom → Check each 3D view
- **Screenshot:** Console for each room type

### ☑️ TEST 5: Admin Appliances (2 min)
- Go to `/dev/types` → Appliances tab → Verify 12 items
- **Screenshot:** List view

### ☑️ TEST 6: Admin Furniture (2 min)
- Furniture tab → Verify 21 items
- **Screenshot:** List view

### ☑️ TEST 7: Fallback Check (1 min)
- If no errors in above tests → PASS
- **Note:** "No database errors"

### ☑️ TEST 8: Build Check (2 min)
- Stop server → Run `npm run type-check` + `npm run build`
- **Save:** Terminal output to text file

## Submit
Save all files to: `docs/test-results/2025-10-10-database-integration/`
- Screenshots (PNGs)
- Build output (TXT)
- Summary (MD)

## Expected Results
✅ Console shows database color loading messages
✅ 3D objects render with correct colors
✅ Admin UI displays all types
✅ Build succeeds
