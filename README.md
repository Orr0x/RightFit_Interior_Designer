# RightFit Interior Designer

A professional-grade interior design application built with React, TypeScript, and Supabase. Create, edit, and visualize interior layouts with advanced 2D multi-view planning and immersive 3D visualization.

## ✨ Features

### 🏗️ Advanced Design Tools
- **Multi-View 2D Planning**: Plan view, Front view, Side view with seamless switching
- **Professional 3D Visualization**: Real-time 3D rendering with lighting and materials
- **Smart Component Placement**: Automatic orientation detection and intelligent positioning
- **Precision Measurement**: Built-in ruler tools with real-time dimensions
- **Grid System**: Snap-to-grid functionality for accurate alignment

### 🎛️ Enhanced Properties Panel
- **Height vs Depth Control**: Professional dimension management
  - Width: Left-to-right dimension
  - Depth: Front-to-back dimension (kitchen cabinets)
  - Height: Bottom-to-top dimension (wall-mounted elements)
- **Context-Aware Controls**: Properties adapt based on current view
- **Real-time Updates**: Live preview of changes across all views

### 🎨 Component Library & Multi-Room Support
- **Extensive Kitchen Components**: Cabinets, appliances, fixtures, and accessories
- **Multi-Room Design**: Kitchen, Bedroom, Bathroom, Media Wall, Flooring
- **Smart Auto-Selection**: Components automatically adapt to room context
- **Drag & Drop Interface**: Intuitive component placement

### ⚡ Performance & Usability
- **Keyboard Shortcuts**: Professional-grade hotkeys (Ctrl+Z, Ctrl+Y, etc.)
- **Performance Monitoring**: Real-time FPS and memory usage tracking
- **Error Boundaries**: Graceful error handling with recovery options
- **Status Bar**: Live feedback on design elements and validation
- **Smooth Animations**: Polished transitions between views and states

### 🔐 Cloud Integration & Security
- **Secure Authentication**: Supabase-powered user management
- **Cloud Storage**: Auto-save and sync designs across devices
- **XSS Protection**: Comprehensive input validation and sanitization
- **Row Level Security**: Database-level access control

## 🚀 Quick Start

### Prerequisites
- Node.js 18.0.0 or higher
- Bun (latest version)
- Supabase account

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd rightfit-kitchen-designer

# Install dependencies
bun install

# Configure Supabase (see detailed setup below)
# Edit src/integrations/supabase/client.ts with your project credentials

# Start development server
bun run dev
```

## 🔧 Detailed Setup Guide

### 1. Supabase Configuration

#### Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Copy your Project URL and Anon Key from Settings → API
3. Update `src/integrations/supabase/client.ts`:

```typescript
const SUPABASE_URL = "your-project-url-here";
const SUPABASE_PUBLISHABLE_KEY = "your-anon-key-here";
```

#### Database Setup
Run the following SQL in your Supabase SQL Editor:

```sql
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  public_profile BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Secure profile policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (public_profile = true);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Create designs table
CREATE TABLE public.designs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  design_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  room_type TEXT DEFAULT 'kitchen',
  thumbnail_url TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on designs
ALTER TABLE public.designs ENABLE ROW LEVEL SECURITY;

-- Secure design policies
CREATE POLICY "Users can view their own designs and public designs" 
ON public.designs FOR SELECT USING ((auth.uid() = user_id) OR (is_public = true));

CREATE POLICY "Users can create their own designs" 
ON public.designs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own designs" 
ON public.designs FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own designs" 
ON public.designs FOR DELETE USING (auth.uid() = user_id);

-- Timestamp triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_designs_updated_at
  BEFORE UPDATE ON public.designs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profiles for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

### 2. Authentication Setup
1. In Supabase Dashboard → Authentication → Settings
2. Configure Site URL: `http://localhost:5173`
3. Add Redirect URLs: `http://localhost:5173/**`
4. **Important**: Enable "Leaked password protection" in Password Security settings

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

### Multi-View Navigation
- **Plan View**: Top-down layout planning
- **Front View**: Wall-mounted elements and heights
- **Side View**: Depth and profile visualization
- **3D View**: Immersive walkthrough and visualization

### Professional Design Workflow
1. **Start with Plan View**: Layout the basic kitchen footprint
2. **Add Base Cabinets**: Place lower cabinets and appliances
3. **Switch to Front View**: Add wall cabinets and set heights
4. **Use Side View**: Adjust depths and profiles
5. **Preview in 3D**: Validate the complete design

## 🏗️ Project Structure

```
rightfit-kitchen-designer/
├── src/
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   └── designer/              # Design-specific components
│   │       ├── DesignCanvas2D.tsx # Multi-view 2D canvas
│   │       ├── View3D.tsx         # 3D visualization
│   │       ├── ViewSelector.tsx   # View switching component
│   │       ├── EnhancedSidebar.tsx # Component library sidebar
│   │       ├── PropertiesPanel.tsx # Advanced properties panel
│   │       ├── DesignToolbar.tsx  # Main toolbar
│   │       ├── StatusBar.tsx      # Status and validation
│   │       ├── ErrorBoundary.tsx  # Error handling
│   │       └── PerformanceMonitor.tsx # Performance tracking
│   ├── hooks/
│   │   ├── useKeyboardShortcuts.ts # Professional shortcuts
│   │   └── useDesignValidation.ts  # Design validation logic
│   ├── lib/
│   │   └── security.ts            # Input validation & XSS protection
│   ├── pages/
│   │   ├── Designer.tsx           # Main designer interface
│   │   ├── Dashboard.tsx          # Design management
│   │   └── [Room].tsx             # Room-specific pages
│   └── integrations/supabase/     # Backend integration
```

## 🔒 Security Features

This application implements comprehensive security measures:

- **XSS Prevention**: All user inputs are validated and sanitized
- **Row Level Security**: Database access restricted per user
- **Input Validation**: Comprehensive validation for design names and JSON data
- **Safe DOM Manipulation**: No direct `innerHTML` usage
- **Secure Authentication**: Supabase-powered with leaked password protection

## 📊 Performance Monitoring

The designer includes built-in performance monitoring:
- Real-time FPS tracking
- Memory usage monitoring
- Component render optimization
- Smooth 60fps animations

## 🚀 Deployment

### Using Lovable (Recommended)
1. Visit your Lovable project: [https://lovable.dev/projects/3abc3b83-25cf-4e93-b77d-7de6595bf073](https://lovable.dev/projects/3abc3b83-25cf-4e93-b77d-7de6595bf073)
2. Click **Publish** for instant deployment
3. Connect custom domain in Project Settings

### Manual Deployment
```bash
# Build for production
bun run build

# Preview build locally
bun run preview
```

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS with semantic design tokens
- **UI Components**: shadcn/ui with custom variants
- **3D Rendering**: Three.js + React Three Fiber
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **State Management**: React Context + Hooks
- **Package Manager**: Bun
- **Performance**: React.memo, useMemo, useCallback optimizations

## 📋 Available Scripts

```bash
bun run dev      # Start development server
bun run build    # Build for production
bun run preview  # Preview production build
bun run lint     # Run ESLint
```

## 🐛 Troubleshooting

### Common Issues

**Build Errors:**
- Ensure Node.js 18+ is installed
- Delete `node_modules` and run `bun install`
- Clear browser cache and restart dev server

**Performance Issues:**
- Enable hardware acceleration in browser
- Reduce number of 3D elements if rendering is slow
- Check Performance Monitor for memory leaks

**Authentication Problems:**
- Verify Supabase credentials in client.ts
- Check authentication settings in Supabase dashboard
- Clear localStorage and try again

**Design Not Saving:**
- Check browser console for errors
- Verify user authentication status
- Ensure Supabase RLS policies are correctly configured

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

- 📚 [Documentation](https://docs.lovable.dev)
- 💬 [Lovable Discord](https://discord.com/invite/lovable)
- 🐛 [Report Issues](https://github.com/your-repo/issues)
- 📧 Email: support@rightfit.com

## 🎯 Roadmap

### Upcoming Features
- [ ] Advanced material library
- [ ] Lighting simulation
- [ ] Cost estimation
- [ ] AR visualization
- [ ] Collaborative editing
- [ ] Export to CAD formats

---

*Built with ❤️ using [Lovable](https://lovable.dev) - AI-powered development platform*