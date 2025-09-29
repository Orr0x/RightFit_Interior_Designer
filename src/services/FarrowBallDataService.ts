// Farrow & Ball data service for Supabase integration
import { createClient } from '@supabase/supabase-js';
import { Database } from '../integrations/supabase/types';

const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export interface FarrowBallFinish {
  id: string;
  finish_id: string;
  color_name: string;
  color_number: string;
  product_url: string | null;
  title: string | null;
  description: string | null;
  main_color_rgb: string | null;
  main_color_hex: string | null;
  recommended_primer: string | null;
  complementary_color: string | null;
  key_features: string[] | null;
  available_finishes: string[] | null;
  room_categories: string[] | null;
  price_info: string | null;
  availability: string | null;
  created_at: string;
  updated_at: string;
}

export interface FarrowBallColorScheme {
  id: string;
  finish_id: string;
  rgb: string;
  hex: string;
  color_type: string;
  created_at: string;
}

export interface FarrowBallImage {
  id: string;
  finish_id: string;
  image_url: string;
  image_type: string;
  image_order: number;
  is_main_image: boolean;
  created_at: string;
}

export interface FarrowBallCategory {
  id: string;
  category_name: string;
  description: string | null;
  created_at: string;
}

export interface FarrowBallColorFamily {
  id: string;
  family_name: string;
  description: string | null;
  created_at: string;
}

export interface FarrowBallFinishWithDetails extends FarrowBallFinish {
  color_schemes: FarrowBallColorScheme[];
  images: FarrowBallImage[];
}

export interface FarrowBallDataResult {
  data: FarrowBallFinishWithDetails[];
  total: number;
  page: number;
  limit: number;
}

class FarrowBallDataService {
  /**
   * Get all finishes with pagination
   */
  async getFinishes(page: number = 1, limit: number = 20): Promise<FarrowBallDataResult> {
    try {
      const offset = (page - 1) * limit;
      
      // Get total count
      const { count, error: countError } = await supabase
        .from('farrow_ball_finishes')
        .select('*', { count: 'exact', head: true });

      if (countError) throw countError;

      // Get finishes with related data
      const { data: finishes, error: finishesError } = await supabase
        .from('farrow_ball_finishes')
        .select(`
          *,
          farrow_ball_color_schemes (*),
          farrow_ball_images (*)
        `)
        .order('color_name')
        .range(offset, offset + limit - 1);

      if (finishesError) throw finishesError;

      return {
        data: finishes as FarrowBallFinishWithDetails[],
        total: count || 0,
        page,
        limit
      };
    } catch (error) {
      console.error('Error fetching Farrow & Ball finishes:', error);
      throw error;
    }
  }

  /**
   * Get a single finish by finish_id
   */
  async getFinishById(finishId: string): Promise<FarrowBallFinishWithDetails | null> {
    try {
      const { data, error } = await supabase
        .from('farrow_ball_finishes')
        .select(`
          *,
          farrow_ball_color_schemes (*),
          farrow_ball_images (*)
        `)
        .eq('finish_id', finishId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw error;
      }

      return data as FarrowBallFinishWithDetails;
    } catch (error) {
      console.error('Error fetching Farrow & Ball finish:', error);
      throw error;
    }
  }

  /**
   * Search finishes by query
   */
  async searchFinishes(query: string, page: number = 1, limit: number = 20): Promise<FarrowBallDataResult> {
    try {
      const offset = (page - 1) * limit;
      const searchTerm = `%${query}%`;

      // Get total count
      const { count, error: countError } = await supabase
        .from('farrow_ball_finishes')
        .select('*', { count: 'exact', head: true })
        .or(`color_name.ilike.${searchTerm},color_number.ilike.${searchTerm},description.ilike.${searchTerm}`);

      if (countError) throw countError;

      // Get finishes with related data
      const { data: finishes, error: finishesError } = await supabase
        .from('farrow_ball_finishes')
        .select(`
          *,
          farrow_ball_color_schemes (*),
          farrow_ball_images (*)
        `)
        .or(`color_name.ilike.${searchTerm},color_number.ilike.${searchTerm},description.ilike.${searchTerm}`)
        .order('color_name')
        .range(offset, offset + limit - 1);

      if (finishesError) throw finishesError;

      return {
        data: finishes as FarrowBallFinishWithDetails[],
        total: count || 0,
        page,
        limit
      };
    } catch (error) {
      console.error('Error searching Farrow & Ball finishes:', error);
      throw error;
    }
  }

  /**
   * Get finishes by category
   */
  async getFinishesByCategory(category: string, page: number = 1, limit: number = 20): Promise<FarrowBallDataResult> {
    try {
      const offset = (page - 1) * limit;

      // Get total count
      const { count, error: countError } = await supabase
        .from('farrow_ball_finishes')
        .select('*', { count: 'exact', head: true })
        .contains('room_categories', [category]);

      if (countError) throw countError;

      // Get finishes with related data
      const { data: finishes, error: finishesError } = await supabase
        .from('farrow_ball_finishes')
        .select(`
          *,
          farrow_ball_color_schemes (*),
          farrow_ball_images (*)
        `)
        .contains('room_categories', [category])
        .order('color_name')
        .range(offset, offset + limit - 1);

      if (finishesError) throw finishesError;

      return {
        data: finishes as FarrowBallFinishWithDetails[],
        total: count || 0,
        page,
        limit
      };
    } catch (error) {
      console.error('Error fetching Farrow & Ball finishes by category:', error);
      throw error;
    }
  }

  /**
   * Get all categories
   */
  async getCategories(): Promise<FarrowBallCategory[]> {
    try {
      const { data, error } = await supabase
        .from('farrow_ball_categories')
        .select('*')
        .order('category_name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching Farrow & Ball categories:', error);
      throw error;
    }
  }

  /**
   * Get all color families
   */
  async getColorFamilies(): Promise<FarrowBallColorFamily[]> {
    try {
      const { data, error } = await supabase
        .from('farrow_ball_color_families')
        .select('*')
        .order('family_name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching Farrow & Ball color families:', error);
      throw error;
    }
  }

  /**
   * Import finish data from scraped data
   */
  async importFinish(finishData: any): Promise<FarrowBallFinish> {
    try {
      const { data, error } = await supabase
        .from('farrow_ball_finishes')
        .insert([finishData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error importing Farrow & Ball finish:', error);
      throw error;
    }
  }

  /**
   * Import color scheme data
   */
  async importColorScheme(schemeData: any): Promise<FarrowBallColorScheme> {
    try {
      const { data, error } = await supabase
        .from('farrow_ball_color_schemes')
        .insert([schemeData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error importing Farrow & Ball color scheme:', error);
      throw error;
    }
  }

  /**
   * Import image data
   */
  async importImage(imageData: any): Promise<FarrowBallImage> {
    try {
      const { data, error } = await supabase
        .from('farrow_ball_images')
        .insert([imageData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error importing Farrow & Ball image:', error);
      throw error;
    }
  }

  /**
   * Clear all data (for reimport)
   */
  async clearAllData(): Promise<void> {
    try {
      // Delete in order due to foreign key constraints
      await supabase.from('farrow_ball_images').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('farrow_ball_color_schemes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('farrow_ball_finishes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('farrow_ball_categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('farrow_ball_color_families').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    } catch (error) {
      console.error('Error clearing Farrow & Ball data:', error);
      throw error;
    }
  }
}

export const farrowBallDataService = new FarrowBallDataService();
