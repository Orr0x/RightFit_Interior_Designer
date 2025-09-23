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
      colour_id: number,
      colour_name: name,
      colour_code: `#${number}`, // Using number as color code for now
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
