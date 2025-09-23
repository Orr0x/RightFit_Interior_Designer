export interface EggerBoardProduct {
  decor_id: string;
  decor_name: string;
  decor: string;
  texture: string;
  product_page_url: string;
  images: string[];
}

export interface EggerBoardsData {
  products: EggerBoardProduct[];
  textures: string[];
  decorCategories: string[];
}

/**
 * Parse CSV data and group EGGER board products by decor_id
 * @param csvText Raw CSV text content
 * @returns Parsed and grouped EGGER board products
 */
export function parseEggerBoardsCSV(csvText: string): EggerBoardsData {
  const lines = csvText.split('\n').filter(line => line.trim());
  const productsMap = new Map<string, EggerBoardProduct>();

  // Skip header line and process each data line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const [decor_id, decor_name, decor, texture, product_page_url, image_url] = line.split(',');

    if (!decor_id || !image_url) continue;

    if (productsMap.has(decor_id)) {
      // Add additional image to existing product
      productsMap.get(decor_id)!.images.push(image_url);
    } else {
      // Create new product entry
      productsMap.set(decor_id, {
        decor_id,
        decor_name,
        decor,
        texture,
        product_page_url,
        images: [image_url]
      });
    }
  }

  const products = Array.from(productsMap.values());

  // Extract unique textures and create categories
  const textures = [...new Set(products.map(p => p.texture))].sort();
  const decorCategories = extractDecorCategories(products);

  return {
    products,
    textures,
    decorCategories
  };
}

/**
 * Extract decorative categories from product names for filtering
 */
function extractDecorCategories(products: EggerBoardProduct[]): string[] {
  const categories = new Set<string>();

  products.forEach(product => {
    const name = product.decor_name.toLowerCase();

    // Common material types
    if (name.includes('marble')) categories.add('Marble');
    if (name.includes('granite')) categories.add('Granite');
    if (name.includes('concrete')) categories.add('Concrete');
    if (name.includes('slate')) categories.add('Slate');
    if (name.includes('stone')) categories.add('Stone');
    if (name.includes('metal')) categories.add('Metal');
    if (name.includes('wood')) categories.add('Wood');
    if (name.includes('textile')) categories.add('Textile');
    if (name.includes('linen')) categories.add('Linen');
    if (name.includes('fabric')) categories.add('Fabric');

    // Color families
    if (name.includes('grey') || name.includes('gray')) categories.add('Grey/Gray');
    if (name.includes('white')) categories.add('White');
    if (name.includes('black')) categories.add('Black');
    if (name.includes('anthracite')) categories.add('Anthracite');
    if (name.includes('beige')) categories.add('Beige');
    if (name.includes('brown')) categories.add('Brown');
    if (name.includes('bronze')) categories.add('Bronze');
  });

  return Array.from(categories).sort();
}

/**
 * Generate thumbnail URL from original image URL (if EGGER CDN supports it)
 */
export function getThumbnailUrl(imageUrl: string, size: 'small' | 'medium' = 'small'): string {
  // EGGER CDN might support size parameters, but we'll use the original for now
  // In a production environment, you might want to add image optimization
  return imageUrl;
}

/**
 * Search products by query string
 */
export function searchProducts(products: EggerBoardProduct[], query: string): EggerBoardProduct[] {
  if (!query.trim()) return products;

  const searchTerm = query.toLowerCase();
  return products.filter(product =>
    product.decor_name.toLowerCase().includes(searchTerm) ||
    product.decor_id.toLowerCase().includes(searchTerm) ||
    product.decor.toLowerCase().includes(searchTerm)
  );
}

/**
 * Sort products by different criteria
 */
export function sortProducts(products: EggerBoardProduct[], sortBy: 'name' | 'id' | 'texture'): EggerBoardProduct[] {
  const sorted = [...products];

  switch (sortBy) {
    case 'name':
      return sorted.sort((a, b) => a.decor_name.localeCompare(b.decor_name));
    case 'id':
      return sorted.sort((a, b) => a.decor_id.localeCompare(b.decor_id));
    case 'texture':
      return sorted.sort((a, b) => a.texture.localeCompare(b.texture));
    default:
      return sorted;
  }
}

/**
 * Filter products by categories and textures
 */
export function filterProducts(
  products: EggerBoardProduct[],
  selectedCategories: string[],
  selectedTextures: string[]
): EggerBoardProduct[] {
  let filtered = products;

  // Filter by categories
  if (selectedCategories.length > 0) {
    filtered = filtered.filter(product => {
      const name = product.decor_name.toLowerCase();
      return selectedCategories.some(category => {
        switch (category.toLowerCase()) {
          case 'marble':
            return name.includes('marble');
          case 'granite':
            return name.includes('granite');
          case 'concrete':
            return name.includes('concrete');
          case 'slate':
            return name.includes('slate');
          case 'stone':
            return name.includes('stone');
          case 'metal':
            return name.includes('metal');
          case 'wood':
            return name.includes('wood');
          case 'textile':
            return name.includes('textile') || name.includes('linen') || name.includes('fabric');
          case 'grey/gray':
            return name.includes('grey') || name.includes('gray');
          case 'white':
            return name.includes('white');
          case 'black':
            return name.includes('black');
          case 'anthracite':
            return name.includes('anthracite');
          case 'beige':
            return name.includes('beige');
          case 'brown':
            return name.includes('brown');
          case 'bronze':
            return name.includes('bronze');
          default:
            return false;
        }
      });
    });
  }

  // Filter by textures
  if (selectedTextures.length > 0) {
    filtered = filtered.filter(product =>
      selectedTextures.includes(product.texture)
    );
  }

  return filtered;
}
