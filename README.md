# RightFit Interior Designer

A professional-grade interior design application built with React, TypeScript, and Supabase. Create, edit, and visualize interior layouts with advanced 2D multi-view planning and immersive 3D visualization.

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

### 🎛️ Professional Interface
- **Component Library**: 100+ components across 7 room types
- **Keyboard Shortcuts**: Professional hotkeys (Ctrl+Z, Ctrl+Y, Ctrl+S, etc.)
- **Performance Monitoring**: Real-time FPS and memory usage tracking
- **Error Handling**: Graceful error recovery with user feedback
- **Responsive Design**: Collapsible panels and mobile-friendly interface

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

4. Run the database migrations in Supabase SQL Editor:
   - `supabase/migrations/20250908160000_create_multi_room_schema.sql`
   - `supabase/migrations/20250908160001_migrate_existing_designs.sql`

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

## 🐛 Troubleshooting

### Common Issues

**Application won't load:**
- Check Supabase credentials in `client.ts`
- Verify database migrations are deployed
- Clear browser cache and refresh

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

*Built with ❤️ using modern web technologies*