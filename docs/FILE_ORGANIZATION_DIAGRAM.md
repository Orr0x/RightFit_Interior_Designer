# File Organization Diagram

## 📊 **Visual File Structure**

```
📁 plan-view-kitchen-3d/
│
├── 🎯 MAIN APP (User-Facing)
│   ├── 📁 src/
│   │   ├── 📄 App.tsx                    # Main app router
│   │   ├── 📄 main.tsx                   # Entry point
│   │   │
│   │   ├── 📁 pages/                     # User pages
│   │   │   ├── 📄 Designer.tsx          # 🎨 Main designer
│   │   │   ├── 📄 EggerBoards.tsx       # 🏠 EGGER products
│   │   │   ├── 📄 FarrowBallFinishes.tsx # 🎨 Farrow & Ball
│   │   │   ├── 📄 HomePage.tsx          # 🏠 Landing page
│   │   │   ├── 📄 LoginPage.tsx         # 🔐 Authentication
│   │   │   └── 📄 [other user pages...]
│   │   │
│   │   ├── 📁 components/
│   │   │   ├── 📁 designer/             # Designer components
│   │   │   │   ├── 📄 CompactComponentSidebar.tsx # 🎯 Main component selector
│   │   │   │   ├── 📄 DesignCanvas2D.tsx          # 🎨 2D canvas
│   │   │   │   ├── 📄 Lazy3DView.tsx              # 🎨 3D view
│   │   │   │   ├── 📄 PropertiesPanel.tsx         # ⚙️ Properties
│   │   │   │   └── 📄 [other designer components...]
│   │   │   │
│   │   │   ├── 📁 ui/                   # Reusable UI
│   │   │   │   ├── 📄 button.tsx        # 🔘 Button
│   │   │   │   ├── 📄 card.tsx          # 🃏 Card
│   │   │   │   └── 📄 [other UI components...]
│   │   │   │
│   │   │   └── 📁 [other user components...]
│   │   │
│   │   ├── 📁 hooks/                     # Main app hooks
│   │   │   ├── 📄 useOptimizedComponents.ts # 🚀 Component loading
│   │   │   ├── 📄 useAuth.ts            # 🔐 Authentication
│   │   │   ├── 📄 useProject.ts         # 📁 Project management
│   │   │   └── 📄 [other main app hooks...]
│   │   │
│   │   ├── 📁 services/                  # Business logic
│   │   │   ├── 📄 ComponentService.ts   # 🧩 Component logic
│   │   │   ├── 📄 CacheService.ts       # 💾 Caching
│   │   │   └── 📄 [other services...]
│   │   │
│   │   └── 📁 [other main app folders...]
│   │
│   └── 📁 public/                        # Static assets
│       ├── 📄 Boards.csv                # 🏠 EGGER data
│       ├── 📄 colours.csv               # 🎨 Color data
│       └── 📄 [other public files...]
│
├── 🔧 DEV/ADMIN TOOLS (Developer Only)
│   ├── 📁 src/pages/
│   │   ├── 📄 ComponentManagerPage.tsx  # 🔧 Admin: Component management
│   │   └── 📄 DevTools.tsx              # 🔧 Admin: Developer tools
│   │
│   ├── 📁 src/components/
│   │   ├── 📄 ComponentManager.tsx      # 🔧 Admin: Component CRUD
│   │   ├── 📄 ComponentForm.tsx         # 🔧 Admin: Component form
│   │   └── 📄 ProtectedRoute.tsx        # 🔒 Route protection
│   │
│   └── 📁 src/hooks/
│       └── 📄 useComponents.ts          # 🔧 Admin: Component management
│
├── 📦 ARCHIVED FILES (Moved to docs/)
│   ├── 📁 docs/src-components-legacy/
│   │   └── 📄 ComponentSelector.tsx     # 📦 Legacy component selector
│   │
│   ├── 📁 docs/src-assets/              # 📦 Unused assets
│   ├── 📁 docs/src-scripts/             # 📦 Unused scripts
│   ├── 📁 docs/scripts-active/          # 📦 Database scripts
│   ├── 📁 docs/tests/                   # 📦 Test files
│   └── 📁 docs/database/migrations-archive/ # 📦 Old migrations
│
└── 📁 docs/                             # Documentation
    ├── 📄 FILE_ORGANIZATION.md          # 📖 This guide
    ├── 📄 FILE_ORGANIZATION_DIAGRAM.md  # 📊 This diagram
    └── 📁 [other documentation...]
```

## 🎯 **Access Levels**

### **🟢 Main App (All Users)**
- **Access**: Public/authenticated users
- **Purpose**: Core application functionality
- **Files**: Most of `src/` excluding admin tools
- **Routes**: `/`, `/designer`, `/egger-boards`, etc.

### **🔒 Dev/Admin Tools (DEV Tier Required)**
- **Access**: DEV tier or higher only
- **Purpose**: Administrative functionality
- **Files**: Admin-specific components and pages
- **Routes**: `/dev/components`, `/dev/tools`

### **📦 Archived Files (Reference Only)**
- **Access**: Documentation/development reference
- **Purpose**: Legacy code and unused files
- **Files**: Moved to `docs/` folder
- **Status**: Not part of active application

## 🔄 **File Flow**

```
User Request → Main App Files → User Interface
     ↓
Admin Request → Dev/Admin Tools → Admin Interface
     ↓
Legacy Reference → Archived Files → Documentation
```

## 🚀 **Development Guidelines**

1. **Main App Development**: Work in `src/` (excluding admin tools)
2. **Admin Features**: Add to admin-specific files (DEV tier required)
3. **Legacy Code**: Archive in `docs/` when no longer needed
4. **Database Scripts**: Use `docs/scripts-active/` for maintenance

This organization ensures clear separation between user-facing functionality and administrative tools while keeping legacy code accessible for reference.
