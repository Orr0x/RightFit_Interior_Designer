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
    chunkSizeWarningLimit: 1000,
    // Remove debugger statements in production
    esbuildOptions: {
      drop: ['debugger'], // Drop debugger statements
      // Note: Logger has built-in environment checks
      // debug/info/warn are no-ops in production
      // error still works for production error tracking
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // CRITICAL FIX: Keep React and Three.js together
          // This prevents the useLayoutEffect undefined error
          
          // Supabase (separate chunk)
          if (id.includes('@supabase/') || id.includes('supabase')) {
            return 'supabase';
          }
          
          // UI components (separate chunk)
          if (id.includes('@radix-ui/') || id.includes('lucide-react')) {
            return 'ui-components';
          }
          
          // Charts (separate chunk)
          if (id.includes('recharts') || id.includes('date-fns')) {
            return 'charts';
          }
          
          // Query (separate chunk)
          if (id.includes('@tanstack/react-query')) {
            return 'query';
          }
          
          // EVERYTHING ELSE (React, Three.js, vendor) stays together
          // This ensures React hooks are available to Three.js
          if (id.includes('node_modules/')) {
            return 'vendor';
          }
        },
      },
    },
  },
});
