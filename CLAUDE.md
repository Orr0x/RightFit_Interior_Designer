# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RightFit Interior Designer is a professional-grade interior design application built with React, TypeScript, and Supabase. It provides multi-room project management with advanced 2D multi-view planning (plan view + 4 elevation views) and immersive 3D visualization using Three.js.

## Common Development Commands

### Development
```bash
npm run dev              # Start development server (Vite)
npm run build            # Build for production
npm run build:prod       # Build with production mode
npm run preview          # Preview production build
npm run clean            # Clean build artifacts
```

### Code Quality
```bash
npm run lint             # Run ESLint
npm run type-check       # TypeScript type checking (tsc --noEmit)
```

### Database Operations
```bash
# Link to Supabase project
npx supabase link --project-ref YOUR_PROJECT_REF

# Push migrations to production
npx supabase db push

# Reset database (development only)
npx supabase db reset

# Dump database schema
npx supabase db dump
```

### Testing
```bash
# Run tests (when test suite is set up)
npm test

# Run specific component tests
npm test -- ComponentName
```

## Architecture Overview

### Multi-Room Project System

The application uses a **two-tier project hierarchy**:

1. **Projects** - Top-level container (e.g., "My House Renovation")
2. **Room Designs** - Individual rooms within a project (e.g., "Kitchen", "Master Bedroom")

**Key Architectural Decisions:**
- One project can have multiple rooms (one of each room type)
- Each room maintains independent design state and elements
- Room types are constrained (only one "kitchen" per project, one "bathroom", etc.)
- All data is stored in Supabase PostgreSQL with Row Level Security (RLS)

**Database Schema:**
- `projects` table - Project metadata
- `room_designs` table - Room-specific designs with JSONB columns for `design_elements` and `design_settings`
- `room_type_templates` - Database-driven room templates (replaces hardcoded configs)
- `kitchen_components` and similar tables - Database-driven component library

### State Management

**Context-based Architecture:**
- `AuthContext` - User authentication state (Supabase Auth)
- `ProjectContext` - Project and room state management with auto-save
  - Manages current project and room
  - Handles CRUD operations for projects and rooms
  - Auto-save every 30 seconds when changes detected
  - Uses `useReducer` for predictable state updates

**Critical Implementation Detail:**
All `ProjectContext` functions are memoized with `useCallback` to prevent infinite render loops. The auto-save mechanism uses refs (`stateRef`, `saveCurrentDesignRef`) to avoid stale closures in intervals.

### 2D Canvas System

**Multi-View Rendering:**
- Plan view (top-down) - Shows all elements
- Elevation views (Front/Back/Left/Right) - Shows elements on specific walls

**Elevation View Duplication System:**
For complex room shapes (L-shaped, U-shaped), users can duplicate elevation views to show different wall segments:
- Default views: `front-default`, `back-default`, `left-default`, `right-default`
- Duplicated views: `front-dup1`, `back-dup1`, etc. (max 3 views per direction)
- Each view has a `hidden_elements` array for manual element curation
- Located in `design_settings.elevation_views` JSONB field

**Element Filtering Logic (Two-Stage):**
1. **Stage 1:** Cardinal direction filtering (existing logic in `DesignCanvas2D.tsx`)
   - Filters by wall assignment using `getElementWall()`
   - Includes corner unit visibility logic
2. **Stage 2:** Per-view hidden elements (new logic)
   - Checks `currentViewInfo.hiddenElements.includes(element.id)`
   - Only applied after direction filtering passes

**Important:** When working with elevation views, always use `currentViewInfo.direction` instead of `active2DView` for coordinate calculations. `active2DView` is a view ID (e.g., "front-dup1"), while `direction` is the cardinal direction ("front").

### 3D Rendering

**Technology Stack:**
- Three.js via `@react-three/fiber` and `@react-three/drei`
- Lazy-loaded via `Lazy3DView` component
- Database-driven 3D models from `3d_models` table

**Room Geometry System:**
- Simple rectangular rooms: Legacy system using `room_dimensions` (width, height)
- Complex rooms (L/U-shaped): Database-driven `room_geometry_templates`
- Conditional rendering in `AdaptiveView3D.tsx`: checks for `room_geometry` field
- Complex rendering uses `ComplexRoomGeometry` component with polygon vertices

**ComplexRoomGeometry Architecture:**
- **PolygonFloor:** ShapeGeometry for efficient polygon rendering (2-20 triangles vs 10-100+)
- **WallSegment:** Individual wall rendering with arbitrary angles
- **FlatCeiling:** Optional ceiling with same polygon as floor
- **Center offset calculation:** Centers room at origin (0,0,0) for proper camera positioning
- **Perimeter detection:** Bounding box edge detection (5cm tolerance) to classify interior vs perimeter walls

**First-Person Walk Mode:**
- Eye-level camera at 1.7m (170cm) height
- WASD movement controls with mouse look
- Pointer Lock API for FPS-style camera rotation
- Spawns at room center (0, 1.7, 0)
- OrbitControls automatically disabled during walk mode

**Performance Optimizations:**
- Adaptive quality settings based on device capabilities
- Automatic resource cleanup to prevent memory leaks
- Level-of-detail (LOD) system for complex scenes
- Performance monitoring available for `god` tier users
- Geometry caching with useMemo hooks

**Known Issues:**
- Room ceiling height control doesn't affect 3D view (needs implementation)
- Component boundaries don't always match visual representation
- Walk mode has no collision detection (can walk through walls)

### Component Library System

**Database-Driven Architecture:**
- 154+ professional components across 8 room types
- Components stored in `kitchen_components`, `bedroom_components`, etc.
- Each component has 2D definition (dimensions, category) and optional 3D model reference
- Component Manager UI at `/dev/components` for admin users

**Component Categories:**
- Kitchen: Base cabinets, wall units, appliances, finishing, drawers, larders
- Bedroom: Storage, furniture, props
- Bathroom: Fixtures, vanities, storage, props
- Living Room: Furniture, media units, built-ins, props
- Office: Furniture, storage, shelving, props
- Dressing Room: Storage, furniture, props
- Dining Room: Tables, chairs
- Utility: Appliances

**Z-Index Layering System:**
The 2D canvas uses a layering system defined in `getDefaultZIndex()`:
- 0.5: Walls (background)
- 1.0: Flooring
- 2.0: Base cabinets, appliances, tall units
- 3.0: Counter tops
- 3.5: Sinks
- 4.0: Wall cabinets, wall unit end panels
- 4.5: Pelmet
- 5.0: Cornice
- 6.0: Windows, doors

### Coordinate System

**Critical Implementation Note:**
The coordinate system is currently under review. Element positioning and wall detection need verification before finalizing elevation view work.

**Current System:**
- X-axis: Width (left-to-right)
- Y-axis: Depth (front-to-back) - called "height" in room dimensions for legacy compatibility
- Z-axis: Height (floor-to-ceiling)

**Element Properties:**
- `x`, `y`: Position in room
- `z`: Height off ground (optional)
- `width`: X-axis dimension
- `depth`: Y-axis dimension
- `height`: Z-axis dimension (vertical)
- Legacy: `verticalHeight` (deprecated, use `height` instead)

**Testing Utilities:**
- `testCurrentCoordinateSystem()` in `coordinateSystemDemo.ts`
- Accessible via God Mode toolbar button

## Key Files and Responsibilities

### Core Application Files
- `src/App.tsx` - Root component with routing
- `src/main.tsx` - Application entry point
- `src/pages/Designer.tsx` - Main designer interface (1000+ lines)
- `src/pages/UnifiedDashboard.tsx` - Project dashboard

### State Management
- `src/contexts/AuthContext.tsx` - Authentication context
- `src/contexts/ProjectContext.tsx` - Project/room state (980+ lines)

### 2D Canvas
- `src/components/designer/DesignCanvas2D.tsx` - Main 2D canvas component (117K+ characters)
- `src/components/designer/ViewSelector.tsx` - View switching UI with right-click context menu
- `src/components/designer/CompactComponentSidebar.tsx` - Component library sidebar

### 3D Visualization
- `src/components/designer/Lazy3DView.tsx` - Lazy-loaded 3D wrapper
- `src/components/designer/AdaptiveView3D.tsx` - Main 3D rendering component
- `src/components/designer/EnhancedModels3D.tsx` - 3D model rendering logic

### Properties and Tools
- `src/components/designer/PropertiesPanel.tsx` - Element properties editor
- `src/components/designer/DesignToolbar.tsx` - Toolbar controls
- `src/components/designer/ZoomController.tsx` - Zoom controls
- `src/components/designer/PerformanceMonitor.tsx` - Performance tracking (god mode)

### Services
- `src/services/ComponentService.ts` - Component data fetching and caching
- `src/integrations/supabase/client.ts` - Supabase client configuration

### Utilities
- `src/utils/elevationViewHelpers.ts` - Elevation view CRUD operations
- `src/utils/canvasCoordinateIntegration.ts` - Coordinate system utilities
- `src/utils/PositionCalculation.ts` - Element positioning logic
- `src/utils/GeometryBuilder.ts` - Room geometry generation
- `src/utils/GeometryValidator.ts` - Geometry validation
- `src/utils/ComponentIDMapper.ts` - Component ID mapping utilities
- `src/utils/FormulaEvaluator.ts` - Formula evaluation for dynamic dimensions
- `src/utils/migrateElements.ts` - Legacy element migration

### Type Definitions
- `src/types/project.ts` - Core TypeScript interfaces (400+ lines)
  - **Important:** `ROOM_TYPE_CONFIGS` was removed and replaced with database-driven templates
  - Use `RoomService` or `useRoomTemplate` hook instead of `getRoomTypeConfig()`

## Database Migrations

**Location:** `supabase/migrations/`

**Critical Migrations:**
- `20250908160000_create_multi_room_schema.sql` - Multi-room project schema
- `20250908160001_migrate_existing_designs.sql` - Data migration
- `20250908160002_add_new_room_types.sql` - Additional room types
- Component population migrations (20+ files for different room types)

**Migration Philosophy:**
- Always use database for configuration (no hardcoded data)
- JSONB columns for flexible schema evolution
- Row Level Security (RLS) on all user data tables
- Performance indexes on frequently queried columns

## Development Guidelines

### When Working with Elevation Views
1. Always use `currentViewInfo.direction` for coordinate calculations, not `active2DView`
2. Preserve existing cardinal direction filtering logic (don't make all components visible on all elevations)
3. Apply per-view hidden elements as a second filtering stage
4. Max 3 views per direction (prevents UI clutter)
5. Coordinate system must be verified before finalizing elevation view features

### When Working with Components
1. Never hardcode component data - always fetch from database via `ComponentService`
2. Use `ComponentService.preloadCommonBehaviors()` for performance
3. Respect the Z-index layering system defined in `getDefaultZIndex()`
4. Wall detection uses `getElementWall()` - ensure correct wall assignment

### When Working with State
1. Always memoize context functions with `useCallback` to prevent infinite loops
2. Use refs for interval/timeout closures to avoid stale state
3. Mark design as unsaved (`hasUnsavedChanges`) when elements change
4. Auto-save runs every 30 seconds when changes detected

### When Working with TypeScript
1. Use strict type checking - no `any` types without justification
2. Prefer interfaces over types for object shapes
3. Use type guards (`isValidRoomType`) for runtime validation
4. Legacy properties should be marked `@deprecated` with migration instructions

### Performance Considerations
1. Use React.memo, useMemo, useCallback for expensive operations
2. Lazy load 3D components to reduce initial bundle size
3. Implement loading states to prevent race conditions
4. Clean up Three.js resources in cleanup functions
5. Performance Monitor available for debugging (god mode only)

### Security Requirements
1. All user inputs must be validated and sanitized
2. Use Supabase RLS policies for data access control
3. Never expose sensitive data (API keys, tokens) in code
4. XSS prevention through safe DOM manipulation
5. Secure authentication via Supabase Auth

## Recent Development Sessions

### Session: 3D Component Migration (2025-01-09) ✅ COMPLETE
**Achievement:** 97% coverage (161/166 components visible in 3D)

**What was done:**
- Fixed ComponentIDMapper patterns (added 35 width-based patterns for multi-room furniture)
- Fixed AdaptiveView3D type routing (added 6 explicit cases for multi-room types)
- All 8 room types now functional in 3D view

**Key Files:**
- `src/utils/ComponentIDMapper.ts` - Pattern matching for component ID to 3D model mapping
- `src/components/designer/AdaptiveView3D.tsx` - Type routing for 3D rendering

**Documentation:** `docs/session-2025-01-09-3d-migration/`

### Session: 2D Database Migration (2025-10-09) ✅ COMPLETE
**Achievement:** 2D rendering now database-driven (Phase 1-3 complete)

**What was done:**
- Created `component_2d_renders` table with render type metadata
- Implemented Render2DService with caching
- Refactored DesignCanvas2D.tsx to use metadata instead of hardcoded logic
- Phase 5 (legacy code removal) pending

**Key Files:**
- `src/services/Render2DService.ts` - Database-driven 2D render metadata
- `src/components/designer/DesignCanvas2D.tsx` - Hybrid rendering system

**Documentation:** `docs/session-2025-10-09-2d-database-migration/`

### Critical Fix: Infinite Render Loop (2025-10-10) ✅ COMPLETE
**Achievement:** Fixed "Maximum update depth exceeded" error that completely blocked the application

**Problem:**
- Error occurred when opening any project in Designer.tsx
- Infinite re-render loop prevented application from loading
- 30+ repeated errors in console logs

**Root Cause:**
- Functions in `ProjectContext.tsx` were not memoized with `useCallback`
- When used in `useEffect` dependency arrays, they caused infinite re-renders
- Each render created new function references, triggering effects again

**Solution:**
- Wrapped 9 context functions in `useCallback` with proper dependencies:
  - `loadProject` (critical fix)
  - `createProject`, `updateProject`, `deleteProject`
  - `createRoomDesign`, `switchToRoom`, `updateCurrentRoomDesign`, `deleteRoomDesign`
  - `loadUserProjects`

**Verification:**
- Zero "Maximum update depth exceeded" errors across all tests
- 3,349 console log entries captured with no infinite loops
- Projects now open successfully
- Extended testing (4+ minutes) shows no performance degradation

**Key Lesson:** Always memoize context functions that will be used in dependency arrays. This is critical for avoiding infinite render loops in React.

**Documentation:** `docs/test-results/2025-10-10-database-integration/TEST_RESULTS_COMPLETED.md`

### Session: Complex Room Shapes (2025-10-10) ✅ PHASES 1-5 COMPLETE
**Achievement:** L-shaped and U-shaped rooms with manual wall controls and walk mode

**What was done:**
- Phase 1-2: Database schema for `room_geometry_templates` + TypeScript interfaces
- Phase 3: ComplexRoomGeometry component with polygon floor/wall rendering
- Phase 4: ❌ NOT STARTED (2D rendering for complex shapes)
- Phase 5: Manual wall visibility controls + first-person walk mode (WASD controls)

**Key Features:**
- RoomShapeSelector for choosing room templates (rectangular, L-shaped, U-shaped)
- ComplexRoomGeometry using ShapeGeometry for efficient polygon rendering
- Manual N/S/E/W wall toggles with interior wall detection
- First-person walk mode at eye level (1.7m) with mouse look

**Critical Fixes:**
- Floor/ceiling double-centering offset resolved
- Walk mode movement direction corrected
- Perimeter vs interior wall detection (5cm tolerance)

**Known Limitation:**
- 2D canvas still assumes rectangular rooms (Phase 4 needed for element placement in complex shapes)

**Key Files:**
- `src/components/3d/ComplexRoomGeometry.tsx` - Complex room rendering (321 lines)
- `src/components/designer/RoomShapeSelector.tsx` - Shape selection UI
- `src/components/designer/AdaptiveView3D.tsx` - Walk mode + wall controls
- `src/utils/GeometryValidator.ts` - Geometry validation (15 methods)
- `src/services/RoomService.ts` - Geometry template loading

**Documentation:** `docs/session-2025-10-10-complex-room-shapes/`

### Session: Elevation View Duplication (2025-10-12) ⚠️ INCOMPLETE
**Status:** Implementation complete but coordinate system verification needed

**What was done:**
- Created elevation view duplication system for complex rooms (H-shaped support)
- Implemented `elevationViewHelpers.ts` with CRUD operations
- Added two-stage filtering (cardinal direction + per-view hidden elements)
- Modified ViewSelector with right-click context menu

**Key Principle:**
- Max 3 views per direction (12 total views for H-shaped rooms)
- User-driven element curation per view (no algorithmic determination)
- Preserves existing cardinal direction filtering

**Blocking Issue:**
- Coordinate system needs verification before finalizing
- Element positioning and wall detection must be validated

**Key Files:**
- `src/utils/elevationViewHelpers.ts` - Elevation view CRUD (285 lines)
- `src/components/designer/ViewSelector.tsx` - Right-click context menu
- `src/components/designer/DesignCanvas2D.tsx` - Two-stage filtering logic

**Documentation:** `docs/session-2025-10-10-complex-room-shapes/ELEVATION_VIEW_DUPLICATION_IMPLEMENTATION.md`

## Known Issues and Limitations

### Current Bugs
1. **Component Boundaries** - Rotation boundaries don't match visual components
2. **Wide Component Positioning** - Left/right wall snapping has 1cm offset
3. **3D Ceiling Height** - Room height control doesn't affect 3D view
4. **User Account Activation** - New accounts may take 2-3 minutes to activate (Supabase RLS propagation delay)

### Work In Progress
1. **Coordinate System Verification** - Element positioning needs review before finalizing elevation views (BLOCKING)
2. **Element Visibility Toggle UI** - No UI yet for hiding elements in specific elevation views
3. **Visual Indicators** - Elements don't show which views they're hidden in
4. **Phase 4 Complex Rooms** - 2D canvas doesn't support L/U-shaped room element placement yet

### Technical Debt
1. **Legacy Dimension Properties** - `verticalHeight` still used in some places (use `height` instead)
2. **Mixed Coordinate Systems** - Some code uses Y for depth, some for height (being standardized)
3. **Component Type Inference** - Wall cabinets vs base cabinets detected by ID string matching (should use type field)
4. **Legacy 2D Code Removal** - Phase 5 of 2D database migration not completed (legacy code still present)

## Development Utilities

### Console Logger (Development Mode)
**Purpose:** Automated browser console log capture for testing and debugging

**Features:**
- Continuous log capture during testing sessions (up to 5,000 entries)
- Memory-safe with auto-rotation
- Auto-backup to localStorage
- One-click download with timestamped filenames
- Professional log formatting with icons
- No manual intervention needed

**Location:** Available in development mode only (not production)

**Usage:**
- Logger widget appears in bottom-right corner
- Click to download logs: `browser-console-logs-YYYY-MM-DD.txt`
- Captures all console methods (log, error, warn, info, debug)
- Time saved: ~15 minutes per testing session (eliminates manual screenshots)

**Key Benefit:** Provides comprehensive diagnostic data for debugging complex issues like the infinite render loop that was fixed in October 2025.

**Documentation:** `docs/browser console logs/console-log-automation-guide.md`

### God Mode (Development Utilities)
**Access:** Available for developers at `/dev` routes

**Features:**
- Performance monitoring (real-time FPS and memory tracking)
- Component manager interface
- Coordinate system testing utilities
- Database query tools

**Important:** God mode utilities are development-only and should not be exposed in production.

## Testing Guidelines

### Current Testing Status
- No formal test suite yet (@playwright/test installed but not configured)
- Manual testing via console logging and Performance Monitor
- God Mode utilities for testing coordinate systems
- Console logger for automated diagnostic data capture

### Planned Testing Strategy
1. Unit tests for utility functions (coordinate calculations, geometry validation)
2. Integration tests for database operations
3. Component tests for UI elements
4. End-to-end tests for critical user workflows
5. Performance tests for 3D rendering

### Testing Utilities
- `testCurrentCoordinateSystem()` - Coordinate system validation
- Performance Monitor - Real-time FPS and memory tracking
- Console Logger - Automated browser console log capture (development mode)
- God Mode - Developer tools accessible at `/dev`

## Environment Setup

### Required Environment Variables
Create `.env.local` (not tracked in git):
```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id
```

### Supabase Setup
1. Create a Supabase project
2. Link local project: `npx supabase link --project-ref YOUR_PROJECT_REF`
3. Push migrations: `npx supabase db push`
4. Configure authentication providers in Supabase dashboard

### Development Workflow
1. Start dev server: `npm run dev`
2. Access at `http://localhost:5173`
3. Login with test account or create new account (wait 2-3 minutes for activation)
4. Create project → Add room → Start designing

## Git Workflow

### Current Branch Structure
```
main
  └─ feature/complex-room-shapes
       └─ feature/elevation-simplified (CURRENT)
            └─ feature/coordinate-system-setup (TO BE CREATED)
```

### Commit Message Conventions
- `feat:` - New features
- `fix:` - Bug fixes
- `refactor:` - Code refactoring
- `docs:` - Documentation changes
- `perf:` - Performance improvements
- `test:` - Test additions/changes
- `chore:` - Build/tooling changes

### Important Notes
1. Always run `npm run type-check` before committing
2. Use descriptive commit messages with scope (e.g., `feat(elevation): Add view duplication`)
3. Document breaking changes in commit body
4. Reference issue numbers when applicable

## Deployment

### Production Build
```bash
npm run build:prod
```

### Deployment Targets
- Static hosting (Vercel, Netlify recommended)
- Configure environment variables in hosting platform
- Enable HTTPS (required for Supabase)
- Set up CDN for asset delivery

## Additional Resources

### Documentation
- `docs/session-2025-01-09-3d-migration/` - 3D migration session notes
- `docs/session-2025-10-09-2d-database-migration/` - 2D database migration documentation
- `docs/session-2025-10-10-complex-room-shapes/` - Complex room shapes implementation
- `REQUIREMENTS.md` - Detailed technical requirements

### External Documentation
- [Supabase Documentation](https://supabase.com/docs)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

**Last Updated:** 2025-10-17
**Project Version:** v2.7
**Node Version:** 18.0.0+
