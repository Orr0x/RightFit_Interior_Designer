# RightFit Interior Designer - Development Context

## 🏗️ **Current Project State:**
- React + TypeScript + Supabase interior design app
- Live at: http://31.97.115.105/ 
- GitHub: Orr0x/RightFit_Interior_Designer
- 100% Database-driven system with 164 DB- components across 8 room types (ALL MIGRATIONS COMPLETE!)
- Multi-room project system with 2D/3D visualization
- Universal Enhanced3D_v2 rendering system deployed

## 🚨 **GOLDEN RULES (NEVER BREAK):**
1. **DON'T TOUCH CORNER UNIT GEOMETRY** - Sacred and untouchable (PRESERVED!)
2. **Use proper Git branching** - feature branches first, then merge to main
3. **User prefers PowerShell commands** when terminal gets stuck
4. **User can't use Supabase CLI** - paste SQL directly into database
5. **Make plans before implementing** - user likes detailed approaches
6. **Be creative and detailed** - aim to amaze the user

## 🔄 **GITHUB WORKFLOW & DEPLOYMENT:**
- **AUTOMATIC DEPLOYMENT**: Any commit to `main` branch triggers GitHub Actions deployment to PRODUCTION (http://31.97.115.105/)
- **NEVER commit directly to main** - always use feature branches for development
- **Current branch**: `feature/ui-menu-improvements` (ready for merge)
- **Deployment**: Fully automated via GitHub Actions on main branch push

## 🏗️ **SYSTEM ARCHITECTURE:**

### **🎨 Frontend Stack:**
- **React 18** + **TypeScript** + **Vite** (fast development)
- **Tailwind CSS** + **shadcn/ui** components (professional styling)
- **React Router** for navigation
- **React Query** for state management

### **🎭 3D Rendering System:**
- **Three.js** + **React Three Fiber** + **Drei** (3D visualization)
- **Enhanced3D_v2.tsx** - Universal database-enhanced renderer for ALL component types
- **SafeEnhancedRenderer.tsx** - Smart routing with safety fallbacks
- **EnhancedCorner3D_v2.tsx** - Specialized corner unit renderer (preserves sacred geometry)
- **EnhancedCabinet3D_v2.tsx** - Enhanced standard cabinet renderer
- **use3DModelConfig.ts** - Database configuration hook

### **🗄️ Database Architecture:**
- **Supabase** (PostgreSQL + Auth + Real-time)
- **components** table: 164 DB- components with full metadata
- **model_3d_config** table: 3D model configuration and materials
- Row Level Security enabled
- Database: `components` table with `component_room_types` junction
- Drag system: 1.15× scaled previews with proper coordinate conversion
- Current branch: `feature/ui-menu-improvements` (synced with main)

## 🎭 **Communication Style:**
- User has ADHD - expect random thoughts and creative connections
- Appreciates British humor and spontaneous references 
- Uses strong language/swearing - don't be offended, it's normal communication
- Direct, no-nonsense approach - we don't do overly polite/woke here
- Use "bravo!" for good work, expect "dumbass" when you mess up
- Say "Time for bed!" (Zebedee) when big tasks are complete
- Be enthusiastic with emojis and celebrations for progress
- User likes technical detail but with personality and fun
- Inside jokes: "CICD Baby", "golden rule", corner unit geometry obsession
- Random pop culture references may appear (but user might not actually be a fan!)

## 🎉 **MIGRATION SUCCESS SUMMARY:**

### **✅ COMPLETED MIGRATIONS:**
1. **2D Component System**: ✅ COMPLETE
   - All 164 components now database-driven
   - Removed all hardcoded component definitions
   - `CompactComponentSidebar.tsx` uses `useComponents` hook
   - Deleted obsolete files: `ComponentLibrary.tsx`, `EnhancedSidebar.tsx`, `src/data/components.tsx`

2. **3D Model System**: ✅ COMPLETE
   - Universal `Enhanced3D_v2.tsx` renderer handles ALL component types
   - `SafeEnhancedRenderer.tsx` provides smart routing with fallbacks
   - Corner units preserved with `EnhancedCorner3D_v2.tsx`
   - Database-configurable materials and colors via `use3DModelConfig.ts`
   - All wireframes removed for clean, professional appearance

3. **Technical Debt Cleanup**: ✅ COMPLETE
   - Removed all hardcoded component references
   - Deleted obsolete migration scripts and test files
   - Clean codebase with no legacy dependencies
   - Database contains ONLY 164 DB- components

### **🏆 FINAL STATISTICS:**
- **Total Components Created**: 164 DB- components
- **Original Components Removed**: 154 hardcoded components  
- **Kitchen Components**: 37 (base-cabinets, wall-units, appliances, larder, accessories)
- **Bedroom Components**: 28 (furniture, storage, props)
- **Living Room Components**: 16 (furniture, built-ins, storage, props)
- **Other Room Components**: 73 (bathroom, office, utility, dressing, etc.)
- **Corner Units**: 3 types (Base, Wall, Larder) - GEOMETRY PRESERVED!

## 🚀 **READY FOR NEXT PHASE:**

### **🎨 3D Model Enhancement Work:**
- Visual improvements and material refinements
- Enhanced lighting and textures
- Model detail improvements
- Animation and interaction features

### **🔧 System Features:**
- Performance optimizations
- User experience improvements
- New component types
- Advanced design tools

### **📊 Current System State:**
- ✅ 100% Database-driven
- ✅ Clean codebase (no technical debt)
- ✅ Scalable architecture
- ✅ Production-ready
- ✅ Golden Rule preserved
- ✅ All migrations complete

**Ready for the fun creative work!** 🔥✨

## 🎯 **ENVIRONMENT VARIABLES FOR TESTING:**
```powershell
# Enable all DB component features
$env:VITE_TEST_ALL_DB = "true"
$env:VITE_TEST_DB_CORNER = "true" 
$env:VITE_TEST_ENHANCED_CABINET = "true"

# Restart development server
npm run dev
```

**Time for bed, Zebedee! The migration work is COMPLETE!** 🌟
