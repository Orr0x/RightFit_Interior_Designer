# 🤖 NEW CHAT CONTEXT - RightFit Interior Designer

## 🎯 **CRITICAL: READ THIS FIRST**

### **DEVELOPMENT RULES - NEVER BREAK THESE**
1. **NEVER TOUCH MAIN BRANCH** without explicit user permission
   - Always create safe branches: `git checkout -b feature/description-safe`
   - Never merge, push, or pull from main unless user explicitly says so
   - User handles all git operations to main branch

2. **TERMINAL SAFETY PROTOCOL**
   - If terminal output is not visible, STOP immediately
   - Ask user what they can see before proceeding
   - Never run commands blindly when output is unclear

3. **DEVELOPMENT WORKFLOW**
   - Always work in safe branches
   - Update DEVELOPMENT-BACKLOG.md with progress
   - Test thoroughly before asking for merge approval
   - User must approve all commits to main

---

## 📍 **CURRENT PROJECT STATUS: v2.5**

### **✅ COMPLETED MAJOR WORK**
- **Mobile/Touch Support**: Complete responsive design with touch gestures
- **Clean Codebase**: All TypeScript linting errors fixed (32+ → 0)
- **Performance Phase 4**: 47% smaller bundles, adaptive 3D rendering
- **Database Migration**: 100% database-driven (154+ components)
- **Bundle Optimization**: Code splitting, lazy loading, memory management

### **🔴 CRITICAL ISSUES BLOCKING DEVELOPMENT**
1. **Corner Logic System Deep Dive** - HIGHEST PRIORITY
   - Only 2/4 corners work for auto-rotation (top-left + bottom-right work)
   - Door positioning inconsistent across corner/elevation combinations
   - L-shaped boundary calculations broken
   - **IMPACT**: Corner components essential for kitchen design

2. **Component Boundary & Rotation System**
   - Rotation boundaries don't match visual components
   - Drag image vs 2D component size mismatch
   - Wide component wall snapping issues (left/right walls)

3. **3D Ceiling Height Control**
   - Works in elevation views but not 3D mode
   - React state/props not updating 3D components

### **🟡 MEDIUM PRIORITY**
- Left/right wall snapping has 1cm offset for wide components
- Some tall units edge cases in elevation view
- Initial component loading console error (harmless)

---

## 🏗️ **ARCHITECTURE OVERVIEW**

### **Tech Stack**
- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui
- **3D**: Three.js + React Three Fiber
- **Backend**: Supabase (PostgreSQL + Auth)
- **Mobile**: Custom touch handlers + responsive design

### **Key Components**
- **Designer.tsx**: Main designer layout with mobile detection
- **DesignCanvas2D.tsx**: Multi-view 2D canvas with touch support
- **CompactComponentSidebar.tsx**: Database-driven component library
- **MobileDesignerLayout.tsx**: Mobile-specific layout
- **AdaptiveView3D.tsx**: Performance-optimized 3D view

### **Database Schema**
- **components**: 154+ professional components with behaviors
- **projects**: Multi-room project containers
- **room_designs**: Individual room designs within projects
- **room_type_templates**: Room configuration templates

---

## 📱 **MOBILE SUPPORT IMPLEMENTATION**

### **Touch System**
- **useTouchEvents.ts**: Custom hook for touch event handling
- **useIsMobile.ts**: Mobile detection hook (768px breakpoint)
- **Touch Gestures**: Pinch-to-zoom, touch pan, long press selection
- **Click-to-Add**: Mobile components use click instead of drag-and-drop

### **Mobile Components**
- **MobileDesignerLayout**: Sheet panels, mobile toolbar
- **Touch-Optimized**: Larger touch targets, swipe gestures
- **Responsive**: Adaptive layout for all screen sizes

---

## 🗂️ **FILE STRUCTURE**

### **Critical Files**
```
src/
├── components/designer/
│   ├── Designer.tsx                 # Main layout with mobile detection
│   ├── DesignCanvas2D.tsx          # 2D canvas with touch support
│   ├── CompactComponentSidebar.tsx # Component library
│   ├── MobileDesignerLayout.tsx    # Mobile-specific layout
│   └── AdaptiveView3D.tsx          # 3D view with performance
├── hooks/
│   ├── useTouchEvents.ts           # Touch event handling
│   ├── useIsMobile.ts              # Mobile detection
│   └── useOptimizedComponents.ts   # Component loading
├── services/
│   ├── ComponentService.ts         # Database component access
│   └── CacheService.ts             # Intelligent caching
└── types/
    └── project.ts                  # TypeScript interfaces
```

### **Documentation Files**
- **README.md**: User-facing documentation
- **DEVELOPMENT-BACKLOG.md**: Detailed technical roadmap
- **TECHNICAL-DOCS.md**: Architecture documentation
- **NEW-CHAT-CONTEXT.md**: This file - essential context

---

## 🔧 **DEVELOPMENT PATTERNS**

### **Component Loading**
```typescript
// Use optimized hook for component loading
const { components, loading, error } = useOptimizedComponents(roomType);

// Database-driven components
interface DatabaseComponent {
  component_id: string;
  name: string;
  type: string;
  width: number;
  height: number;
  depth: number;
  // ... other properties
}
```

### **Mobile Detection**
```typescript
// Use mobile hook
const isMobile = useIsMobile();

// Conditional rendering
{isMobile ? (
  <MobileDesignerLayout {...props} />
) : (
  <DesktopLayout {...props} />
)}
```

### **Touch Events**
```typescript
// Touch event handling
const touchEventHandlers = useTouchEvents({
  onTouchStart: (point, event) => { /* handle touch */ },
  onPinchMove: (distance, scale, center) => { /* handle pinch */ },
  // ... other handlers
});
```

---

## 🚨 **COMMON PITFALLS & SOLUTIONS**

### **TypeScript Linting**
- **ALWAYS** run `npm run build` to check for linting errors
- Use underscore prefix for unused parameters: `_event: TouchEvent`
- Remove truly unused variables and functions
- Fix type mismatches (e.g., `component_id` vs `id`)

### **Mobile Development**
- Test on actual mobile devices, not just browser dev tools
- Touch events need `passive: false` for preventDefault
- Use `Sheet` components for mobile panels
- Implement click-to-add instead of drag-and-drop on mobile

### **Database Components**
- Use `DatabaseComponent` interface, not legacy `ComponentDefinition`
- Component behaviors cached in `ComponentService`
- Always handle loading states properly

---

## 📋 **IMMEDIATE NEXT STEPS**

### **If Starting New Work:**
1. Read DEVELOPMENT-BACKLOG.md for current priorities
2. Create safe branch: `git checkout -b feature/description-safe`
3. Focus on corner logic system if touching positioning code
4. Update backlog with progress

### **If Fixing Bugs:**
1. Identify if it's related to corner logic (probably is)
2. Check if it affects mobile vs desktop differently
3. Test in all 4 corners if positioning-related
4. Verify in both 2D and 3D views

### **If Adding Features:**
1. Check if core architecture issues block the feature
2. Implement mobile support from the start
3. Follow existing patterns (hooks, services, types)
4. Update documentation

---

## 🎯 **SUCCESS CRITERIA**

### **For Corner Logic Fix (Critical)**
- All 4 corners work identically for auto-rotation
- Door positioning consistent in all elevation views
- L-shaped boundaries match visual components
- Drag previews match actual placement

### **For Any New Feature**
- Works on both mobile and desktop
- No TypeScript linting errors
- Proper loading states and error handling
- Updated documentation

---

## 💡 **DEBUGGING TIPS**

### **Console Errors**
- "WALL UNITS CATEGORY MISSING" = harmless race condition
- Corner positioning errors = check all 4 corners
- Touch events not working = check passive event listeners

### **Mobile Issues**
- Use browser dev tools mobile simulation first
- Test on real devices for touch accuracy
- Check viewport meta tag for scaling issues

### **3D Performance**
- Use Performance Monitor component
- Check memory usage and FPS
- Adaptive quality settings auto-adjust

---

## 🔗 **ESSENTIAL LINKS**

- **Live App**: [Production URL]
- **Supabase**: Database and auth management
- **GitHub**: Repository with CI/CD pipeline
- **Documentation**: All .md files in root directory

---

*Created: September 16, 2025 - v2.5 Mobile Support & Clean Codebase*
*Next Major Goal: Phase 6 - Corner Logic System Overhaul*

**⚠️ REMEMBER: Never touch main branch without explicit user permission!**
