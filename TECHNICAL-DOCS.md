# Technical Documentation

## Architecture Overview

RightFit Interior Designer is a React-based web application that provides professional interior design tools with multi-room project support.

### Core Technologies
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **3D Rendering**: Three.js + React Three Fiber + Drei
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **State Management**: React Context + Custom Hooks

## Key Components

### Multi-Room System
- **ProjectContext**: Centralized state management for projects and rooms
- **RoomTabs**: Tabbed interface for switching between rooms
- **ProjectDashboard**: Project creation and management interface

### Design Tools
- **DesignCanvas2D**: Multi-view 2D canvas with enhanced drag-and-drop
- **CompactComponentSidebar**: Database-driven component library with 154+ components
- **View3D**: Three.js-based 3D visualization
- **PropertiesPanel**: Element property editing with smart controls

### Professional Features
- **Keyboard Shortcuts**: Full keyboard navigation support
- **Performance Monitor**: Real-time FPS and memory tracking
- **Error Boundaries**: Graceful error handling
- **Validation System**: Design validation and feedback

### Enhanced User Interface (v2.1)
- **Smart Click Selection**: 5-pixel drag threshold prevents accidental movement
- **Precision Drag Previews**: 1.15× scaled drag images match final component size
- **CSS Scaling Fix**: Coordinate conversion accounts for browser window scaling
- **Improved Hover Detection**: Accurate mouse hit testing for component selection
- **Visual Feedback**: Enhanced drag states with proper opacity and visual cues

## Database Schema

### Tables
- **projects**: Multi-room project containers
- **room_designs**: Individual room designs within projects
- **profiles**: User profile information

### Key Relationships
- User → Projects (1:many)
- Project → Room Designs (1:many)
- Room Design → Design Elements (1:many)

## Component Library Architecture

### EnhancedSidebar Component
The main component library is implemented in `src/components/designer/EnhancedSidebar.tsx` and provides:

#### Component Definition Interface
```typescript
interface ComponentDefinition {
  id: string;
  name: string;
  type: 'appliance' | 'cabinet';
  width: number;
  height: number;
  color: string;
  category: string;
  roomTypes: RoomType[];
  icon: ReactElement;
  description: string;
}
```

#### Component Categories
Each room type has multiple organized categories:
- **Furniture**: Beds, chairs, tables, seating
- **Storage**: Wardrobes, cabinets, drawers, shelving
- **Props**: Lighting, mirrors, accessories, decor
- **Built-ins**: Custom entertainment units, storage systems
- **Appliances**: Non-carpentry items (fixtures, electronics)

#### Room Type Filtering
Components are filtered by `roomTypes` array to show only relevant items for each room type.

### Room Types
The application supports 8 major room types with comprehensive component libraries:

**Living Spaces:**
- **Kitchen**: Cabinets, appliances, work surfaces (existing)
- **Living Room**: 13 components across 5 categories
- **Dining Room**: 14 components across 4 categories

**Bedrooms:**
- **Bedroom**: 26 components across 3 categories (Furniture, Storage, Decor Props)
- **Master Bedroom**: Same as bedroom with larger dimensions
- **Guest Bedroom**: Same as bedroom with guest-specific components

**Specialized Rooms:**
- **Bathroom**: 16 components across 4 categories (Vanities, Storage, Fixtures, Accessories)
- **Office**: 12 components across 4 categories (Office Furniture, Storage, Shelving, Accessories)
- **Dressing Room**: 8 components across 3 categories (Storage, Furniture, Accessories)
- **Utility Room**: 8 components across 3 categories (Appliances, Storage, Accessories)
- **Under Stairs**: Storage solutions (200x250cm)

## API Integration

### Supabase Client
- Authentication with JWT tokens
- Row Level Security (RLS) policies
- Real-time subscriptions for live updates
- File storage for project thumbnails

### Data Flow
1. User interactions trigger state updates
2. State changes call Supabase API
3. Database updates trigger optimistic UI updates
4. Real-time subscriptions sync changes across clients

## Performance Optimizations

### Rendering
- React.memo for component memoization
- useCallback for event handlers
- useMemo for expensive calculations
- Canvas rendering with requestAnimationFrame

### Memory Management
- Automatic cleanup of Three.js resources
- Throttled event handlers
- Lazy loading of 3D models
- Performance monitoring with warnings

## Security Features

### Input Validation
- XSS prevention with safe DOM manipulation
- Input sanitization for all user data
- Type-safe API calls with TypeScript

### Authentication
- JWT token-based authentication
- Row Level Security policies
- Secure session management

## Development Setup

### Prerequisites
- Node.js 18+
- Supabase account
- Git

### Local Development
```bash
npm install
npm run dev
```

### Environment Variables
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key

## Deployment

### Build Process
```bash
npm run build
```

### Database Migrations
Deploy migrations in order:
1. `20250908160000_create_multi_room_schema.sql`
2. `20250908160001_migrate_existing_designs.sql`
3. `20250109000000_add_new_room_types.sql` (adds 5 new room types)

### Production Considerations
- Enable HTTPS
- Configure CORS policies
- Set up monitoring and logging
- Implement backup strategies

## Troubleshooting

### Common Issues
- **Database connection**: Check Supabase credentials
- **Performance**: Monitor FPS and memory usage
- **3D rendering**: Ensure hardware acceleration is enabled
- **Authentication**: Verify RLS policies are configured

### Debug Tools
- Performance Monitor (development only)
- Browser DevTools
- Supabase Dashboard logs
- Console error tracking
