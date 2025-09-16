import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  base: '/',
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'esbuild',
    sourcemap: false,
    chunkSizeWarningLimit: 1000, // Increase warning limit for large chunks
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React ecosystem
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor';
          }
          
          // Three.js ecosystem (will be lazy loaded)
          if (id.includes('three') || id.includes('@react-three/')) {
            return 'three-engine';
          }
          
          // Supabase (can be lazy loaded for auth)
          if (id.includes('@supabase/') || id.includes('supabase')) {
            return 'supabase';
          }
          
          // UI components (Radix, Lucide)
          if (id.includes('@radix-ui/') || id.includes('lucide-react')) {
            return 'ui-components';
          }
          
          // Router
          if (id.includes('react-router')) {
            return 'router';
          }
          
          // Forms and validation
          if (id.includes('react-hook-form') || id.includes('zod') || id.includes('@hookform/')) {
            return 'forms';
          }
          
          // Charts and data visualization
          if (id.includes('recharts') || id.includes('date-fns')) {
            return 'charts';
          }
          
          // Query and state management
          if (id.includes('@tanstack/react-query')) {
            return 'query';
          }
          
          // Other vendor libraries
          if (id.includes('node_modules/')) {
            return 'vendor';
          }
        },
      },
    },
  },
});