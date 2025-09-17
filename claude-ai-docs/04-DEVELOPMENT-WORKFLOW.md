# 🔄 Development Workflow - RightFit Interior Designer

## 🚨 **Critical Development Rules**

### **Git Operations - ABSOLUTE RESTRICTIONS**
- **NEVER touch main branch** without explicit user permission
- **NEVER merge to main** unless user explicitly says "merge with main"
- **NEVER push to main** unless user explicitly says "push to main" 
- **NEVER pull from main** unless user explicitly says "pull from main"
- **ALWAYS work in safe branches**: `git checkout -b feature/description-safe`
- **User handles all main branch operations** - AI only creates and works in safe branches

### **Terminal Safety Protocol**
- **If terminal output is not visible, STOP IMMEDIATELY**
- **Ask user what they can see before proceeding**
- **Never run commands blindly when output is unclear**
- **Never assume a command worked if you can't see the output**
- **If stuck in terminal, ask user for help instead of trying random commands**

---

## 📋 **Code Quality Standards**

### **TypeScript Requirements**
- **Zero linting errors**: Always run `npm run build` to check
- **Comprehensive interfaces**: Use DatabaseComponent, not legacy types
- **Proper error handling**: Implement graceful fallbacks
- **Type safety**: Avoid `any` types where possible

### **React Patterns**
```typescript
// ✅ GOOD: Proper hook usage
const MyComponent = () => {
  const { components, loading, error } = useOptimizedComponents();
  const isMobile = useIsMobile();
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <div>
      {components.map(component => (
        <ComponentCard key={component.id} component={component} />
      ))}
    </div>
  );
};

// ❌ BAD: Direct database access in components
const BadComponent = () => {
  const [components, setComponents] = useState([]);
  
  useEffect(() => {
    supabase.from('components').select('*').then(setComponents);
  }, []);
};
```

### **Mobile Compatibility Requirements**
```typescript
// ✅ GOOD: Mobile-aware component
const ResponsiveComponent = () => {
  const isMobile = useIsMobile();
  
  return (
    <div className={`${isMobile ? 'mobile-layout' : 'desktop-layout'}`}>
      {isMobile ? (
        <MobileInterface />
      ) : (
        <DesktopInterface />
      )}
    </div>
  );
};

// ✅ GOOD: Touch event handling
const touchEventHandlers = useTouchEvents({
  onTouchStart: (point, event) => { /* handle touch */ },
  onPinchMove: (distance, scale, center) => { /* handle pinch */ }
});

// ❌ BAD: Desktop-only interactions
const handleMouseOnly = (e: MouseEvent) => {
  // This won't work on mobile
};
```

---

## 🏗️ **Architecture Awareness**

### **Critical System Issues (DO NOT MODIFY)**
- **Corner Logic System**: Only 2/4 corners work correctly
- **Component Boundaries**: Rotation boundaries don't match visual components
- **Wide Component Positioning**: Left/right wall snapping has 1cm offset
- **3D Ceiling Height**: Room height control doesn't affect 3D view

### **Safe Areas for Development**
- **New component creation**: Database entries and 3D models
- **UI improvements**: Styling, layout, user experience
- **Performance optimizations**: Caching, loading states
- **Documentation**: Always safe to update

### **Dangerous Areas (Proceed with Caution)**
- **Corner positioning logic**: Affects fundamental positioning
- **Wall snapping calculations**: Core positioning system
- **3D coordinate conversion**: Critical for 2D/3D consistency
- **Touch event handlers**: Carefully implemented mobile support

---

## 🛠️ **Development Process**

### **Starting New Work**
1. **Read DEVELOPMENT-BACKLOG.md** for current priorities
2. **Create safe branch**: `git checkout -b feature/description-safe`
3. **Understand impact**: Does this affect corner logic or positioning?
4. **Plan mobile compatibility** from the start
5. **Update documentation** as you work

### **During Development**
1. **Test frequently** on mobile and desktop
2. **Run `npm run build`** to check for linting errors
3. **Use proper interfaces**: DatabaseComponent, DesignElement
4. **Follow existing patterns**: Service layer, custom hooks
5. **Commit small, logical changes**

### **Before Requesting Review**
1. **Zero TypeScript linting errors**
2. **Mobile functionality tested and working**
3. **Desktop functionality not broken**
4. **Documentation updated**
5. **DEVELOPMENT-BACKLOG.md updated with progress**

---

## 📱 **Mobile Development Standards**

### **Touch Event Patterns**
```typescript
// ✅ GOOD: Comprehensive touch handling
const useTouchEvents = (props: UseTouchEventsProps) => {
  const handleTouchStart = useCallback((event: TouchEvent) => {
    if (event.touches.length === 1) {
      const point = { x: event.touches[0].clientX, y: event.touches[0].clientY };
      props.onTouchStart?.(point, event);
    } else if (event.touches.length === 2) {
      // Handle pinch gesture
      const distance = getDistance(event.touches);
      const center = getMidpoint(event.touches);
      props.onPinchStart?.(distance, center, event);
    }
  }, [props]);
  
  return { attachTouchEvents };
};
```

### **Responsive Design Patterns**
```typescript
// ✅ GOOD: Mobile-first responsive design
const MobileDesignerLayout = ({ design, ...props }) => {
  return (
    <div className="flex flex-col h-full w-full bg-gray-50 overflow-hidden">
      {/* Mobile Toolbar */}
      <div className="flex items-center justify-between p-2 bg-white border-b">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <ComponentSidebar />
          </SheetContent>
        </Sheet>
      </div>
      
      {/* Main Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <DesignCanvas2D {...props} />
      </div>
    </div>
  );
};
```

---

## 🎯 **Component Development Workflow**

### **Creating New Components**
1. **Database Entry**
   ```sql
   INSERT INTO components (component_id, name, type, category, ...) 
   VALUES ('new-component', 'New Component', 'cabinet', 'base-cabinets', ...);
   ```

2. **Icon Integration**
   ```typescript
   // Add to getIconComponent in CompactComponentSidebar.tsx
   const iconMap = {
     'NewIcon': NewIcon,
     // ...existing icons
   };
   ```

3. **3D Model Creation**
   ```typescript
   // Create Enhanced[ComponentName]3D in EnhancedModels3D.tsx
   export const EnhancedNewComponent3D: React.FC<Enhanced3DModelProps> = ({
     element, roomDimensions, isSelected, onClick
   }) => {
     // Follow existing patterns
   };
   ```

4. **Integration Testing**
   - Test in CompactComponentSidebar
   - Verify 3D rendering
   - Check mobile compatibility
   - Validate positioning

### **Testing Checklist**
- [ ] Component loads from database
- [ ] Appears in correct categories
- [ ] 3D model renders correctly
- [ ] Mobile click-to-add works
- [ ] Desktop drag-and-drop works
- [ ] No TypeScript errors
- [ ] Performance acceptable

---

## 🔍 **Debugging Guidelines**

### **Common Issues & Solutions**

#### **Component Not Loading**
```typescript
// Check database query
console.log('🔍 Available categories:', 
  [...new Set(components.map(comp => comp.category))].sort()
);

// Check room type filtering
const kitchenComponents = components.filter(comp => 
  comp.room_types.includes('kitchen')
);
console.log('🍳 Kitchen components:', kitchenComponents.length);
```

#### **3D Model Not Rendering**
```typescript
// Check coordinate conversion
const { x, z } = convertTo3D(element.x, element.y, roomWidth, roomHeight);
console.log('3D Position:', { x, y: element.z / 100, z });

// Validate element dimensions
const validatedElement = validateElementDimensions(element);
console.log('Validated dimensions:', validatedElement);
```

#### **Mobile Touch Not Working**
```typescript
// Check mobile detection
const isMobile = useIsMobile();
console.log('Is mobile:', isMobile);

// Check touch event attachment
useEffect(() => {
  if (isMobile && canvasRef.current) {
    const cleanup = touchEventHandlers.attachTouchEvents(canvasRef.current);
    return cleanup;
  }
}, [isMobile, touchEventHandlers]);
```

### **Console Error Patterns**

#### **Known Harmless Errors**
```
"WALL UNITS CATEGORY MISSING FROM FINAL GROUPS!"
// This is a harmless race condition during initial load
// Components load correctly after initial render
```

#### **Critical Errors to Fix**
```
"Cannot read properties of undefined (reading 'useLayoutEffect')"
// Usually indicates React version mismatch or build issue

"effectiveDims is not defined"
// Missing dimension calculations in positioning logic

"ReferenceError: roomType is not defined"
// Missing room type context in component
```

---

## 📊 **Performance Standards**

### **Build Performance**
- **Build time**: < 10 seconds for production builds
- **Bundle size**: Maintain 47% reduction achieved
- **TypeScript compilation**: Zero errors, minimal warnings

### **Runtime Performance**
- **3D rendering**: 60 FPS on modern devices, 30 FPS minimum
- **Mobile interactions**: < 100ms response time
- **Component loading**: < 2 seconds initial load
- **Memory usage**: < 200MB for typical designs

### **Performance Monitoring**
```typescript
// Use PerformanceMonitor component for real-time metrics
const PerformanceMonitor = () => {
  const [fps, setFps] = useState(0);
  const [memoryUsage, setMemoryUsage] = useState(0);
  
  // Monitor FPS
  useEffect(() => {
    const measureFPS = () => {
      // FPS measurement logic
    };
    requestAnimationFrame(measureFPS);
  }, []);
  
  return (
    <div className="performance-monitor">
      <div>FPS: {fps}</div>
      <div>Memory: {memoryUsage}MB</div>
    </div>
  );
};
```

---

## 🔒 **Security Guidelines**

### **Database Access**
- **Always use service layer**: ComponentService, not direct Supabase calls
- **Respect RLS policies**: Components are public, designs are user-owned
- **Validate inputs**: Use TypeScript interfaces for type safety
- **Sanitize data**: Prevent XSS through safe DOM manipulation

### **Authentication**
```typescript
// ✅ GOOD: Check authentication status
const { user } = useAuth();
if (!user) {
  return <LoginPrompt />;
}

// ✅ GOOD: Respect user permissions
const canEdit = user.id === project.user_id || user.user_tier === 'god';
```

---

## 📚 **Documentation Standards**

### **Code Documentation**
```typescript
/**
 * ComponentService - Database-driven component behavior and properties
 * Replaces hardcoded COMPONENT_DATA and elevation height constants
 * Enhanced with intelligent caching and batch loading
 */
export class ComponentService {
  /**
   * Batch load component behaviors for better performance
   * @param componentTypes - Array of component type strings
   * @returns Map of component types to behaviors
   */
  static async batchLoadComponentBehaviors(
    componentTypes: string[]
  ): Promise<Map<string, ComponentBehavior>> {
    // Implementation...
  }
}
```

### **Update Requirements**
When making changes, always update:
1. **README.md** - User-facing changes
2. **DEVELOPMENT-BACKLOG.md** - Technical progress
3. **TECHNICAL-DOCS.md** - Architecture changes
4. **Component documentation** - New components or behaviors

---

## 🎯 **Success Criteria**

### **Code Quality**
- Zero TypeScript linting errors
- Comprehensive test coverage
- Clean, readable code with proper documentation
- Consistent patterns and architecture

### **User Experience**
- Smooth interactions on all devices
- Consistent behavior across views
- Clear error messages and loading states
- Professional workflow efficiency

### **Performance**
- Fast build times and bundle sizes
- Responsive UI interactions
- Efficient 3D rendering
- Optimal memory usage

### **Maintainability**
- Well-documented code and architecture
- Consistent development patterns
- Easy onboarding for new developers
- Scalable component system

---

This development workflow ensures consistent, high-quality code while maintaining the professional standards required for RightFit Interior Designer. Always prioritize user experience, mobile compatibility, and system stability in all development work.
