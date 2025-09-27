// Enhanced EGGER data service for Supabase integration
import { createClient } from '@supabase/supabase-js';
import { Database } from '../integrations/supabase/types';

const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export interface EggerDecor {
  id: string;
  decor_id: string;
  decor_name: string;
  decor: string;
  texture: string;
  product_page_url: string | null;
  description: string | null;
  category: string | null;
  color_family: string | null;
  finish_type: string | null;
  supplier_notes: string | null;
  cost_per_sqm: number | null;
  created_at: string;
  updated_at: string;
}

export interface EggerCombination {
  id: string;
  decor_id: string;
  recommended_decor_id: string;
  match_type: 'color' | 'texture' | 'style' | 'complementary';
  confidence_score: number | null;
  notes: string | null;
  created_at: string;
}

export interface EggerAvailability {
  id: string;
  decor_id: string;
  product_type: string;
  availability_status: 'in_stock' | 'limited' | 'out_of_stock' | 'discontinued';
  lead_time_days: number;
  minimum_order_quantity: number | null;
  region: string | null;
  last_updated: string;
  created_at: string;
}

export interface EggerImage {
  id: string;
  decor_id: string;
  image_url: string;
  image_type: 'webp' | 'png' | 'jpg' | 'jpeg' | null;
  width: number | null;
  height: number | null;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
}

export interface EggerInteriorMatch {
  id: string;
  decor_id: string;
  interior_style: string;
  room_types: string[];
  color_palette: string[];
  design_notes: string | null;
  created_at: string;
}

export interface EggerCategory {
  id: string;
  name: string;
  description: string | null;
  color_hex: string | null;
  created_at: string;
}

export interface EggerTexture {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface EggerColorFamily {
  id: string;
  name: string;
  color_hex: string | null;
  description: string | null;
  created_at: string;
}

export interface EnhancedEggerProduct extends EggerDecor {
  images: EggerImage[];
  combinations: EggerCombination[];
  availability: EggerAvailability[];
  interior_match?: EggerInteriorMatch;
  has_combinations: boolean;
  combination_count: number;
  recommended_products: EggerDecor[];
}

export interface EggerSearchFilters {
  search?: string;
  category?: string;
  texture?: string;
  color_family?: string;
  has_combinations?: boolean;
  availability_status?: string;
  price_min?: number;
  price_max?: number;
}

export interface EggerSearchResult {
  data: EnhancedEggerProduct[];
  total: number;
  page: number;
  totalPages: number;
}

export class EggerDataService {
  private static instance: EggerDataService;
  
  static getInstance(): EggerDataService {
    if (!EggerDataService.instance) {
      EggerDataService.instance = new EggerDataService();
    }
    return EggerDataService.instance;
  }

  // Get all decors with pagination and filtering
  async getDecors(page = 1, limit = 20, filters: EggerSearchFilters = {}): Promise<EggerSearchResult> {
    try {
      let query = supabase
        .from('egger_decors')
        .select('*', { count: 'exact' })
        .order('decor_name');

      // Apply filters
      if (filters.search) {
        query = query.or(`decor_name.ilike.%${filters.search}%,decor_id.ilike.%${filters.search}%,decor.ilike.%${filters.search}%`);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.texture) {
        query = query.eq('texture', filters.texture);
      }
      if (filters.color_family) {
        query = query.eq('color_family', filters.color_family);
      }
      if (filters.price_min !== undefined) {
        query = query.gte('cost_per_sqm', filters.price_min);
      }
      if (filters.price_max !== undefined) {
        query = query.lte('cost_per_sqm', filters.price_max);
      }

      const { data, error, count } = await query
        .range((page - 1) * limit, page * limit - 1)
        .limit(limit);

      if (error) throw error;

      // Get enhanced data for each product
      const enhancedProducts = await Promise.all(
        (data || []).map(async (decor) => {
          return await this.getEnhancedProduct(decor.decor_id);
        })
      );

      // Filter by combinations if needed
      let filteredProducts = enhancedProducts.filter(Boolean) as EnhancedEggerProduct[];
      if (filters.has_combinations !== undefined) {
        filteredProducts = filteredProducts.filter(p => p.has_combinations === filters.has_combinations);
      }

      return {
        data: filteredProducts,
        total: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit)
      };

    } catch (error) {
      console.error('Error fetching decors:', error);
      throw error;
    }
  }

  // Get enhanced product with all relationships
  async getEnhancedProduct(decorId: string): Promise<EnhancedEggerProduct | null> {
    try {
      // Get main decor
      const { data: decor, error: decorError } = await supabase
        .from('egger_decors')
        .select('*')
        .eq('decor_id', decorId)
        .single();

      if (decorError || !decor) return null;

      // Get related data in parallel
      const [imagesResult, combinationsResult, availabilityResult, interiorMatchResult] = await Promise.all([
        supabase.from('egger_images').select('*').eq('decor_id', decorId).order('sort_order'),
        supabase.from('egger_combinations').select('*').eq('decor_id', decorId),
        supabase.from('egger_availability').select('*').eq('decor_id', decorId),
        supabase.from('egger_interior_matches').select('*').eq('decor_id', decorId).single()
      ]);

      // Get recommended products
      const recommendedDecorIds = combinationsResult.data?.map(c => c.recommended_decor_id) || [];
      let recommendedProducts: EggerDecor[] = [];
      if (recommendedDecorIds.length > 0) {
        const { data: recommendedData } = await supabase
          .from('egger_decors')
          .select('*')
          .in('decor_id', recommendedDecorIds);
        recommendedProducts = recommendedData || [];
      }

      return {
        ...decor,
        images: imagesResult.data || [],
        combinations: combinationsResult.data || [],
        availability: availabilityResult.data || [],
        interior_match: interiorMatchResult.data || undefined,
        has_combinations: (combinationsResult.data?.length || 0) > 0,
        combination_count: combinationsResult.data?.length || 0,
        recommended_products: recommendedProducts
      };

    } catch (error) {
      console.error('Error fetching enhanced product:', error);
      return null;
    }
  }

  // Get all categories
  async getCategories(): Promise<EggerCategory[]> {
    try {
      const { data, error } = await supabase
        .from('egger_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  // Get all textures
  async getTextures(): Promise<EggerTexture[]> {
    try {
      const { data, error } = await supabase
        .from('egger_textures')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching textures:', error);
      return [];
    }
  }

  // Get all color families
  async getColorFamilies(): Promise<EggerColorFamily[]> {
    try {
      const { data, error } = await supabase
        .from('egger_color_families')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching color families:', error);
      return [];
    }
  }

  // Search products
  async searchProducts(query: string, limit = 20): Promise<EggerDecor[]> {
    try {
      const { data, error } = await supabase
        .from('egger_decors')
        .select('*')
        .or(`decor_name.ilike.%${query}%,decor_id.ilike.%${query}%,decor.ilike.%${query}%`)
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  }

  // Get combinations for a decor
  async getCombinations(decorId: string): Promise<EggerCombination[]> {
    try {
      const { data, error } = await supabase
        .from('egger_combinations')
        .select('*')
        .eq('decor_id', decorId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching combinations:', error);
      return [];
    }
  }

  // Get availability for a decor
  async getAvailability(decorId: string): Promise<EggerAvailability[]> {
    try {
      const { data, error } = await supabase
        .from('egger_availability')
        .select('*')
        .eq('decor_id', decorId)
        .order('product_type');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching availability:', error);
      return [];
    }
  }

  // Get interior match for a decor
  async getInteriorMatch(decorId: string): Promise<EggerInteriorMatch | null> {
    try {
      const { data, error } = await supabase
        .from('egger_interior_matches')
        .select('*')
        .eq('decor_id', decorId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      return data || null;
    } catch (error) {
      console.error('Error fetching interior match:', error);
      return null;
    }
  }

  // Get images for a decor
  async getImages(decorId: string): Promise<EggerImage[]> {
    try {
      const { data, error } = await supabase
        .from('egger_images')
        .select('*')
        .eq('decor_id', decorId)
        .order('sort_order');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching images:', error);
      return [];
    }
  }

  // Get statistics
  async getStatistics(): Promise<{
    totalDecors: number;
    totalImages: number;
    totalCombinations: number;
    categoriesCount: number;
    texturesCount: number;
  }> {
    try {
      const [decorCount, imageCount, combinationCount, categoryCount, textureCount] = await Promise.all([
        supabase.from('egger_decors').select('*', { count: 'exact', head: true }),
        supabase.from('egger_images').select('*', { count: 'exact', head: true }),
        supabase.from('egger_combinations').select('*', { count: 'exact', head: true }),
        supabase.from('egger_categories').select('*', { count: 'exact', head: true }),
        supabase.from('egger_textures').select('*', { count: 'exact', head: true })
      ]);

      return {
        totalDecors: decorCount.count || 0,
        totalImages: imageCount.count || 0,
        totalCombinations: combinationCount.count || 0,
        categoriesCount: categoryCount.count || 0,
        texturesCount: textureCount.count || 0
      };
    } catch (error) {
      console.error('Error fetching statistics:', error);
      return {
        totalDecors: 0,
        totalImages: 0,
        totalCombinations: 0,
        categoriesCount: 0,
        texturesCount: 0
      };
    }
  }
}

export const eggerDataService = EggerDataService.getInstance();
