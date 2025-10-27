/**
 * React Hooks for Room Geometry Templates
 *
 * Provides React hooks for loading and managing room geometry templates.
 *
 * Phase 2 of Complex Room Shapes Implementation
 */

import { useState, useEffect } from 'react';
import { RoomGeometryTemplate } from '@/types/RoomGeometry';
import { RoomService } from '@/services/RoomService';
import { Logger } from '@/utils/Logger';

// ============================================================================
// Hook: Load All Geometry Templates
// ============================================================================

interface UseRoomGeometryTemplatesResult {
  templates: RoomGeometryTemplate[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to load all room geometry templates
 *
 * @param activeOnly - Only load active templates (default: true)
 *
 * @example
 * ```tsx
 * const { templates, loading, error, refetch } = useRoomGeometryTemplates();
 *
 * if (loading) return <Spinner />;
 * if (error) return <Error message={error} />;
 *
 * return (
 *   <div>
 *     {templates.map(template => (
 *       <TemplateCard key={template.id} template={template} />
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useRoomGeometryTemplates(
  activeOnly = true
): UseRoomGeometryTemplatesResult {
  const [templates, setTemplates] = useState<RoomGeometryTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await RoomService.getRoomGeometryTemplates(activeOnly);
      setTemplates(data as RoomGeometryTemplate[]);
    } catch (err: any) {
      setError(err.message || 'Failed to load geometry templates');
      Logger.error('Error loading geometry templates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [activeOnly]);

  return {
    templates,
    loading,
    error,
    refetch: fetchTemplates
  };
}

// ============================================================================
// Hook: Load Single Template
// ============================================================================

interface UseRoomGeometryTemplateResult {
  template: RoomGeometryTemplate | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to load a single room geometry template by name
 *
 * @param templateName - Template identifier (e.g., 'l-shape-standard')
 *
 * @example
 * ```tsx
 * const { template, loading, error } = useRoomGeometryTemplate('l-shape-standard');
 *
 * if (loading) return <Spinner />;
 * if (error) return <Error message={error} />;
 * if (!template) return <NotFound />;
 *
 * return <TemplateDetails template={template} />;
 * ```
 */
export function useRoomGeometryTemplate(
  templateName: string | null
): UseRoomGeometryTemplateResult {
  const [template, setTemplate] = useState<RoomGeometryTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!templateName) {
      setTemplate(null);
      setLoading(false);
      return;
    }

    const fetchTemplate = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await RoomService.getGeometryTemplate(templateName);
        setTemplate(data as RoomGeometryTemplate);
      } catch (err: any) {
        setError(err.message || 'Failed to load template');
        Logger.error('Error loading template:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [templateName]);

  return { template, loading, error };
}

// ============================================================================
// Hook: Load Templates by Category
// ============================================================================

interface UseTemplatesByCategoryResult {
  templates: RoomGeometryTemplate[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to load templates filtered by category
 *
 * @param category - Template category ('standard', 'l-shape', 'u-shape', etc.)
 *
 * @example
 * ```tsx
 * const { templates, loading } = useTemplatesByCategory('l-shape');
 *
 * return (
 *   <div>
 *     <h2>L-Shaped Rooms</h2>
 *     {templates.map(template => (
 *       <TemplateCard key={template.id} template={template} />
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useTemplatesByCategory(
  category: string | null
): UseTemplatesByCategoryResult {
  const [templates, setTemplates] = useState<RoomGeometryTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = async () => {
    if (!category) {
      setTemplates([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await RoomService.getTemplatesByCategory(category);
      setTemplates(data as RoomGeometryTemplate[]);
    } catch (err: any) {
      setError(err.message || 'Failed to load templates');
      Logger.error('Error loading templates by category:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [category]);

  return {
    templates,
    loading,
    error,
    refetch: fetchTemplates
  };
}

// ============================================================================
// Hook: Apply Template to Room
// ============================================================================

interface UseApplyTemplateResult {
  applyTemplate: (
    roomId: string,
    templateName: string,
    parameters?: Record<string, number>
  ) => Promise<{ success: boolean; error?: string }>;
  applying: boolean;
  error: string | null;
}

/**
 * Hook to apply a geometry template to a room
 *
 * @example
 * ```tsx
 * const { applyTemplate, applying, error } = useApplyTemplate();
 *
 * const handleApply = async () => {
 *   const result = await applyTemplate(roomId, 'l-shape-standard', {
 *     width: 800,
 *     depth: 600
 *   });
 *
 *   if (result.success) {
 *     toast.success('Template applied!');
 *   } else {
 *     toast.error(result.error);
 *   }
 * };
 *
 * return (
 *   <button onClick={handleApply} disabled={applying}>
 *     {applying ? 'Applying...' : 'Apply Template'}
 *   </button>
 * );
 * ```
 */
export function useApplyTemplate(): UseApplyTemplateResult {
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyTemplate = async (
    roomId: string,
    templateName: string,
    parameters?: Record<string, number>
  ) => {
    try {
      setApplying(true);
      setError(null);
      const result = await RoomService.applyGeometryTemplate(roomId, templateName, parameters);
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to apply template');
      Logger.error('Error applying template:', err);
      return { success: false, error: err.message };
    } finally {
      setApplying(false);
    }
  };

  return {
    applyTemplate,
    applying,
    error
  };
}

// ============================================================================
// Hook: Load Room Geometry
// ============================================================================

interface UseRoomGeometryResult {
  geometry: any | null; // RoomGeometry type from database
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  clearGeometry: () => Promise<boolean>;
}

/**
 * Hook to load and manage room geometry
 *
 * @param roomId - Room design ID
 *
 * @example
 * ```tsx
 * const { geometry, loading, clearGeometry } = useRoomGeometry(roomId);
 *
 * if (loading) return <Spinner />;
 * if (!geometry) return <div>No geometry</div>;
 *
 * return (
 *   <div>
 *     <RoomVisualization geometry={geometry} />
 *     <button onClick={clearGeometry}>
 *       Clear Geometry (Revert to Rectangle)
 *     </button>
 *   </div>
 * );
 * ```
 */
export function useRoomGeometry(roomId: string | null): UseRoomGeometryResult {
  const [geometry, setGeometry] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGeometry = async () => {
    if (!roomId) {
      setGeometry(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await RoomService.getRoomGeometry(roomId);
      setGeometry(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load room geometry');
      Logger.error('Error loading room geometry:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearGeometry = async (): Promise<boolean> => {
    if (!roomId) return false;

    try {
      const success = await RoomService.clearRoomGeometry(roomId);
      if (success) {
        await fetchGeometry(); // Reload geometry
      }
      return success;
    } catch (err: any) {
      setError(err.message || 'Failed to clear geometry');
      Logger.error('Error clearing geometry:', err);
      return false;
    }
  };

  useEffect(() => {
    fetchGeometry();
  }, [roomId]);

  return {
    geometry,
    loading,
    error,
    refetch: fetchGeometry,
    clearGeometry
  };
}
