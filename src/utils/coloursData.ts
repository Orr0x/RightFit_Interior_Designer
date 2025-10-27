import { Logger } from '@/utils/Logger';

export interface ColourFinish {
  name: string;
  number: string;
  product_url: string;
  thumb_url: string;
  hover_url: string;
  description: string;
  // Derived fields for easier processing
  colour_id: string;
  colour_name: string;
  colour_code: string;
  category: string;
}

export interface ColoursData {
  finishes: ColourFinish[];
  categories: string[];
  totalFinishes: number;
}

/**
 * Parse CSV data for Farrow & Ball colours
 * @param csvText Raw CSV text content
 * @returns Parsed colour finishes
 */
export function parseColoursCSV(csvText: string): ColoursData {
  const lines = csvText.split('\n').filter(line => line.trim());
  const finishes: ColourFinish[] = [];

  // Skip header line and process each data line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Use proper CSV parsing to handle quoted fields with commas
    const parsed = parseCSVLine(line);
    if (parsed.length < 6) continue;

    const name = parsed[0];
    const number = parsed[1];
    const product_url = parsed[2];
    const thumb_url = parsed[3];
    const hover_url = parsed[4];
    const description = parsed[5];

    if (!name || !thumb_url) continue;

    finishes.push({
      name,
      number,
      product_url,
      thumb_url,
      hover_url,
      description,
      // Derived fields
      colour_id: `${name.toLowerCase().replace(/\s+/g, '-')}-${number}`, // Use name-number as unique key
      colour_name: name,
      colour_code: number ? `#${number}` : `#${name.toLowerCase().replace(/\s+/g, '')}`, // Use number or generate from name
      category: 'Paint' // All seem to be paints from Farrow & Ball
    });
  }

  // Extract unique categories
  const categories = [...new Set(finishes.map(f => f.category))].sort();

  return {
    finishes,
    categories,
    totalFinishes: finishes.length
  };
}

/**
 * Parse a single CSV line handling quoted fields properly
 * @param line The CSV line to parse
 * @returns Array of parsed fields
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current);
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }

  // Add the last field
  result.push(current);

  return result;
}

/**
 * Generate thumbnail URL from original image URL
 */
export function getThumbnailUrl(imageUrl: string, size: 'small' | 'medium' = 'small'): string {
  // Use thumb_url if available, otherwise return the original image URL
  return imageUrl;
}

/**
 * Search finishes by query string
 */
export function searchFinishes(finishes: ColourFinish[], query: string): ColourFinish[] {
  if (!query.trim()) return finishes;

  const searchTerm = query.toLowerCase();
  return finishes.filter(finish =>
    finish.colour_name.toLowerCase().includes(searchTerm) ||
    finish.colour_id.toLowerCase().includes(searchTerm) ||
    finish.number.toLowerCase().includes(searchTerm) ||
    finish.name.toLowerCase().includes(searchTerm) ||
    finish.description.toLowerCase().includes(searchTerm)
  );
}

/**
 * Sort finishes by different criteria
 */
export function sortFinishes(finishes: ColourFinish[], sortBy: 'name' | 'number' | 'category'): ColourFinish[] {
  const sorted = [...finishes];

  switch (sortBy) {
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'number':
      return sorted.sort((a, b) => a.number.localeCompare(b.number));
    case 'category':
      return sorted.sort((a, b) => a.category.localeCompare(b.category));
    default:
      return sorted;
  }
}

/**
 * Load colours data from Supabase database
 * @returns Parsed colour finishes from database
 */
export async function loadColoursFromDatabase(): Promise<ColoursData> {
  try {
    // Import Supabase client here to avoid circular dependencies
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );

    Logger.debug('🔄 Loading Farrow & Ball finishes from database...');
    
    const { data, error } = await supabase
      .from('farrow_ball_finishes')
      .select('*')
      .order('color_name');

    if (error) {
      Logger.error('❌ Database error:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    if (!data || data.length === 0) {
      Logger.warn('⚠️ No finishes found in database');
      return { finishes: [], categories: [], totalFinishes: 0 };
    }

    Logger.debug(`✅ Loaded ${data.length} finishes from database`);

    // Transform database records to ColourFinish format
    const finishes: ColourFinish[] = data.map(record => ({
      name: record.color_name,
      number: record.color_number,
      product_url: record.product_url || '',
      thumb_url: record.thumb_url || '',
      hover_url: record.hover_url || '',
      description: record.description || '',
      // Derived fields
      colour_id: record.finish_id,
      colour_name: record.color_name,
      colour_code: record.color_number,
      category: 'Paint'
    }));

    // Filter out finishes without image URLs for now to see what's working
    const finishesWithImages = finishes.filter(f => f.thumb_url && f.hover_url);
    const finishesWithoutImages = finishes.filter(f => !f.thumb_url || !f.hover_url);

    Logger.debug(`🖼️ Finishes with images: ${finishesWithImages.length}`);
    Logger.debug(`⚠️ Finishes without images: ${finishesWithoutImages.length}`);

    // Extract unique categories
    const categories = [...new Set(finishes.map(f => f.category))].sort();

    return {
      finishes: finishes, // Return all finishes, not just those with images
      categories,
      totalFinishes: finishes.length
    };
  } catch (error) {
    Logger.error('❌ Error loading colours from database:', error);
    throw error;
  }
}
