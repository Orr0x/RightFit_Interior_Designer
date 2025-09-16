# 🤖 Cursor AI Safety Rules & Development Guidelines

## 🚨 **CRITICAL: NEVER BREAK THESE RULES**

### **1. GIT OPERATIONS - ABSOLUTE RESTRICTIONS**
- **NEVER touch main branch** without explicit user permission
- **NEVER merge to main** unless user explicitly says "merge with main"
- **NEVER push to main** unless user explicitly says "push to main" 
- **NEVER pull from main** unless user explicitly says "pull from main"
- **ALWAYS work in safe branches**: `git checkout -b feature/description-safe`
- **User handles all main branch operations** - AI only creates and works in safe branches

### **2. TERMINAL SAFETY PROTOCOL**
- **If terminal output is not visible, STOP IMMEDIATELY**
- **Ask user what they can see before proceeding**
- **Never run commands blindly when output is unclear**
- **Never assume a command worked if you can't see the output**
- **If stuck in terminal, ask user for help instead of trying random commands**

### **3. DEVELOPMENT WORKFLOW**
- **Always create safe branches for any work**
- **Update DEVELOPMENT-BACKLOG.md with progress**
- **Test thoroughly before asking for merge approval**
- **User must approve ALL commits to main**
- **Document all changes in commit messages**

---

## 📋 **DEVELOPMENT STANDARDS**

### **Code Quality Requirements**
- **Zero TypeScript linting errors** - Always run `npm run build` to check
- **Clean imports and exports** - Remove unused variables/functions
- **Proper error handling** - Implement graceful fallbacks
- **Performance considerations** - Use React.memo, useCallback, useMemo appropriately
- **Mobile compatibility** - All features must work on mobile devices

### **Testing Standards**
- **Test on multiple devices** - Desktop, tablet, mobile
- **Test all user interactions** - Touch, mouse, keyboard
- **Verify in all views** - 2D plan, elevation views, 3D view
- **Check performance** - Monitor FPS and memory usage

### **Documentation Requirements**
- **Update README.md** for user-facing changes
- **Update DEVELOPMENT-BACKLOG.md** for technical progress
- **Update TECHNICAL-DOCS.md** for architecture changes
- **Create NEW-CHAT-CONTEXT.md** updates when needed

---

## 🎯 **PROJECT-SPECIFIC RULES**

### **Architecture Awareness**
- **Corner Logic System is BROKEN** - Only 2/4 corners work correctly
- **Component boundaries don't rotate** - Major positioning issues exist
- **Mobile support is COMPLETE** - Don't break existing touch functionality
- **Database-driven components** - Use DatabaseComponent interface, not legacy types

### **Critical Files - Handle with Care**
- **DesignCanvas2D.tsx**: Core canvas with complex positioning logic
- **CompactComponentSidebar.tsx**: Database-driven component library
- **Designer.tsx**: Main layout with mobile detection
- **MobileDesignerLayout.tsx**: Mobile-specific layout
- **ProjectContext.tsx**: Central state management

### **Known Issues to Avoid**
- **Don't touch corner positioning logic** without understanding the full system
- **Don't break mobile touch handlers** - they're carefully implemented
- **Don't modify wall snapping** without testing all 4 walls
- **Don't change component loading** without understanding race conditions

---

## 🔧 **TECHNICAL PATTERNS**

### **Mobile Development**
```typescript
// Always check mobile state
const isMobile = useIsMobile();

// Conditional rendering for mobile
{isMobile ? (
  <MobileDesignerLayout {...props} />
) : (
  <DesktopLayout {...props} />
)}

// Touch events need proper handling
const touchEventHandlers = useTouchEvents({
  onTouchStart: (point, event) => { /* handle */ },
  // ... other handlers
});
```

### **Database Components**
```typescript
// Use correct interface
interface DatabaseComponent {
  component_id: string; // NOT 'id'
  name: string;
  type: string;
  width: number;
  height: number;
  depth: number;
  // ... other properties
}

// Load with proper hook
const { components, loading, error } = useOptimizedComponents(roomType);
```

### **Error Handling**
```typescript
// Always provide fallbacks
const componentData = componentBehaviorCache.get(element.type) || {
  mountType: 'floor',
  defaultDepth: 60,
  hasDirection: true
};

// Handle loading states
if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
```

---

## 🚀 **WORKFLOW CHECKLIST**

### **Starting New Work**
- [ ] Read DEVELOPMENT-BACKLOG.md for current priorities
- [ ] Create safe branch: `git checkout -b feature/description-safe`
- [ ] Understand if work affects corner logic (probably does)
- [ ] Plan mobile compatibility from the start

### **During Development**
- [ ] Test frequently on mobile and desktop
- [ ] Run `npm run build` to check for linting errors
- [ ] Update documentation as you go
- [ ] Commit small, logical changes

### **Before Requesting Merge**
- [ ] All TypeScript linting errors resolved
- [ ] Mobile functionality tested and working
- [ ] Desktop functionality not broken
- [ ] Documentation updated
- [ ] DEVELOPMENT-BACKLOG.md updated with progress

### **Merge Process**
- [ ] User explicitly approves merge to main
- [ ] User handles the actual git merge command
- [ ] AI never touches main branch directly

---

## ⚠️ **EMERGENCY PROCEDURES**

### **If Terminal Gets Stuck**
1. **STOP immediately** - don't try random commands
2. **Ask user**: "I can't see the terminal output, what do you see?"
3. **Wait for user guidance** - don't proceed blindly
4. **Document the issue** for future reference

### **If Build Breaks**
1. **Check TypeScript errors first** - most common issue
2. **Look for missing imports/exports**
3. **Check for mobile compatibility issues**
4. **Ask user to test locally** if unsure

### **If Mobile Functionality Breaks**
1. **Check useIsMobile hook** - might be missing
2. **Verify touch event handlers** - might be disabled
3. **Test MobileDesignerLayout** - might have errors
4. **Check responsive CSS** - might be overridden

---

## 📚 **REFERENCE INFORMATION**

### **Current Version: v2.5**
- Mobile/Touch Support: ✅ Complete
- TypeScript Linting: ✅ Zero errors
- Performance Phase 4: ✅ Complete
- Database Migration: ✅ Complete
- Corner Logic System: 🔴 BROKEN (Phase 6 priority)

### **Key Technologies**
- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Three.js + React Three Fiber
- Supabase (PostgreSQL + Auth)
- Custom touch handlers for mobile

### **File Structure**
```
src/
├── components/designer/    # Core design components
├── hooks/                  # Custom React hooks
├── services/              # Database services
├── types/                 # TypeScript interfaces
└── pages/                 # Route components
```

---

## 🎯 **SUCCESS METRICS**

### **Code Quality**
- Zero TypeScript linting errors
- All tests passing
- Mobile functionality working
- Performance within acceptable limits

### **User Experience**
- Smooth interactions on all devices
- Consistent behavior across views
- Clear error messages and loading states
- No broken functionality

### **Development Process**
- Safe branching strategy followed
- Documentation kept up to date
- User approval obtained for main branch changes
- No emergency fixes needed

---

*These rules exist to prevent breaking the production application and ensure smooth collaboration between AI and human developers.*

**🚨 REMEMBER: When in doubt, ask the user before proceeding!**
