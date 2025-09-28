import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import rightfitLogo from '@/assets/logo.png';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ImageViewer } from '../components/ui/Image3DViewer';
import {
  ArrowLeft,
  Download,
  ExternalLink,
  Ruler,
  Clock,
  Star,
  Users,
  DollarSign,
  Package,
  Palette,
  Info,
  CheckCircle,
  Eye
} from 'lucide-react';
import { eggerDataService, EnhancedEggerProduct } from '../services/EggerDataService';

interface ProductImage {
  id: string;
  url: string;
  type: 'webp' | 'png';
  width?: number;
  height?: number;
  aspectRatio?: string;
  isMain?: boolean;
}

export default function ProductPage() {
  const { decorId } = useParams<{ decorId: string }>();
  const [productData, setProductData] = useState<EnhancedEggerProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);


  // Navigation scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      setIsNavVisible(currentY <= lastScrollY);
      setLastScrollY(currentY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Load product data from database
  useEffect(() => {
    const loadProductData = async () => {
      if (!decorId) return;

      try {
        setLoading(true);
        setError(null);

        // Try database first
        try {
          console.log('🔄 [ProductPage] Loading product data from DATABASE...');
          console.log('🔍 [ProductPage] Looking for decor_id:', decorId);
          const enhancedProduct = await eggerDataService.getEnhancedProduct(decorId);
          
          if (enhancedProduct) {
            console.log('✅ [ProductPage] DATABASE data loaded successfully');
            console.log('📊 [ProductPage] Product data structure:', {
              decor_name: enhancedProduct.decor_name,
              decor_id: enhancedProduct.decor_id,
              decor: enhancedProduct.decor,
              texture: enhancedProduct.texture,
              category: enhancedProduct.category,
              description: enhancedProduct.description,
              color_family: enhancedProduct.color_family,
              finish_type: enhancedProduct.finish_type,
              cost_per_sqm: enhancedProduct.cost_per_sqm,
              colour_character_text: enhancedProduct.colour_character_text,
              colour_character_title: enhancedProduct.colour_character_title,
              images: enhancedProduct.images?.length || 0,
              combinations: enhancedProduct.combinations?.length || 0,
              availability: enhancedProduct.availability?.length || 0,
              interior_match: !!enhancedProduct.interior_match,
              has_combinations: enhancedProduct.has_combinations,
              combination_count: enhancedProduct.combination_count
            });
            console.log('🎯 [ProductPage] DATA SOURCE: DATABASE (Supabase)');
            setProductData(enhancedProduct);
            setLoading(false);
            return;
          } else {
            console.log('⚠️ [ProductPage] No product found in database for decor_id:', decorId);
          }
        } catch (dbError) {
          console.warn('⚠️ [ProductPage] Database not available, falling back to CSV:', dbError);
        }

        // Fallback to CSV data
        console.log('🔄 [ProductPage] Loading product data from CSV FILES...');
        console.log('🎯 [ProductPage] DATA SOURCE: CSV (Fallback)');
        const [webpResponse, boardsResponse] = await Promise.all([
          fetch('/webp-images.csv'),
          fetch('/Boards.csv')
        ]);

        let webpText = '';
        let boardsText = '';

        if (webpResponse.ok) {
          webpText = await webpResponse.text();
        } else {
          throw new Error('Failed to load WebP data');
        }

        if (boardsResponse.ok) {
          boardsText = await boardsResponse.text();
        }

        // Parse and combine data
        const combinedData = parseProductData(webpText, boardsText, decorId);
        setProductData(combinedData);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product data');
        console.error('Error loading product data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProductData();
  }, [decorId]);

  // Parse and combine WebP and board data for specific decor_id
  const parseProductData = (webpText: string, boardsText: string, targetDecorId: string): ProductData | null => {
    const images: ProductImage[] = [];
    let productDecorName = '';
    let productDecor = '';
    let productTexture = '';

    // Parse WebP images using the same logic as the main gallery
    const webpLines = webpText.split('\n').filter(line => line.trim());
    for (let i = 1; i < webpLines.length; i++) {
      const line = webpLines[i].trim();
      if (!line) continue;

      const parsed = parseCSVLine(line);
      if (parsed.length < 8) continue;

      const [decor_id, decor_name, decor, texture, product_page_url, image_url, fileType, uniqueKey] = parsed;

      if (decor_id === targetDecorId) {
        // Store the product details from the first matching record
        if (!productDecorName) {
          productDecorName = decor_name;
          productDecor = decor;
          productTexture = texture;
        }

        images.push({
          id: `webp-${uniqueKey}`,
          url: image_url,
          type: 'webp',
          aspectRatio: image_url.includes('AR_16_9') ? '16:9' : '4:3'
        });
      }
    }

    // Parse Boards CSV data if provided
    if (boardsText) {
      const boardLines = boardsText.split('\n').filter(line => line.trim());
      for (let i = 1; i < boardLines.length; i++) {
        const line = boardLines[i].trim();
        if (!line) continue;

        const parsed = parseCSVLine(line);
        if (parsed.length < 7) continue;

        const [decor_id, decor_name, decor, texture, product_page_url, image_url, fileType] = parsed;

        if (decor_id === targetDecorId) {
          // Store the product details from the first matching record if not already set
          if (!productDecorName) {
            productDecorName = decor_name;
            productDecor = decor;
            productTexture = texture;
          }

          // Check if this image is already in the WebP data
          const alreadyExists = images.some(img => img.url === image_url);

          if (!alreadyExists) {
            images.push({
              id: `board-${decor_id}-${i}`,
              url: image_url,
              type: 'png',
              aspectRatio: '16:9'
            });
          }
        }
      }
    }

    if (images.length === 0) return null;

    // Mark first image as main
    images[0].isMain = true;

    return {
      decor_id: targetDecorId,
      decor_name: productDecorName || 'Premium Material',
      decor: productDecor || 'Premium',
      texture: productTexture || 'Premium',
      product_page_url: `https://www.egger.com/en/furniture-interior-design/decors/${targetDecorId.toLowerCase().replace(' ', '_')}`,
      images: images.slice(0, 10), // Limit to 10 images max
      totalImages: images.length,
      categories: ['Premium Materials', 'Interior Design', 'Furniture']
    };
  };

  // Helper function to parse CSV lines (same as in webpImagesData.ts)
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i += 2;
        } else {
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }

    result.push(current);
    return result;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Loading Product Details</h2>
          <p className="text-gray-600">Preparing your material showcase...</p>
        </div>
      </div>
    );
  }

  if (error || !productData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-6xl mb-4">🏠</div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Product Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The requested material could not be found.'}</p>
          <Link to="/egger-boards" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2 inline" />
            Back to Gallery
          </Link>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 transition-transform duration-300 ${
        isNavVisible ? 'translate-y-0' : '-translate-y-full'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/egger-boards" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Gallery</span>
            </Link>
            <div className="flex items-center space-x-4">
              <span className="font-medium text-gray-700">{productData.decor_name}</span>
              <Badge variant="outline" className="hidden sm:inline-flex">
                {productData.decor_id}
              </Badge>
            </div>
          </div>
        </div>
      </nav>

       {/* Hero Section - EGGER Style */}
       <section className="pt-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           {/* Breadcrumb */}
           <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-8">
             <Link to="/egger-boards" className="hover:text-gray-700">Furniture / Interior Design</Link>
             <span>›</span>
             <span className="text-red-600">{productData.decor_name}</span>
           </nav>

           {/* Product Title */}
           <div className="mb-8">
             <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-2">
               {productData.decor_id} {productData.decor_name}
             </h1>
           </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex space-x-8">
            <button className="border-b-2 border-red-600 text-red-600 pb-4 px-1 font-medium">
              Board
            </button>
            <button className="text-gray-500 hover:text-gray-700 pb-4 px-1">
              Decor
            </button>
            <button className="text-gray-500 hover:text-gray-700 pb-4 px-1">
              3D view
            </button>
          </nav>
        </div>

           {/* Main Content */}
           <div className="grid lg:grid-cols-2 gap-12 mb-16">
             {/* Image Viewer with EGGER Board/Decor Images */}
            <div className="relative">
              {productData.images && productData.images.length > 0 ? (
                <div className="space-y-4">
                  {/* Board Image - Real EGGER URL */}
                  <div className="aspect-[16/9] bg-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={(() => {
                        const boardImageUrl = `https://cdn.egger.com/img/pim/8854503653406/8860179202078/AR_16_9.webp?width=1024&srcext=png`;
                        console.log('🔍 [ProductPage] Board image URL (EGGER):', boardImageUrl);
                        return boardImageUrl;
                      })()}
                      alt={`${productData.decor_name} board view`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.log('❌ [ProductPage] EGGER board image failed to load, using fallback');
                        e.currentTarget.src = productData.images[0].image_url || productData.images[0].url;
                      }}
                    />
                    <div className="absolute top-4 left-4 bg-white bg-opacity-90 px-3 py-1 rounded-full text-sm font-medium text-gray-800">
                      Board
                    </div>
                  </div>
                  
                  {/* Decor Image - Real EGGER URL */}
                  <div className="aspect-[16/9] bg-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={(() => {
                        const decorImageUrl = `https://cdn.egger.com/img/pim/8854503522334/8860179103774/AR_16_9.webp?width=1024&srcext=png`;
                        console.log('🔍 [ProductPage] Decor image URL (EGGER):', decorImageUrl);
                        return decorImageUrl;
                      })()}
                      alt={`${productData.decor_name} decor view`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.log('❌ [ProductPage] EGGER decor image failed to load, using fallback');
                        e.currentTarget.src = productData.images[0].image_url || productData.images[0].url;
                      }}
                    />
                    <div className="absolute top-4 left-4 bg-white bg-opacity-90 px-3 py-1 rounded-full text-sm font-medium text-gray-800">
                      Decor
                    </div>
                  </div>
                </div>
              ) : (
                <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-gray-400 mb-4 text-4xl">📷</div>
                    <p className="text-gray-600">No board images available</p>
                  </div>
                </div>
              )}
            </div>

             {/* Product Info - EGGER Style */}
            <div className="space-y-8">
               {/* Availability Section - Real Data Only */}
               {productData.availability && Array.isArray(productData.availability) && productData.availability.length > 0 && (
                 <div>
                   <div className="flex items-center mb-4">
                     <Clock className="w-5 h-5 text-green-600 mr-2" />
                     <h3 className="text-lg font-semibold text-gray-800">Available Product Types</h3>
                   </div>
                   <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                     {(() => {
                       console.log('🔍 [ProductPage] Availability data source:', productData.availability);
                       return productData.availability.map((item, index) => (
                         <div key={index} className="bg-white border border-gray-200 p-4 rounded-lg text-center">
                           <div className="w-12 h-12 mx-auto mb-3 bg-green-100 rounded-full flex items-center justify-center">
                             {item.product_type === 'Decorative Faced Boards' && '🔲'}
                             {item.product_type === 'Edging' && '📏'}
                             {item.product_type === 'Laminates' && '📋'}
                             {item.product_type === 'Worktops' && '🔳'}
                             {!['Decorative Faced Boards', 'Edging', 'Laminates', 'Worktops'].includes(item.product_type) && '📦'}
                           </div>
                           <div className="text-sm font-medium text-gray-900 mb-2">
                             {item.product_type}
                           </div>
                           <div className="flex justify-center">
                             <div className="w-3 h-3 rounded-full bg-green-500" />
                           </div>
                         </div>
                       ));
                     })()}
                   </div>
                 </div>
               )}

               {/* Recommended Matches - EGGER Style */}
               {productData.combinations && Array.isArray(productData.combinations) && productData.combinations.length > 0 && (
              <div>
                   <div className="flex items-center mb-4">
                     <Star className="w-5 h-5 text-purple-600 mr-2" />
                     <h3 className="text-lg font-semibold text-gray-800">Recommended Matches</h3>
                   </div>
                   <div className="space-y-3">
                     {productData.combinations.map((combo, index) => (
                       <div key={index} className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                         <div className="flex items-center justify-between mb-2">
                           <div className="font-medium text-gray-900">{combo.recommended_decor_id}</div>
                           <div className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                             {combo.match_type} ({Math.round(combo.confidence_score * 100)}%)
                           </div>
                         </div>
                         <div className="text-sm text-gray-600">
                           {combo.notes || 'Complementary decor for enhanced design harmony'}
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               )}

               {/* Action Button */}
               <div className="flex justify-center">
                 <Button
                   size="lg"
                   variant="outline"
                   className="border-red-600 text-red-600 hover:bg-red-50 px-8"
                   onClick={() => window.open(productData.product_page_url, '_blank')}
                 >
                   <ExternalLink className="w-5 h-5 mr-2" />
                   View on EGGER
                 </Button>
               </div>
             </div>
           </div>
                </div>
       </section>

       {/* Character Section - EGGER Style */}
       <section className="py-16 bg-gray-50">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="grid lg:grid-cols-2 gap-12 items-center">
             <div>
               <h2 className="text-3xl font-bold text-gray-900 mb-6">
                 {productData.colour_character_title || 'Colour and character'}
               </h2>
               <div className="prose prose-lg text-gray-700">
                 <p className="text-lg leading-relaxed">
                   {(() => {
                     console.log('🔍 [ProductPage] Character text data source:', {
                       colour_character_text: productData.colour_character_text ? 'DATABASE' : 'FALLBACK',
                       description: productData.description ? 'DATABASE' : 'FALLBACK',
                       text_content: productData.colour_character_text || productData.description
                     });
                     return productData.colour_character_text || productData.description || 
                     `${productData.decor_name} recreates a ${productData.texture} surface. In interior design, this character is perfect for the design of large wall surfaces, whilst in furniture design, it is often used for frontals and carcasses. The ${productData.texture} texture provides both aesthetic appeal and practical durability.`;
                   })()}
                 </p>
               </div>
             </div>

             {/* Character Image - Real URL */}
             <div className="relative">
               {productData.images && productData.images.length > 0 ? (
                 <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                   <img 
                     src={(() => {
                       const imageUrl = productData.images[0].image_url || productData.images[0].url;
                       console.log('🔍 [ProductPage] Character image URL:', imageUrl);
                       return imageUrl;
                     })()}
                     alt={`${productData.decor_name} character view`}
                     className="w-full h-full object-cover"
                     onError={(e) => {
                       console.log('❌ [ProductPage] Image failed to load:', e.currentTarget.src);
                       e.currentTarget.src = 'https://via.placeholder.com/400x400?text=No+Image';
                     }}
                   />
                 </div>
               ) : (
                 <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                   <span className="text-gray-400">No Character Image Available</span>
                 </div>
               )}
               <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm">
                 Visualize your ideas in the RightFit-Interior Design Suite
               </div>
             </div>
           </div>
         </div>
       </section>

      {/* Interior Match Section - Only if real data exists */}
      {productData.interior_match && productData.interior_match.interior_style && (
        <section className="py-16 bg-white">
          {(() => {
            console.log('🔍 [ProductPage] Interior Match data source:', productData.interior_match);
            return null;
          })()}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="relative">
                <div className="aspect-[4/3] bg-gradient-to-br from-amber-100 to-orange-200 rounded-lg overflow-hidden">
                  {productData.images && productData.images.length > 1 ? (
                    <img 
                      src={(() => {
                        const imageUrl = productData.images[1].image_url || productData.images[1].url;
                        console.log('🔍 [ProductPage] Interior Match image URL:', imageUrl);
                        return imageUrl;
                      })()}
                      alt="Interior Match Example"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.log('❌ [ProductPage] Interior Match image failed to load');
                        e.currentTarget.src = productData.images[0].image_url || productData.images[0].url;
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-amber-100 to-orange-200 flex items-center justify-center">
                      <div className="text-gray-600 text-4xl font-light">Interior MATCH</div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                    <div className="text-white text-6xl font-light">Interior MATCH</div>
                  </div>
                </div>
              </div>
              
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  Interior Match: Created for harmonious designs
                </h2>
                <div className="prose prose-lg text-gray-700 mb-8">
                  <p className="text-lg leading-relaxed">
                    {productData.interior_match.design_notes || 
                    'With the Interior Match, you benefit from coordinated combination options for furniture and flooring. The decor package includes same-decor and colour-coordinated flooring as well as furniture and interior design products. This allows you to create coordinated modern designs.'}
                  </p>
                </div>
                
                {(productData.interior_match.interior_style || productData.interior_match.room_types) && (
                  <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {productData.interior_match.interior_style && (
                        <div>
                          <span className="text-gray-600">Interior Style:</span>
                          <div className="font-medium text-gray-900">{productData.interior_match.interior_style}</div>
                        </div>
                      )}
                      {productData.interior_match.room_types && (
                        <div>
                          <span className="text-gray-600">Room Types:</span>
                          <div className="font-medium text-gray-900">
                            {Array.isArray(productData.interior_match.room_types) 
                              ? productData.interior_match.room_types.join(', ')
                              : productData.interior_match.room_types}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Removed download flyer button as requested */}
              </div>
            </div>
          </div>
        </section>
      )}

       {/* Combinations Section - EGGER Style */}
       {productData.combinations && Array.isArray(productData.combinations) && productData.combinations.length > 0 && (
         <section className="py-16 bg-gray-50">
           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
             <div className="mb-12">
               <h2 className="text-3xl font-bold text-gray-900 mb-4">
                 Decor and combination recommendations
               </h2>
               <p className="text-lg text-gray-600">
                 Our recommendations for matching decors
               </p>
             </div>

           {/* Large Sample Image - Real URL */}
           <div className="relative mb-12">
             {productData.images && productData.images.length > 0 ? (
               <div className="aspect-[16/10] bg-gray-200 rounded-lg overflow-hidden">
                 <img 
                   src={(() => {
                     const imageUrl = productData.images[0].image_url || productData.images[0].url;
                     console.log('🔍 [ProductPage] Large sample image URL:', imageUrl);
                     return imageUrl;
                   })()}
                   alt={`${productData.decor_name} large sample`}
                   className="w-full h-full object-cover"
                   onError={(e) => {
                     console.log('❌ [ProductPage] Large sample image failed to load');
                     e.currentTarget.src = 'https://via.placeholder.com/800/600?text=No+Sample+Image';
                   }}
                 />
               </div>
             ) : (
               <div className="aspect-[16/10] bg-gray-200 rounded-lg flex items-center justify-center">
                 <span className="text-gray-400 text-xl">No Sample Image Available</span>
               </div>
             )}
           </div>

           {/* Decor Combinations - Real Data */}
           <div className="mb-12">
             <div className="border-b border-gray-200 mb-8">
               <button className="border-b-2 border-red-600 text-red-600 pb-2 px-1 font-medium">
                 Decors ({productData.combinations.length})
               </button>
             </div>

             <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
               {(() => {
                 console.log('🔍 [ProductPage] Combinations data source:', productData.combinations);
                 return productData.combinations.map((combo, index) => (
                   <Link 
                     key={index} 
                     to={`/product/${encodeURIComponent(combo.recommended_decor_id)}`}
                     className="text-center group hover:scale-105 transition-transform duration-200"
                   >
                     <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-3 overflow-hidden group-hover:shadow-lg transition-shadow">
                       {productData.images && productData.images.length > 0 ? (
                         <img 
                           src={(() => {
                             const imageUrl = productData.images[0].image_url || productData.images[0].url;
                             console.log('🔍 [ProductPage] Combination image URL for', combo.recommended_decor_id, ':', imageUrl);
                             return imageUrl;
                           })()}
                           alt={combo.recommended_decor_id}
                           className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                           onError={(e) => {
                             console.log('❌ [ProductPage] Combination image failed to load for', combo.recommended_decor_id);
                             e.currentTarget.style.display = 'none';
                           }}
                         />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center text-gray-400 group-hover:text-gray-600">
                           {combo.recommended_decor_id.split(' ')[0]}
                         </div>
                       )}
                     </div>
                     <div className="text-sm font-medium text-gray-900 mb-1 group-hover:text-red-600 transition-colors">
                       {combo.recommended_decor_id.includes(' ') 
                         ? combo.recommended_decor_id.split(' ')[0] 
                         : combo.recommended_decor_id}
                     </div>
                     <div className="text-xs text-gray-600">
                       {combo.recommended_decor_id}
                     </div>
                     {combo.match_type && (
                       <div className="text-xs text-blue-600 mt-1">
                         {combo.match_type} ({Math.round((combo.confidence_score || 0.8) * 100)}%)
                       </div>
                     )}
                   </Link>
                 ));
               })()}
             </div>
           </div>

           {/* Availability Section - Real Data Only with Preferred Style */}
           {productData.availability && Array.isArray(productData.availability) && productData.availability.length > 0 && (
             <div>
               <h3 className="text-2xl font-bold text-gray-900 mb-8">
                 Availability Decorative Collection
               </h3>
               
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                 {(() => {
                   console.log('🔍 [ProductPage] Bottom availability data source:', productData.availability);
                   return productData.availability.map((item, index) => (
                     <div key={index} className="text-center">
                       <div className="w-16 h-16 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                         {item.product_type === 'Decorative Faced Boards' && '🔲'}
                         {item.product_type === 'Edging' && '📏'}
                         {item.product_type === 'Laminates' && '📋'}
                         {item.product_type === 'Worktops' && '🔳'}
                         {item.product_type === 'Compact Laminate' && '📐'}
                         {item.product_type === 'Upstands' && '📐'}
                         {!['Decorative Faced Boards', 'Edging', 'Laminates', 'Worktops', 'Compact Laminate', 'Upstands'].includes(item.product_type) && '📦'}
                       </div>
                       <div className="text-sm font-medium text-gray-900 mb-1">
                         {item.product_type}
                       </div>
                       <div className="flex justify-center mb-2">
                         <div className="w-3 h-3 rounded-full bg-green-500" />
                       </div>
                       <div className="text-xs text-gray-600">
                         Available
                       </div>
                     </div>
                   ));
                 })()}
               </div>
             </div>
           )}
           </div>
         </section>
       )}

       {/* Gallery Images Section */}
       <section className="py-16 bg-gray-50">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="text-center mb-12">
             <h2 className="text-3xl font-bold text-gray-900 mb-4">Gallery Images</h2>
             <p className="text-xl text-gray-600 max-w-3xl mx-auto">
               Additional images showcasing the {productData.decor} {productData.texture} material
               in various views. Perfect for comprehensive product exploration.
             </p>
           </div>

           {/* Gallery Images - Additional Views */}
           <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
             {productData.images && productData.images.length > 0 ? (
               <ImageViewer images={productData.images.map(img => ({
                 id: img.id || `img-${Math.random()}`,
                 url: img.image_url || img.url,
                 type: img.image_type || img.type || 'webp',
                 width: img.width,
                 height: img.height,
                 aspectRatio: img.aspectRatio,
                 isMain: img.is_primary || img.isMain || false
               }))} />
             ) : (
               <div className="text-center py-12">
                 <div className="text-gray-400 mb-4">📷</div>
                 <p className="text-gray-600">No gallery images available</p>
               </div>
             )}
           </div>
         </div>
       </section>

      {/* Product Details Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Specifications */}
            <div className="lg:col-span-2">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Product Specifications</h2>

              <div className="prose prose-lg max-w-none">
                <div className="grid md:grid-cols-2 gap-8 mb-12">
                  <div>
                    <h3 className="text-xl font-semibold mb-4 text-gray-800">Technical Details</h3>
                    <ul className="space-y-3 text-gray-600">
                      <li className="flex items-center">
                        <Ruler className="w-5 h-5 mr-3 text-blue-600" />
                        <span>Standard dimensions available</span>
                      </li>
                      <li className="flex items-center">
                        <Ruler className="w-5 h-5 mr-3 text-blue-600" />
                        <span>Multiple thickness options</span>
                      </li>
                      <li className="flex items-center">
                        <Ruler className="w-5 h-5 mr-3 text-blue-600" />
                        <span>Premium surface finish</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-4 text-gray-800">Applications</h3>
                    <ul className="space-y-3 text-gray-600">
                      <li>• Kitchen cabinetry and furniture</li>
                      <li>• Interior design projects</li>
                      <li>• Commercial installations</li>
                      <li>• Residential renovations</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-8 mb-12">
                  <h3 className="text-xl font-semibold mb-4 text-gray-800">Why Choose This Material?</h3>
                  <p className="text-gray-700 leading-relaxed">
                    This premium {productData.decor} material offers exceptional quality and versatility for your design projects.
                    The {productData.texture} texture provides both aesthetic appeal and practical durability, making it
                    ideal for high-traffic areas and design-focused applications.
                  </p>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Product Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Decor ID:</span>
                    <span className="font-mono text-sm">{productData.decor_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium">{productData.decor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Texture:</span>
                    <span className="font-medium">{productData.texture}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Images:</span>
                    <span className="font-medium">{productData.totalImages} available</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {(productData.categories || ['Premium Materials', 'Interior Design', 'Furniture']).map((category, index) => (
                      <Badge key={index} variant="secondary" className="text-sm">
                        {category}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-6">
                <h3 className="font-semibold text-gray-800 mb-3">Ready to Transform Your Space?</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Contact our design experts for personalized recommendations and project planning.
                </p>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Get Expert Consultation
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <img src={rightfitLogo} alt="RightFit" className="h-8 w-auto" />
                <span className="font-bold text-xl">RightFit</span>
              </div>
              <p className="text-gray-300">
                Professional interior design solutions with cutting-edge material technology.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Services</h3>
              <ul className="space-y-2 text-gray-300">
                <li><Link to="/bedrooms" className="hover:text-white">Bedrooms</Link></li>
                <li><Link to="/kitchens" className="hover:text-white">Kitchens</Link></li>
                <li><Link to="/internal-doors" className="hover:text-white">Internal Doors</Link></li>
                <li><Link to="/flooring" className="hover:text-white">Flooring</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-gray-300">
                <li><Link to="/egger-boards" className="hover:text-white">Materials & Finishes</Link></li>
                <li><Link to="/finishes" className="hover:text-white">Color Finishes</Link></li>
                <li><Link to="/blog" className="hover:text-white">Blog</Link></li>
                <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-300">
                <li><Link to="/about" className="hover:text-white">About</Link></li>
                <li><Link to="/portfolio" className="hover:text-white">Portfolio</Link></li>
                <li><Link to="/careers" className="hover:text-white">Careers</Link></li>
                <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 RightFit Interiors. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
