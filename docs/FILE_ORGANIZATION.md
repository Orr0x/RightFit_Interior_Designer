# File Organization Guide

This document clearly separates files between **Main App** (user-facing) and **Dev/Admin Tools** (developer/admin only).

## 🎯 **Main App Files (User-Facing)**

### **Core Application Structure**
```
src/
├── App.tsx                    # Main app router and layout
├── main.tsx                   # App entry point
├── index.css                  # Global styles
├── vite-env.d.ts             # TypeScript definitions
│
├── pages/                     # Main app pages (user-facing)
│   ├── Designer.tsx          # Main designer interface
│   ├── EggerBoards.tsx       # EGGER product browser
│   ├── FarrowBallFinishes.tsx # Farrow & Ball finishes
│   ├── HomePage.tsx          # Landing page
│   ├── LoginPage.tsx         # User authentication
│   ├── RegisterPage.tsx      # User registration
│   ├── ProfilePage.tsx       # User profile
│   ├── BlogPage.tsx          # Blog system
│   ├── BlogPostPage.tsx      # Individual blog posts
│   └── [other user pages...]
│
├── components/                # Main app components
│   ├── designer/             # Designer interface components
│   │   ├── CompactComponentSidebar.tsx  # Main component selector
│   │   ├── DesignCanvas2D.tsx          # 2D design canvas
│   │   ├── Lazy3DView.tsx              # 3D view
│   │   ├── PropertiesPanel.tsx         # Element properties
│   │   ├── ViewSelector.tsx            # View mode selector
│   │   ├── ZoomController.tsx          # Zoom controls
│   │   ├── DesignToolbar.tsx           # Design tools
│   │   ├── RoomTabs.tsx                # Room management
│   │   ├── MobileDesignerLayout.tsx    # Mobile layout
│   │   └── [other designer components...]
│   │
│   ├── ui/                   # Reusable UI components
│   │   ├── button.tsx        # Button component
│   │   ├── card.tsx          # Card component
│   │   ├── input.tsx         # Input component
│   │   ├── [other UI components...]
│   │
│   ├── auth/                 # Authentication components
│   ├── blog/                 # Blog system components
│   └── [other user-facing components...]
│
├── hooks/                     # Main app hooks
│   ├── useOptimizedComponents.ts  # Component loading (main app)
│   ├── useAuth.ts            # Authentication
│   ├── useProject.ts         # Project management
│   ├── useDesignValidation.ts # Design validation
│   ├── useKeyboardShortcuts.ts # Keyboard shortcuts
│   ├── use-mobile.ts         # Mobile detection
│   └── [other main app hooks...]
│
├── services/                  # Main app services
│   ├── ComponentService.ts   # Component business logic
│   ├── CacheService.ts       # Caching system
│   ├── MemoryManager.ts      # Memory management
│   ├── PerformanceDetector.ts # Performance monitoring
│   ├── QueryOptimizer.ts     # Query optimization
│   ├── RoomService.ts        # Room management
│   ├── EggerDataService.ts   # EGGER data
│   ├── FarrowBallDataService.ts # Farrow & Ball data
│   └── CoordinateTransformEngine.ts # Coordinate system
│
├── contexts/                  # React contexts
│   ├── AuthContext.tsx       # Authentication context
│   └── ProjectContext.tsx    # Project context
│
├── types/                     # TypeScript types
│   ├── project.ts            # Project-related types
│   └── user-tiers.ts         # User tier types
│
├── utils/                     # Utility functions
│   ├── migrateElements.ts    # Element migration
│   ├── godMode.ts            # Development utilities
│   ├── coordinateSystemDemo.ts # Coordinate demo
│   ├── coloursData.ts        # Color data
│   ├── webpImagesData.ts     # Image data
│   └── eggerBoardsData.ts    # EGGER data
│
└── integrations/              # External integrations
    └── supabase/
        ├── client.ts         # Supabase client
        └── types.ts          # Database types
```

## 🔧 **Dev/Admin Tools (Developer/Admin Only)**

### **Admin Interface Files**
```
src/
├── pages/
│   ├── ComponentManagerPage.tsx  # Admin: Component management page
│   ├── DevTools.tsx              # Admin: Developer tools page
│   └── [other admin pages...]
│
├── components/
│   ├── ComponentManager.tsx      # Admin: Component CRUD interface
│   ├── ComponentForm.tsx         # Admin: Component creation/editing form
│   ├── ProtectedRoute.tsx        # Admin: Route protection
│   └── [other admin components...]
│
└── hooks/
    └── useComponents.ts          # Admin: Component management hook
```

### **Admin Routes (DEV tier required)**
- `/dev/components` - Component management interface
- `/dev/tools` - Developer tools and utilities

### **User Tier Requirements**
- **ComponentManager**: Requires DEV tier or higher
- **DevTools**: Requires DEV tier or higher
- **ComponentForm**: Used by ComponentManager (DEV tier)
- **useComponents**: Used by admin tools (DEV tier)

## 📁 **Archived Files (Moved to docs/)**

### **Legacy Components**
```
docs/src-components-legacy/
└── ComponentSelector.tsx         # Legacy component selector (unused)
```

### **Other Archived Files**
```
docs/
├── src-assets/                   # Unused assets
├── src-scripts/                  # Unused scripts
├── tests/                        # Test files
├── scripts-active/               # Database management scripts
├── database/migrations-archive/  # Old database migrations
└── [other archived files...]
```

## 🎯 **Key Differences**

### **Main App Files:**
- ✅ Used by all users
- ✅ Core application functionality
- ✅ User-facing interfaces
- ✅ Production-ready code

### **Dev/Admin Tools:**
- 🔒 Requires DEV tier access or higher
- 🔧 Administrative functionality
- 🔧 Component library management
- 🔧 Developer utilities

### **Archived Files:**
- 📦 Legacy/unused code
- 📦 Development artifacts
- 📦 Test files
- 📦 Old migrations

## 🚀 **Development Workflow**

1. **Main App Development**: Work in `src/` (excluding admin tools)
2. **Admin Tools**: Work in admin-specific files (DEV tier required)
3. **Legacy Code**: Archived in `docs/` for reference
4. **Database Scripts**: Use `docs/scripts-active/` for maintenance

This organization ensures clear separation between user-facing functionality and administrative tools while keeping legacy code accessible for reference.
