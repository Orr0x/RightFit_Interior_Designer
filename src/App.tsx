
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Home from "./pages/Home";
import Bedrooms from "./pages/Bedrooms";
import Kitchens from "./pages/Kitchens";
import InternalDoors from "./pages/InternalDoors";
import Flooring from "./pages/Flooring";
import MediaWalls from "./pages/MediaWalls";
import UnderStairStorage from "./pages/UnderStairStorage";
import UnifiedDashboard from "./pages/UnifiedDashboard";
import Designer from "./pages/Designer";
import NotFound from "./pages/NotFound";
import DevTools from "./pages/DevTools";
import GitManager from "./pages/GitManager";
import MediaManager from "./pages/MediaManager";
import BlogManager from "./pages/BlogManager";
import GalleryManager from "./pages/GalleryManager";
import ComponentManagerPage from "./pages/ComponentManagerPage";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import EggerBoards from "./pages/EggerBoards";
import Finishes from "./pages/Finishes";
import ProductPage from "./pages/ProductPage";
import DevToolsButton from "./components/DevToolsButton";
import { AuthProvider } from "./contexts/AuthContext";
import { ProjectProvider } from "./contexts/ProjectContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ProjectProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/app" element={<Index />} />
              <Route path="/bedrooms" element={<Bedrooms />} />
              <Route path="/kitchens" element={<Kitchens />} />
              <Route path="/internal-doors" element={<InternalDoors />} />
              <Route path="/flooring" element={<Flooring />} />
              <Route path="/media-walls" element={<MediaWalls />} />
              <Route path="/under-stair-storage" element={<UnderStairStorage />} />
              <Route path="/dashboard" element={<UnifiedDashboard />} />
              <Route path="/designer" element={<Designer />} />
              <Route path="/designer/:id" element={<Designer />} />
              <Route path="/projects" element={<Designer />} />
              <Route path="/projects/:projectId" element={<Designer />} />
              <Route path="/projects/:projectId/rooms/:roomId" element={<Designer />} />
              <Route path="/dev" element={<DevTools />} />
              <Route path="/dev/git" element={<GitManager />} />
              <Route path="/dev/media" element={<MediaManager />} />
              <Route path="/dev/blog" element={<BlogManager />} />
              <Route path="/dev/gallery" element={<GalleryManager />} />
              <Route path="/dev/components" element={<ComponentManagerPage />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/egger-boards" element={<EggerBoards />} />
              <Route path="/product/:decorId" element={<ProductPage />} />
              <Route path="/finishes" element={<Finishes />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <DevToolsButton />
          </BrowserRouter>
        </TooltipProvider>
      </ProjectProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
