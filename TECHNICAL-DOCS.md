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
- **DesignCanvas2D**: Multi-view 2D canvas with drag-and-drop
- **View3D**: Three.js-based 3D visualization
- **ComponentLibrary**: Room-specific component catalog
- **PropertiesPanel**: Element property editing

### Professional Features
- **Keyboard Shortcuts**: Full keyboard navigation support
- **Performance Monitor**: Real-time FPS and memory tracking
- **Error Boundaries**: Graceful error handling
- **Validation System**: Design validation and feedback

## Database Schema

### Tables
- **projects**: Multi-room project containers
- **room_designs**: Individual room designs within projects
- **profiles**: User profile information

### Key Relationships
- User → Projects (1:many)
- Project → Room Designs (1:many)
- Room Design → Design Elements (1:many)

### Room Types
The application supports 12 different room types:

**Living Spaces:**
- **Kitchen**: Cabinets, appliances, work surfaces
- **Living Room**: Seating, entertainment, storage
- **Dining Room**: Tables, chairs, storage

**Bedrooms:**
- **Bedroom**: Standard bedroom with furniture and storage
- **Master Bedroom**: Larger bedroom with en-suite space (600x500cm)
- **Guest Bedroom**: Essential furniture for guests (450x400cm)

**Bathrooms:**
- **Bathroom**: Main bathroom with fixtures and vanities (300x300cm)
- **Ensuite**: Private bathroom connected to master bedroom (250x200cm)

**Specialized Rooms:**
- **Office**: Home office with desk and storage (400x350cm)
- **Dressing Room**: Wardrobe and storage solutions (300x400cm)
- **Utility Room**: Appliances and storage (300x250cm)
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
