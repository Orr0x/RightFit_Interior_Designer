import { createClient } from '@supabase/supabase-js';
import { Database } from '../integrations/supabase/types';

const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// TypeScript interfaces matching the database schema
export interface FarrowBallFinish {
  id: string;
  finish_id: string;
  color_name: string;
  color_number: string;
  product_url: string;
  title: string;
  description: string;
  main_color_rgb: string;
  main_color_hex: string;
  recommended_primer: any;
  complementary_color: any;
  key_features: string[];
  available_finishes: string[];
  room_categories: string[];
  price_info: any;
  availability: any;
  thumb_url?: string;
  hover_url?: string;
  created_at: string;
  updated_at: string;
}

export interface FarrowBallColorScheme {
  id: string;
  finish_id: string;
  rgb: string;
  hex: string;
  color_type: "base" | "accent" | "trim";
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

export interface FarrowBallFinishWithDetails extends FarrowBallFinish {
  farrow_ball_color_schemes: FarrowBallColorScheme[];
  farrow_ball_images: FarrowBallImage[];
}

class FarrowBallDataService {
  async getAllFinishes(): Promise<FarrowBallFinish[]> {
    try {
      const { data, error } = await supabase
        .from("farrow_ball_finishes")
        .select("*")
        .order("color_name");

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching Farrow & Ball finishes:", error);
      throw error;
    }
  }

  async getFinishById(finishId: string): Promise<FarrowBallFinishWithDetails | null> {
    try {
      const { data: finishData, error: finishError } = await supabase
        .from("farrow_ball_finishes")
        .select("*")
        .eq("finish_id", finishId)
        .single();

      if (finishError) throw finishError;
      if (!finishData) return null;

      const { data: schemesData, error: schemesError } = await supabase
        .from("farrow_ball_color_schemes")
        .select("*")
        .eq("finish_id", finishId)
        .order("color_type");

      if (schemesError) throw schemesError;

      const { data: imagesData, error: imagesError } = await supabase
        .from("farrow_ball_images")
        .select("*")
        .eq("finish_id", finishId)
        .order("image_order");

      if (imagesError) throw imagesError;

      return {
        ...finishData,
        farrow_ball_color_schemes: schemesData || [],
        farrow_ball_images: imagesData || []
      };
    } catch (error) {
      console.error(`Error fetching Farrow & Ball finish ${finishId}:`, error);
      throw error;
    }
  }
}

export const farrowBallDataService = new FarrowBallDataService();
