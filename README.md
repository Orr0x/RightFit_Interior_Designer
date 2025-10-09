# RightFit Interior Designer

A professional-grade interior design application built with React, TypeScript, and Supabase. Create, edit, and visualize interior layouts with advanced 2D multi-view planning and immersive 3D visualization.

## 🎯 **CURRENT STATUS: v2.6 - Farrow & Ball Integration Complete**
- 🎉 **NEW: Farrow & Ball Gallery**: 301 authentic colors with professional product images
- ✅ **Database-Driven Colors**: Complete migration from CSV to Supabase with 100% coverage
- ✅ **Individual Color Pages**: Themed product pages with color-specific backgrounds
- ✅ **Mobile/Touch Support**: Complete responsive design with touch gestures
- ✅ **Performance Optimized**: Phase 4 complete with 47% smaller bundles
- ✅ **Database-Driven**:  database-driven component system 
- ⚠️ **Architecture Issues**: Core positioning system needs overhaul 
## ✨ Features

### 🏗️ Multi-Room Project System
- **Project Management**: Create and manage multiple interior design projects
- **Room Switching**: Seamlessly switch between different room types within a project
- **Independent Designs**: Each room maintains its own design state and elements
- **Cloud Storage**: Auto-save and sync designs across devices

### 🎨 Advanced Design Tools
- **Multi-View 2D Planning**: Plan view, Front view, Back view, Left view, Right view
- **Professional 3D Visualization**: Real-time 3D rendering with Three.js
- **Smart Component Placement**: Drag-and-drop with snap-to-grid functionality
- **Precision Measurement**: Built-in ruler tools with real-time dimensions
- **Grid System**: Snap-to-grid functionality for accurate alignment

### 🎨 Farrow & Ball Color Gallery
- **Complete Collection**: All 301 authentic Farrow & Ball colors with official product images
- **Professional Images**: Thumbnail and hover images from Farrow & Ball's official catalog
- **All Color Series**: Numeric (1-300+), Historic (W), Garden (G), Cookbook (CB), Color Consultant (CC)
- **Individual Pages**: Dedicated product pages with color-specific themed backgrounds
- **Database Integration**: Fully migrated from CSV to Supabase with 100% coverage
- **Smart Fallbacks**: Elegant color swatches for any missing images
- **Performance Optimized**: Lazy loading with intersection observer for smooth scrolling

### 🎛️ Professional Interface
- **Comprehensive Component Library**: 154+ components across 8 room types
- **Database-Driven Components**: Scalable component system with versioning
- **Component Manager**: Professional UI for managing component library (DevTools)
- **Enhanced Drag & Drop**: Precision component placement with visual feedback
- **Smart Selection**: Click-to-select without accidental movement
- **Accurate Drag Previews**: Drag previews match final component size exactly
- **Custom Carpentry Solutions**: Specialized storage and cabinetry components
- **Organized Categories**: Multiple tabs per room type (Furniture, Storage, Props, etc.)
- **Keyboard Shortcuts**: Professional hotkeys (Ctrl+Z, Ctrl+Y, Ctrl+S, etc.)
- **Performance Monitoring**: Real-time FPS and memory usage tracking

### 📱 **Mobile/Touch Support (v2.5)**
- **Responsive Design**: Adaptive layout for mobile and desktop
- **Touch Gestures**: Pinch-to-zoom, touch pan, long press selection
- **Mobile-First UX**: Click-to-add components (no drag-and-drop on mobile) - remove mobile layout but keep touch for tablet and touch screen monitors
- **Touch-Optimized UI**: Sheet panels, larger touch targets, mobile toolbar
- **Cross-Device Sync**: Seamless experience across devices

### ⚡ Performance Optimizations (v2.4)
- **Instant Login**: Projects load immediately after authentication (no refresh required)
- **Optimized Loading**: Eliminated false error popups during app startup
- **Smart Component Loading**: Proper loading states prevent race conditions
- **Database-Driven**: 100% database-driven component system for scalability
- **Bundle Optimization**: 47% smaller initial load with code splitting
- **Memory Management**: Automatic Three.js resource cleanup
- **Adaptive 3D Rendering**: Device-aware quality settings

### 🔐 Security & Performance
- **Secure Authentication**: Supabase-powered user management
- **XSS Protection**: Comprehensive input validation and sanitization
- **Row Level Security**: Database-level access control
- **Optimized Rendering**: 60 FPS canvas performance with memory management

## 🚀 Quick Start

### Prerequisites
- Node.js 18.0.0 or higher
- Supabase account

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd plan-view-kitchen-3d

# Install dependencies
npm install

# Configure Supabase
# Edit src/integrations/supabase/client.ts with your project credentials

# Start development server
npm run dev
```

### Supabase Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Copy your Project URL and Anon Key from Settings → API
3. Update `src/integrations/supabase/client.ts`:

```typescript
const SUPABASE_URL = "your-project-url-here";
const SUPABASE_PUBLISHABLE_KEY = "your-anon-key-here";
```

4. Run the database migrations using Supabase CLI:
   ```bash
   # Link to your Supabase project
   npx supabase link --project-ref YOUR_PROJECT_REF
   
   # Push all migrations to production
   npx supabase db push
   ```
   
   **Migration Files Applied:**
   - `20250908160000_create_multi_room_schema.sql` - Phase 1: Multi-room schema
   - `20250908160001_migrate_existing_designs.sql` - Data migration
   - `20250908160002_add_new_room_types.sql` - Additional room types

## 🎮 Using the Designer

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Y` | Redo |
| `Ctrl/Cmd + C` | Copy selected element |
| `Ctrl/Cmd + S` | Save design |
| `Delete/Backspace` | Delete selected element |
| `F` | Fit to screen |
| `G` | Toggle grid |
| `R` | Toggle ruler |
| `V` or `S` | Select tool |
| `H` or `Space` | Pan tool |
| `Escape` | Clear selection |

### Design Workflow
1. **Create Project**: Start a new project from the dashboard
2. **Add Rooms**: Add different room types to your project
3. **Design in 2D**: Use plan view for layout, elevation views for heights
4. **Preview in 3D**: Switch to 3D view for immersive visualization
5. **Save & Share**: Auto-save ensures your work is never lost

## 🏠 Component Library

### 🎯 Database-Driven Component Library
- **154+ Professional Components** across 8 room types
- **Scalable Architecture** supporting thousands of components
- **Version Control** with deprecation management
- **Metadata Support** for future extensibility (materials, pricing, etc.)

### 🛠️ Component Manager (DevTools)
Access the Component Manager at `/dev/components` with DEV+ tier access:
- **Browse & Search**: Filter components by category, room type, or search terms
- **Create & Edit**: Add new components or modify existing ones
- **Version Management**: Handle component updates and deprecation
- **Professional UI**: Responsive design with comprehensive CRUD operations

### Room Types & Components

#### 🍳 **Kitchen** (47 components) - ✅ Complete
- **Base Cabinets**: 5 sizes (30cm-80cm) + corner solutions  
- **Base Drawers**: 3 pan drawer units (50cm, 60cm, 80cm)
- **Wall Units**: 5 sizes (30cm-80cm) + corner wall cabinets
- **Appliances**: 6 built-in and freestanding appliances
- **Kitchen Larder**: 7 tall storage solutions (200cm-244cm height)
- **Finishing**: 21 professional pieces (cornice, pelmet, toe-kick, end panels)

#### 🛏️ **Bedroom** (46 components) - ✅ Complete
- **Bedroom Storage**: 14 custom storage solutions (wardrobes, drawers, floating units)
- **Bedroom Furniture**: 10 bed types, seating, reading chairs  
- **Bedroom Props**: 4 accessories (lamps, mirrors, rugs, curtains)
- **Universal Items**: 18 (counter tops, end panels, doors, windows, flooring)

#### 🛁 **Bathroom** (21 components) - ✅ Complete
- **Bathroom Fixtures**: 8 sanitaryware (toilets, bidets, baths, showers)
- **Bathroom Vanities**: 6 vanity units (40cm-120cm) + basin options
- **Bathroom Storage**: 4 bathroom storage solutions
- **Bathroom Props**: 3 accessories (mirrors, towel rails, etc.)

#### 🛋️ **Living Room** (20 components) - ✅ Complete
- **Living Room Furniture**: 6 seating options (sofas, chairs, ottomans)
- **Media Furniture**: 2 entertainment units and TV stands
- **Built-ins & Shelving**: 6 living room storage solutions  
- **Living Room Props**: 2 decorative elements
- **Universal Items**: 4 (counter tops, flooring, etc.)

#### 💼 **Office** (12 components) - ✅ Complete
- **Office Furniture**: 6 desks, chairs, and office furniture
- **Office Storage**: 2 filing and organization solutions
- **Office Shelving**: 2 display and book storage
- **Office Props**: 2 office accessories

#### 👗 **Dressing Room** (8 components) - ✅ Complete
- **Dressing Storage**: 4 walk-in wardrobe systems and islands
- **Dressing Furniture**: 2 specialized furniture pieces
- **Dressing Props**: 2 accessories

#### 🍽️ **Dining Room** (3 components) - ✅ Complete
- **Dining Furniture**: Tables, chairs, and seating options

#### 🧺 **Utility Room** (3 components) - ✅ Complete  
- **Utility Appliances**: 3 laundry and utility appliances

#### 🏠 **Universal Components** (Available in all rooms)
- **Counter Tops**: 4 (horizontal, vertical, square, corner)
- **End Panels**: 2 (base and full height)
- **Doors & Windows**: 4 architectural elements
- **Flooring**: 7 materials and finishes

### 📊 **Total: 154 Professional Components**

### Custom Carpentry Solutions
The component library showcases **Right Fit Interiors'** carpentry expertise with:
- **Custom Storage Solutions**: Built-in wardrobes, entertainment units, storage systems
- **Specialized Cabinetry**: Corner units, floating units, modular systems
- **Professional Finishes**: Multiple wood tones and finishes
- **Space Optimization**: L-shaped units, corner solutions, multi-functional designs

## 🏗️ Project Structure

```
src/
├── components/
│   ├── ui/                    # shadcn/ui components
│   └── designer/              # Design-specific components
│       ├── DesignCanvas2D.tsx # Multi-view 2D canvas
│       ├── View3D.tsx         # 3D visualization
│       ├── RoomTabs.tsx       # Room switching interface
│       ├── ProjectDashboard.tsx # Project management
│       └── ComponentLibrary.tsx # Component catalog
├── contexts/
│   ├── AuthContext.tsx        # Authentication state
│   └── ProjectContext.tsx     # Project and room state
├── hooks/
│   ├── useKeyboardShortcuts.ts # Keyboard shortcuts
│   └── useDesignValidation.ts  # Design validation
├── pages/
│   ├── Designer.tsx           # Main designer interface
│   └── UnifiedDashboard.tsx   # Project dashboard
└── types/
    └── project.ts             # TypeScript interfaces
```

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **3D Rendering**: Three.js + React Three Fiber
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **State Management**: React Context + Hooks
- **Package Manager**: npm

## 📋 Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## 🚀 Deployment

### Using GitHub Actions (Recommended)
1. Set GitHub Secrets: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SUPABASE_PROJECT_ID`
2. Push to main branch - automatic deployment via CI/CD

### Using Vercel/Netlify
1. Build the project: `npm run build`
2. Deploy the `dist` folder to your hosting platform
3. Configure environment variables for Supabase

### Manual Deployment
```bash
# Build for production
npm run build

# Preview build locally
npm run preview
```

## ⚠️ Known Issues & Current State

### ⚠️ Architecture Issues 
- **Component Boundaries**: Rotation boundaries don't match visual components
- **Wide Component Positioning**: Left/right wall snapping has 1cm offset
- **3D Ceiling Height**: Room height control doesn't affect 3D view

### 🟡 User Account Activation
- **Issue**: New user accounts may experience slow activation (2-3 minutes)
- **Symptoms**: Login errors, "user not found" messages, RLS policy violations
- **Resolution**: Wait 2-3 minutes after account creation before attempting to log in
- **Root Cause**: Supabase user creation and RLS policy propagation takes time
- **Workaround**: Show loading state or retry mechanism for new users

### ✅ Recently Fixed (v2.5)
- **All TypeScript Linting Errors**: Cleaned up 32+ warnings/errors to zero
- **Mobile Support**: Complete responsive design with touch gestures


## 🐛 Troubleshooting

### Common Issues

**Application won't load:**
- Check Supabase credentials in `client.ts`
- Verify database migrations are deployed
- Clear browser cache and refresh

**New user login issues:**
- Wait 2-3 minutes after account creation
- Check browser console for RLS policy errors
- Verify user exists in Supabase Auth dashboard

**Performance issues:**
- Enable hardware acceleration in browser
- Reduce number of 3D elements
- Check Performance Monitor for warnings

**Design not saving:**
- Verify user authentication
- Check browser console for errors
- Ensure Supabase RLS policies are configured

## 📄 License

MIT License - see LICENSE file for details.

---

