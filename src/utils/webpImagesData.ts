export interface WebPImageData {
  decor_id: string;
  decor_name: string;
  decor: string;
  texture: string;
  product_page_url: string;
  image_url: string;
  fileType: string;
  uniqueKey: string;
}

export interface WebPDecorGroup {
  decor_id: string;
  decor_name: string;
  decor: string;
  texture: string;
  product_page_url: string;
  images: WebPImageData[];
  categories: string[];
  totalImages: number;
}

/**
 * Parse CSV data for WebP images and combine with board images grouped by decor_id
 * @param webpCsvText Raw WebP CSV text content
 * @param boardsCsvText Raw Boards CSV text content
 * @returns Grouped decor data with multiple images per decor
 */
export function parseWebPImagesCSV(webpCsvText: string, boardsCsvText?: string): { decors: WebPDecorGroup[], categories: string[], totalDecors: number } {
  const imageData: WebPImageData[] = [];

  // Parse WebP CSV data
  const webpLines = webpCsvText.split('\n').filter(line => line.trim());
  for (let i = 1; i < webpLines.length; i++) {
    const line = webpLines[i].trim();
    if (!line) continue;

    const parsed = parseCSVLine(line);
    if (parsed.length < 8) continue;

    const [decor_id, decor_name, decor, texture, product_page_url, image_url, fileType, uniqueKey] = parsed;

    if (!decor_id || !image_url) continue;

    imageData.push({
      decor_id,
      decor_name,
      decor,
      texture,
      product_page_url,
      image_url,
      fileType,
      uniqueKey
    });
  }

  // Parse Boards CSV data if provided
  if (boardsCsvText) {
    const boardLines = boardsCsvText.split('\n').filter(line => line.trim());
    for (let i = 1; i < boardLines.length; i++) {
      const line = boardLines[i].trim();
      if (!line) continue;

      const parsed = parseCSVLine(line);
      if (parsed.length < 7) continue;

      const [decor_id, decor_name, decor, texture, product_page_url, image_url, fileType] = parsed;

      if (!decor_id || !image_url) continue;

      // Check if this image is already in the WebP data
      const alreadyExists = imageData.some(img =>
        img.decor_id === decor_id && img.image_url === image_url
      );

      if (!alreadyExists) {
        imageData.push({
          decor_id,
          decor_name,
          decor,
          texture,
          product_page_url,
          image_url,
          fileType: fileType || 'png',
          uniqueKey: `${decor_id}${image_url}`
        });
      }
    }
  }

  // Group by decor_id
  const decorGroups = new Map<string, WebPImageData[]>();

  imageData.forEach(image => {
    if (!decorGroups.has(image.decor_id)) {
      decorGroups.set(image.decor_id, []);
    }
    decorGroups.get(image.decor_id)!.push(image);
  });

  // Convert to array of decor groups
  const decors: WebPDecorGroup[] = Array.from(decorGroups.entries()).map(([decor_id, images]) => {
    // Get unique categories from the decor codes
    const categories = [...new Set(images.map(img => img.decor))].sort();

    return {
      decor_id,
      decor_name: images[0].decor_name,
      decor: images[0].decor,
      texture: images[0].texture,
      product_page_url: images[0].product_page_url,
      images: images.sort((a, b) => {
        // Sort images: prefer 1024px width, then AR_16_9 aspect ratio
        const getScore = (img: WebPImageData) => {
          let score = 0;
          if (img.image_url.includes('width=1024')) score += 100;
          if (img.image_url.includes('AR_16_9')) score += 50;
          if (img.image_url.includes('AR_4_3')) score += 25;
          return score;
        };

        return getScore(b) - getScore(a);
      }),
      categories,
      totalImages: images.length
    };
  });

  // Extract unique categories from all decors
  const allCategories = [...new Set(decors.flatMap(decor => decor.categories))].sort();

  return {
    decors: decors.sort((a, b) => a.decor_name.localeCompare(b.decor_name)),
    categories: allCategories,
    totalDecors: decors.length
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
 * Search decors by query string
 */
export function searchWebPDecors(decors: WebPDecorGroup[], query: string): WebPDecorGroup[] {
  if (!query.trim()) return decors;

  const searchTerm = query.toLowerCase();
  return decors.filter(decor =>
    decor.decor_name.toLowerCase().includes(searchTerm) ||
    decor.decor_id.toLowerCase().includes(searchTerm) ||
    decor.decor.toLowerCase().includes(searchTerm) ||
    decor.texture.toLowerCase().includes(searchTerm)
  );
}

/**
 * Sort decors by different criteria
 */
export function sortWebPDecors(decors: WebPDecorGroup[], sortBy: 'name' | 'id' | 'category' | 'imageCount'): WebPDecorGroup[] {
  const sorted = [...decors];

  switch (sortBy) {
    case 'name':
      return sorted.sort((a, b) => a.decor_name.localeCompare(b.decor_name));
    case 'id':
      return sorted.sort((a, b) => a.decor_id.localeCompare(b.decor_id));
    case 'category':
      return sorted.sort((a, b) => a.decor.localeCompare(b.decor));
    case 'imageCount':
      return sorted.sort((a, b) => b.totalImages - a.totalImages);
    default:
      return sorted;
  }
}
