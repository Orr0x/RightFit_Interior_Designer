# Corner Cabinet Door Logic - Per-Elevation View

**Date:** 2025-10-10
**Status:** ✅ FIXED - View-specific logic implemented
**Issue:** Doors were on wrong side when viewing from different elevations

---

## The Problem

The original logic used the **same rule for all elevation views**:
- Front-left / Back-left → door on left
- Front-right / Back-right → door on right

This doesn't work because **each elevation view looks at a different wall** with a different perspective!

---

## Room Layout (Plan View)

```
        Front Wall (Y = 0)
     ┌─────────────────────┐
     │ FL              FR  │
     │                     │
Left │                     │ Right
Wall │                     │ Wall
(X=0)│                     │ (X=max)
     │                     │
     │ BL              BR  │
     └─────────────────────┘
        Back Wall (Y = max)

FL = Front-Left corner
FR = Front-Right corner
BL = Back-Left corner
BR = Back-Right corner
```

---

## New Logic: View-Specific Door Positioning

### 1. FRONT VIEW (looking at front wall, Y=0)

**You see:** Front-left (FL) and Front-right (FR) corners

```
Front View Elevation:
┌──────────────┬──────────────┐
│   FL Corner  │   FR Corner  │
│              │              │
│  Door│Panel  │  Panel│Door  │
│   🔘 │       │       │ 🔘   │
└──────────────┴──────────────┘
   LEFT side      RIGHT side
```

**Logic:**
- FL corner: Door on **LEFT** ✅
- FR corner: Door on **RIGHT** ✅

**Code:**
```typescript
if (currentView === 'front') {
  doorSide = (cornerPosition === 'front-left') ? 'left' : 'right';
}
```

---

### 2. BACK VIEW (looking at back wall, Y=max) - REVERSED!

**You see:** Back-left (BL) and Back-right (BR) corners
**Perspective:** You're looking from **opposite direction** - everything is mirrored!

```
Back View Elevation (viewing from back):
┌──────────────┬──────────────┐
│   BL Corner  │   BR Corner  │
│              │              │
│  Panel│Door  │  Door│Panel  │
│       │ 🔘   │   🔘 │       │
└──────────────┴──────────────┘
  RIGHT side       LEFT side
  (from viewer)    (from viewer)
```

**Logic (REVERSED):**
- BL corner: Door on **RIGHT** ✅ (was on wrong side before!)
- BR corner: Door on **LEFT** ✅ (was on wrong side before!)

**Code:**
```typescript
if (currentView === 'back') {
  // REVERSED perspective
  doorSide = (cornerPosition === 'back-left') ? 'right' : 'left';
}
```

---

### 3. LEFT VIEW (looking at left wall, X=0) - PERPENDICULAR

**You see:** Front-left (FL) and Back-left (BL) corners
**Perspective:** Looking at the **left wall**, perpendicular to front/back

```
Left View Elevation:
┌──────────────┬──────────────┐
│   FL Corner  │   BL Corner  │
│ (front leg)  │  (back leg)  │
│  Panel│Door  │  Door│Panel  │
│       │ 🔘   │   🔘 │       │
└──────────────┴──────────────┘
  RIGHT side       LEFT side
  (front leg)      (back leg)
```

**Logic:**
- FL corner: Door on **RIGHT** ✅ (front leg of L-shape visible)
- BL corner: Door on **LEFT** ✅ (back leg of L-shape visible)

**Code:**
```typescript
if (currentView === 'left') {
  doorSide = (cornerPosition === 'front-left') ? 'right' : 'left';
}
```

---

### 4. RIGHT VIEW (looking at right wall, X=max) - PERPENDICULAR

**You see:** Front-right (FR) and Back-right (BR) corners
**Perspective:** Looking at the **right wall**, perpendicular to front/back

```
Right View Elevation:
┌──────────────┬──────────────┐
│   FR Corner  │   BR Corner  │
│ (front leg)  │  (back leg)  │
│  Door│Panel  │  Panel│Door  │
│   🔘 │       │       │ 🔘   │
└──────────────┴──────────────┘
  LEFT side        RIGHT side
  (front leg)      (back leg)
```

**Logic:**
- FR corner: Door on **LEFT** ✅ (front leg of L-shape visible)
- BR corner: Door on **RIGHT** ✅ (back leg of L-shape visible)

**Code:**
```typescript
if (currentView === 'right') {
  doorSide = (cornerPosition === 'front-right') ? 'left' : 'right';
}
```

---

## Complete Logic Table

| Corner Position | Front View | Back View | Left View | Right View |
|----------------|------------|-----------|-----------|------------|
| **Front-Left (FL)** | LEFT ✅ | (not visible) | RIGHT ✅ | (not visible) |
| **Front-Right (FR)** | RIGHT ✅ | (not visible) | (not visible) | LEFT ✅ |
| **Back-Left (BL)** | (not visible) | RIGHT ✅ | LEFT ✅ | (not visible) |
| **Back-Right (BR)** | (not visible) | LEFT ✅ | (not visible) | RIGHT ✅ |

---

## Why This is Correct

### L-Shaped Corner Cabinets

Corner cabinets are **L-shaped** with two legs:
- One leg runs along the **front/back wall**
- One leg runs along the **left/right wall**

**Front/Back Views:** You see the **front/back leg** of the L
- Door should be on the **accessible side** (towards center of room)
- Back view is mirrored because you're looking from behind

**Left/Right Views:** You see the **side leg** of the L
- Front corners show the **front leg** (door on inside)
- Back corners show the **back leg** (door on inside)

---

## Testing Checklist

Test a corner cabinet in all 4 corners and all 4 views:

### Front-Left Corner Cabinet
- [ ] Front view: Door on LEFT, panel on right
- [ ] Left view: Panel on left, door on RIGHT
- [ ] Back view: (should not be visible or distant)
- [ ] Right view: (should not be visible or distant)

### Front-Right Corner Cabinet
- [ ] Front view: Panel on left, door on RIGHT
- [ ] Right view: Door on LEFT, panel on right
- [ ] Back view: (should not be visible or distant)
- [ ] Left view: (should not be visible or distant)

### Back-Left Corner Cabinet
- [ ] Back view: Panel on left, door on RIGHT
- [ ] Left view: Door on LEFT, panel on right
- [ ] Front view: (should not be visible or distant)
- [ ] Right view: (should not be visible or distant)

### Back-Right Corner Cabinet
- [ ] Back view: Door on LEFT, panel on right
- [ ] Right view: Panel on left, door on RIGHT
- [ ] Front view: (should not be visible or distant)
- [ ] Left view: (should not be visible or distant)

---

## Code Location

**File:** `src/services/2d-renderers/elevation-view-handlers.ts`
**Function:** `renderCornerCabinetDoors()`
**Lines:** 534-562

---

## Before vs After

### ❌ Before (Wrong)
```typescript
// Same logic for all views - WRONG!
if (cornerPosition === 'front-left' || cornerPosition === 'back-left') {
  doorSide = 'left';
} else {
  doorSide = 'right';
}
```

### ✅ After (Correct)
```typescript
// Different logic per elevation view - CORRECT!
if (currentView === 'front') {
  doorSide = (cornerPosition === 'front-left') ? 'left' : 'right';
} else if (currentView === 'back') {
  doorSide = (cornerPosition === 'back-left') ? 'right' : 'left'; // REVERSED
} else if (currentView === 'left') {
  doorSide = (cornerPosition === 'front-left') ? 'right' : 'left';
} else if (currentView === 'right') {
  doorSide = (cornerPosition === 'front-right') ? 'left' : 'right';
}
```

---

**Status:** ✅ Ready for testing!
