/**
 * MemoryManager - Handle memory cleanup and optimization
 * Manages Three.js resources, cache sizes, and component cleanup
 */

import * as THREE from 'three';

export class MemoryManager {
  private static instance: MemoryManager;
  private disposedObjects = new Set<string>();
  private memoryStats = {
    geometries: 0,
    materials: 0,
    textures: 0,
    totalMemoryMB: 0
  };

  private constructor() {}

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  /**
   * Dispose of Three.js geometries and materials to free memory
   */
  disposeThreeJSResources(scene?: THREE.Scene): void {
    if (!scene) {
      console.log('🧹 [MemoryManager] No scene provided for cleanup');
      return;
    }

    console.log('🧹 [MemoryManager] Starting Three.js resource cleanup...');
    
    const beforeStats = this.getMemoryStats();
    let disposedCount = 0;

    // Traverse scene and dispose of resources
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        // Dispose geometry
        if (object.geometry) {
          const geometryId = object.geometry.uuid;
          if (!this.disposedObjects.has(geometryId)) {
            object.geometry.dispose();
            this.disposedObjects.add(geometryId);
            disposedCount++;
          }
        }

        // Dispose materials
        if (object.material) {
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          
          materials.forEach((material) => {
            const materialId = material.uuid;
            if (!this.disposedObjects.has(materialId)) {
              // Dispose textures in material
              Object.values(material).forEach((value) => {
                if (value instanceof THREE.Texture) {
                  const textureId = value.uuid;
                  if (!this.disposedObjects.has(textureId)) {
                    value.dispose();
                    this.disposedObjects.add(textureId);
                  }
                }
              });
              
              material.dispose();
              this.disposedObjects.add(materialId);
              disposedCount++;
            }
          });
        }
      }
    });

    // Clear the scene
    while (scene.children.length > 0) {
      scene.remove(scene.children[0]);
    }

    const afterStats = this.getMemoryStats();
    
    console.log(`✅ [MemoryManager] Disposed ${disposedCount} Three.js resources`);
    console.log(`📊 [MemoryManager] Memory before: ${beforeStats.totalMemoryMB}MB, after: ${afterStats.totalMemoryMB}MB`);
  }

  /**
   * Clear component-related caches to free memory
   */
  clearComponentCaches(): void {
    console.log('🧹 [MemoryManager] Clearing component caches...');
    
    try {
      // Clear performance detection cache
      if (typeof window !== 'undefined' && window.localStorage) {
        const cacheKeys = Object.keys(localStorage).filter(key => 
          key.startsWith('performance-') || 
          key.startsWith('component-') ||
          key.startsWith('cache-')
        );
        
        cacheKeys.forEach(key => localStorage.removeItem(key));
        console.log(`🗑️ [MemoryManager] Cleared ${cacheKeys.length} cache entries`);
      }
    } catch (error) {
      console.warn('⚠️ [MemoryManager] Failed to clear caches:', error);
    }
  }

  /**
   * Monitor memory usage and trigger cleanup if needed
   */
  monitorMemoryUsage(): void {
    if (typeof window === 'undefined' || !('performance' in window)) {
      return;
    }

    const checkMemory = () => {
      const stats = this.getMemoryStats();
      
      // Trigger cleanup if memory usage is high
      if (stats.totalMemoryMB > 200) { // 200MB threshold
        console.warn(`⚠️ [MemoryManager] High memory usage detected: ${stats.totalMemoryMB}MB`);
        this.clearComponentCaches();
        
        // Force garbage collection if available (Chrome DevTools)
        if (typeof window !== 'undefined' && (window as any).gc) {
          (window as any).gc();
          console.log('🗑️ [MemoryManager] Forced garbage collection');
        }
      }
    };

    // Check memory every 30 seconds
    setInterval(checkMemory, 30000);
    
    console.log('👁️ [MemoryManager] Memory monitoring started');
  }

  /**
   * Get current memory statistics
   */
  getMemoryStats(): typeof this.memoryStats {
    let totalMemoryMB = 0;

    try {
      if (typeof window !== 'undefined' && 'performance' in window && (performance as any).memory) {
        const memory = (performance as any).memory;
        totalMemoryMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
      }
    } catch (error) {
      // Memory API not available
    }

    return {
      ...this.memoryStats,
      totalMemoryMB
    };
  }

  /**
   * Create cleanup function for React components
   */
  createCleanupFunction(cleanupTasks: (() => void)[]): () => void {
    return () => {
      console.log(`🧹 [MemoryManager] Running ${cleanupTasks.length} cleanup tasks`);
      
      cleanupTasks.forEach((task, index) => {
        try {
          task();
        } catch (error) {
          console.error(`❌ [MemoryManager] Cleanup task ${index} failed:`, error);
        }
      });
    };
  }

  /**
   * Optimize images and textures for memory usage
   */
  optimizeImageMemory(canvas: HTMLCanvasElement, maxWidth = 1024, maxHeight = 1024): HTMLCanvasElement {
    const { width, height } = canvas;
    
    // Skip optimization if already small enough
    if (width <= maxWidth && height <= maxHeight) {
      return canvas;
    }

    // Calculate new dimensions maintaining aspect ratio
    const aspectRatio = width / height;
    let newWidth = maxWidth;
    let newHeight = maxHeight;

    if (aspectRatio > 1) {
      newHeight = maxWidth / aspectRatio;
    } else {
      newWidth = maxHeight * aspectRatio;
    }

    // Create optimized canvas
    const optimizedCanvas = document.createElement('canvas');
    optimizedCanvas.width = newWidth;
    optimizedCanvas.height = newHeight;

    const ctx = optimizedCanvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(canvas, 0, 0, newWidth, newHeight);
    }

    console.log(`🖼️ [MemoryManager] Optimized image: ${width}x${height} → ${newWidth}x${newHeight}`);
    
    return optimizedCanvas;
  }

  /**
   * Set up automatic cleanup for page unload
   */
  setupAutomaticCleanup(): void {
    if (typeof window === 'undefined') return;

    const cleanup = () => {
      console.log('🧹 [MemoryManager] Page unload cleanup...');
      this.clearComponentCaches();
    };

    window.addEventListener('beforeunload', cleanup);
    window.addEventListener('unload', cleanup);
    
    // Cleanup on visibility change (tab switch)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        console.log('🧹 [MemoryManager] Tab hidden, running cleanup...');
        this.clearComponentCaches();
      }
    });

    console.log('🔧 [MemoryManager] Automatic cleanup listeners registered');
  }
}

// Export singleton instance
export const memoryManager = MemoryManager.getInstance();
