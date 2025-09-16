/**
 * PerformanceDetector - Auto-detect device capabilities for adaptive 3D rendering
 * Provides performance detection and quality recommendations
 */

export interface DeviceCapabilities {
  gpuTier: 'high' | 'medium' | 'low';
  memoryGB: number;
  webglVersion: number;
  maxTextureSize: number;
  supportsWebGL2: boolean;
  isMobile: boolean;
  recommendedQuality: RenderQuality;
}

export interface RenderQuality {
  level: 'high' | 'medium' | 'low';
  shadows: boolean;
  shadowMapSize: number;
  antialias: boolean;
  environmentLighting: boolean;
  textureQuality: 'high' | 'medium' | 'low';
  modelDetail: 'high' | 'medium' | 'low';
  maxElements: number;
}

export class PerformanceDetector {
  private static instance: PerformanceDetector;
  private capabilities: DeviceCapabilities | null = null;
  private frameRateMonitor: FrameRateMonitor;

  private constructor() {
    this.frameRateMonitor = new FrameRateMonitor();
  }

  static getInstance(): PerformanceDetector {
    if (!PerformanceDetector.instance) {
      PerformanceDetector.instance = new PerformanceDetector();
    }
    return PerformanceDetector.instance;
  }

  /**
   * Detect device capabilities and recommend quality settings
   */
  async detectCapabilities(): Promise<DeviceCapabilities> {
    if (this.capabilities) {
      return this.capabilities;
    }

    console.log('🔍 [PerformanceDetector] Analyzing device capabilities...');

    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    
    if (!gl) {
      console.warn('⚠️ [PerformanceDetector] WebGL not supported, using low quality');
      this.capabilities = this.createLowQualityProfile();
      return this.capabilities;
    }

    // Detect GPU info
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const gpuRenderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : '';
    
    // Detect WebGL capabilities
    const webglVersion = gl instanceof WebGL2RenderingContext ? 2 : 1;
    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    
    // Estimate memory (rough approximation)
    const memoryGB = this.estimateDeviceMemory();
    
    // Detect mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Classify GPU tier
    const gpuTier = this.classifyGPU(gpuRenderer, isMobile);
    
    // Generate quality recommendation
    const recommendedQuality = this.generateQualityRecommendation(gpuTier, memoryGB, isMobile);

    this.capabilities = {
      gpuTier,
      memoryGB,
      webglVersion,
      maxTextureSize,
      supportsWebGL2: webglVersion === 2,
      isMobile,
      recommendedQuality
    };

    console.log('✅ [PerformanceDetector] Device analysis complete:', this.capabilities);
    return this.capabilities;
  }

  /**
   * Monitor frame rate and adjust quality if needed
   */
  startFrameRateMonitoring(onQualityAdjust: (newQuality: RenderQuality) => void): void {
    this.frameRateMonitor.start((avgFPS: number) => {
      if (!this.capabilities) return;

      // If FPS drops below 30, recommend lower quality
      if (avgFPS < 30 && this.capabilities.recommendedQuality.level !== 'low') {
        console.log(`⚡ [PerformanceDetector] Low FPS detected (${avgFPS.toFixed(1)}), recommending quality reduction`);
        
        const newQuality = this.getNextLowerQuality(this.capabilities.recommendedQuality);
        this.capabilities.recommendedQuality = newQuality;
        onQualityAdjust(newQuality);
      }
      // If FPS is good (>50) and we're on low quality, we could increase
      else if (avgFPS > 50 && this.capabilities.recommendedQuality.level === 'low') {
        console.log(`🚀 [PerformanceDetector] Good FPS detected (${avgFPS.toFixed(1)}), could increase quality`);
        
        const newQuality = this.getNextHigherQuality(this.capabilities.recommendedQuality);
        this.capabilities.recommendedQuality = newQuality;
        onQualityAdjust(newQuality);
      }
    });
  }

  stopFrameRateMonitoring(): void {
    this.frameRateMonitor.stop();
  }

  /**
   * Get quality settings for manual override
   */
  getQualityPresets(): Record<string, RenderQuality> {
    return {
      high: {
        level: 'high',
        shadows: true,
        shadowMapSize: 2048,
        antialias: true,
        environmentLighting: true,
        textureQuality: 'high',
        modelDetail: 'high',
        maxElements: 100
      },
      medium: {
        level: 'medium',
        shadows: true,
        shadowMapSize: 1024,
        antialias: true,
        environmentLighting: true,
        textureQuality: 'medium',
        modelDetail: 'medium',
        maxElements: 50
      },
      low: {
        level: 'low',
        shadows: false,
        shadowMapSize: 512,
        antialias: false,
        environmentLighting: false,
        textureQuality: 'low',
        modelDetail: 'low',
        maxElements: 25
      }
    };
  }

  private classifyGPU(renderer: string, isMobile: boolean): 'high' | 'medium' | 'low' {
    const rendererLower = renderer.toLowerCase();
    
    if (isMobile) {
      // Mobile GPU classification
      if (rendererLower.includes('adreno 6') || rendererLower.includes('mali-g7') || rendererLower.includes('apple a1')) {
        return 'medium';
      }
      return 'low';
    }

    // Desktop GPU classification
    if (rendererLower.includes('nvidia') || rendererLower.includes('geforce')) {
      if (rendererLower.includes('rtx') || rendererLower.includes('gtx 16') || rendererLower.includes('gtx 20')) {
        return 'high';
      }
      if (rendererLower.includes('gtx')) {
        return 'medium';
      }
    }

    if (rendererLower.includes('radeon') || rendererLower.includes('amd')) {
      if (rendererLower.includes('rx 6') || rendererLower.includes('rx 7') || rendererLower.includes('vega')) {
        return 'high';
      }
      if (rendererLower.includes('rx')) {
        return 'medium';
      }
    }

    if (rendererLower.includes('intel')) {
      if (rendererLower.includes('iris') || rendererLower.includes('xe')) {
        return 'medium';
      }
      return 'low'; // Intel integrated graphics
    }

    return 'medium'; // Default fallback
  }

  private estimateDeviceMemory(): number {
    // Try to get actual memory info (Chrome only)
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      return Math.round(memInfo.jsHeapSizeLimit / (1024 * 1024 * 1024)); // Convert to GB
    }

    // Fallback estimation based on device type
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      return 4; // Assume 4GB for mobile
    }

    return 8; // Assume 8GB for desktop
  }

  private generateQualityRecommendation(gpuTier: 'high' | 'medium' | 'low', memoryGB: number, isMobile: boolean): RenderQuality {
    const presets = this.getQualityPresets();

    if (gpuTier === 'high' && memoryGB >= 8 && !isMobile) {
      return presets.high;
    }
    
    if (gpuTier === 'medium' || (gpuTier === 'high' && isMobile)) {
      return presets.medium;
    }

    return presets.low;
  }

  private createLowQualityProfile(): DeviceCapabilities {
    return {
      gpuTier: 'low',
      memoryGB: 4,
      webglVersion: 1,
      maxTextureSize: 2048,
      supportsWebGL2: false,
      isMobile: true,
      recommendedQuality: this.getQualityPresets().low
    };
  }

  private getNextLowerQuality(current: RenderQuality): RenderQuality {
    const presets = this.getQualityPresets();
    
    if (current.level === 'high') return presets.medium;
    if (current.level === 'medium') return presets.low;
    return presets.low;
  }

  private getNextHigherQuality(current: RenderQuality): RenderQuality {
    const presets = this.getQualityPresets();
    
    if (current.level === 'low') return presets.medium;
    if (current.level === 'medium') return presets.high;
    return presets.high;
  }
}

/**
 * Frame Rate Monitor - Track rendering performance
 */
class FrameRateMonitor {
  private isRunning = false;
  private frameCount = 0;
  private startTime = 0;
  private animationId: number | null = null;
  private callback: ((fps: number) => void) | null = null;

  start(callback: (fps: number) => void): void {
    this.callback = callback;
    this.isRunning = true;
    this.frameCount = 0;
    this.startTime = performance.now();
    
    this.tick();
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  private tick = (): void => {
    if (!this.isRunning) return;

    this.frameCount++;
    const currentTime = performance.now();
    const elapsed = currentTime - this.startTime;

    // Calculate FPS every 2 seconds
    if (elapsed >= 2000) {
      const fps = (this.frameCount * 1000) / elapsed;
      
      if (this.callback) {
        this.callback(fps);
      }

      // Reset for next measurement
      this.frameCount = 0;
      this.startTime = currentTime;
    }

    this.animationId = requestAnimationFrame(this.tick);
  };
}

// Export singleton instance
export const performanceDetector = PerformanceDetector.getInstance();
