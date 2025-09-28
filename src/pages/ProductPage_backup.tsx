import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import rightfitLogo from '@/assets/logo.png';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  ArrowLeft,
  ExternalLink,
  Ruler,
  Clock,
  Star,
  Package,
  Palette,
  Info,
  CheckCircle,
  Eye,
  Download,
  Copy
} from 'lucide-react';
import { eggerDataService, EnhancedEggerProduct } from '../services/EggerDataService';

export default function ProductPageEnhanced() {
  const { decorId } = useParams<{ decorId: string }>();
  const [productData, setProductData] = useState<EnhancedEggerProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Navigation scroll effect
  useEffect(() => {
    const controlNavbar = () => {
      if (typeof window !== 'undefined') {
        if (window.scrollY > lastScrollY && window.scrollY > 100) {
          setIsNavVisible(false);
        } else {
          setIsNavVisible(true);
        }
        setLastScrollY(window.scrollY);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', controlNavbar);
      return () => {
        window.removeEventListener('scroll', controlNavbar);
      };
    }
  }, [lastScrollY]);

  useEffect(() => {
    const loadProductData = async () => {
      if (!decorId) return;
      try {
        setLoading(true);
        setError(null);

        // console.log('🔄 [ProductPage] Loading EGGER product data...');
        // console.log('🔍 [ProductPage] Looking for decor_id:', decorId);
        
        const enhancedProduct = await eggerDataService.getEnhancedProduct(decorId);
        
        if (enhancedProduct) {
          // console.log('✅ [ProductPage] Real EGGER data loaded successfully');
          // console.log('📊 [ProductPage] Data completeness:', {
          //   basic_info: '100%',
          //   images: enhancedProduct.images?.length > 0 ? '100%' : '0%',
          //   availability: enhancedProduct.availability?.length > 0 ? '100%' : '0%',
          //   combinations: enhancedProduct.combinations?.length > 0 ? '100%' : '0%',
          //   interior_match: enhancedProduct.interior_match ? '100%' : '0%'
          // });
          setProductData(enhancedProduct);
        } else {
          console.warn('⚠️ [ProductPage] Product not found:', decorId);
          setError('Product not found');
        }
      } catch (err) {
        console.error('❌ [ProductPage] Error loading product:', err);
        setError(err instanceof Error ? err.message : 'Failed to load product data');
      } finally {
        setLoading(false);
      }
    };
    loadProductData();
  }, [decorId]);

  const copyProductDetails = () => {
    if (productData) {
      const details = `${productData.decor_id} ${productData.decor_name} - ${productData.texture} Texture`;
      navigator.clipboard.writeText(details);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading product details...</p>
          <p className="text-gray-500 text-sm mt-2">Fetching authentic data from database...</p>
        </div>
      </div>
    );
  }

  if (error || !productData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h1>
          <p className="text-gray-600 mb-2">{error || 'The requested product could not be found.'}</p>
          <p className="text-gray-500 text-sm mb-6">Product ID: {decorId}</p>
          <div className="space-y-3">
            <Link to="/egger-boards">
              <Button className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Materials Gallery
              </Button>
            </Link>
            <Link to="/">
              <Button variant="outline" className="w-full">
                Go to Homepage
              </Button>
          </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 bg-white shadow-lg transition-transform duration-300 ${
        isNavVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link to="/egger-boards" className="flex items-center text-gray-600 hover:text-red-600 transition-colors">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Materials Gallery
              </Link>
            </div>
            <div className="flex items-center space-x-2">
              <img src={rightfitLogo} alt="RightFit" className="h-8 w-auto" />
              <span className="font-semibold text-gray-900">RightFit Interior Designer</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                EGGER Official Data
              </Badge>
            </div>
          </div>
        </div>
      </nav>

      {/* Enhanced Hero Section with Product Details & Character */}
      <section className="pt-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-8">
            <Link to="/egger-boards" className="hover:text-red-600 transition-colors">Materials Gallery</Link>
            <span>›</span>
            <span className="text-red-600 font-medium">{productData.decor_name}</span>
          </nav>

          {/* Hero: Product Details & Character */}
          <div className="grid lg:grid-cols-2 gap-12 items-center py-8">
            <div>
              {/* Product Title & Quick Info */}
              <div className="mb-8">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-4">
                  <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4 lg:mb-0">
                    {productData.decor_id} {productData.decor_name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-red-600 text-white">
                      {productData.texture} Texture
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                      Official Data
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Character Description */}
              <div className="prose prose-lg text-gray-700 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Product Details & Character
                </h2>
                <p className="text-lg leading-relaxed mb-6">
                  {productData.colour_character_text || productData.description || 
                  `${productData.decor_name} features the ${productData.texture} texture, offering exceptional quality and authentic appearance. This decor is designed for professional interior applications, providing both aesthetic appeal and practical durability for modern design projects.`}
                </p>
              </div>

              {/* Technical Details */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Technical Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Surface Texture:</span>
                      <div className="font-medium text-gray-900">{productData.texture}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Product Family:</span>
                      <div className="font-medium text-gray-900">{productData.decor}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Available Types:</span>
                      <div className="font-medium text-gray-900">
                        {productData.availability?.length || 0} Product Types
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Image Gallery:</span>
                      <div className="font-medium text-gray-900">
                        {productData.board_images?.length || 0} Board + {productData.images?.length || 0} Gallery
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={() => productData.product_page_url && window.open(productData.product_page_url, '_blank')}
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Official Product Page
                </button>
                <Badge variant="outline" className="px-3 py-2">
                  {productData.images?.length || 0} Images Available
                </Badge>
                {productData.availability && productData.availability.length > 0 && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 px-3 py-2">
                    {productData.availability.length} Product Types
                  </Badge>
                )}
              </div>
            </div>

            {/* Enhanced Image Display - Use Close-up Board Image */}
            <div className="relative">
              {productData.board_images && productData.board_images.length > 0 ? (
                <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden relative group">
                  <img 
                    src={productData.board_images.find(img => img.is_closeup)?.image_url || productData.board_images[1]?.image_url || productData.board_images[0].image_url}
                    alt={`${productData.decor_name} close-up detail`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      // console.log('❌ [ProductPage] Board detail image failed to load');
                      e.currentTarget.src = 'https://via.placeholder.com/400x400?text=Board+Detail';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-4 left-4 right-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <p className="text-sm font-medium">
                      Visualize this decor in the RightFit Interior Design Suite
                    </p>
                  </div>
                  <div className="absolute top-4 right-4 bg-white bg-opacity-90 px-2 py-1 rounded text-xs font-medium text-gray-800">
                    High-Res Detail
                  </div>
                </div>
              ) : productData.images && productData.images.length > 0 ? (
                <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden relative group">
                  <img 
                    src={productData.images.find(img => img.is_primary)?.image_url || productData.images[0].image_url}
                    alt={`${productData.decor_name} detail view`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      // console.log('❌ [ProductPage] Gallery image failed to load');
                      e.currentTarget.src = 'https://via.placeholder.com/400x400?text=Product+Image';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-4 left-4 right-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <p className="text-sm font-medium">
                      Visualize this decor in the RightFit Interior Design Suite
                    </p>
                  </div>
                </div>
              ) : (
                <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-gray-400 mb-4 text-4xl">🎨</div>
                    <span className="text-gray-600">Product Image Not Available</span>
                    <p className="text-gray-500 text-sm mt-2">Contact for imagery</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Product Board Images Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Product Board Images</h2>
            <p className="text-lg text-gray-600">High-quality board images and detailed views</p>
          </div>

          {/* Board Images Layout - Left: Board Images, Right: Additional Gallery */}
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Left Column - Board Images */}
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-700">Product Board Images</h3>
                <Badge variant="outline" className="text-xs">High Quality PNG</Badge>
              </div>
              
              {productData.board_images && productData.board_images.length > 0 ? (
                <div className="space-y-4">
                  {/* Main Board Image */}
                  <div className="aspect-[16/9] bg-gray-200 rounded-lg overflow-hidden relative group">
                    <img
                      src={productData.board_images.find(img => img.is_main_board)?.image_url || productData.board_images[0].image_url}
                      alt={`${productData.decor_name} main board`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/800x450?text=Board+Image';
                      }}
                    />
                    <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Main Board View
                    </div>
                    <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                      High-Res PNG
                    </div>
                  </div>
                  
                  {/* Board Image Thumbnails */}
                  {productData.board_images.length > 1 && (
                    <div className="grid grid-cols-2 gap-3">
                      {productData.board_images.map((boardImg, index) => (
                        <div key={index} className="aspect-[4/3] bg-gray-200 rounded-lg overflow-hidden relative group cursor-pointer">
                          <img
                            src={boardImg.image_url}
                            alt={`${productData.decor_name} ${boardImg.is_main_board ? 'main board' : 'close-up'}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Board+Image';
                            }}
                          />
                          <div className="absolute bottom-2 left-2 bg-white bg-opacity-90 px-2 py-1 rounded text-xs font-medium">
                            {boardImg.is_main_board ? 'Main Board' : 'Close-up Detail'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-[16/9] bg-gray-200 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-gray-400 mb-4 text-4xl">📷</div>
                    <p className="text-gray-600">No board images available</p>
                    <p className="text-gray-500 text-sm mt-2">Contact for product imagery</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Additional Gallery */}
            <div className="space-y-4">
              {productData.images && productData.images.length > 0 && (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-700">Additional Gallery</h3>
                    <Badge variant="outline" className="text-xs">
                      {productData.images.length} WebP Images
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2">
                    {productData.images.slice(0, 8).map((image, index) => (
                      <div 
                        key={index} 
                        className="aspect-square bg-gray-200 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-red-300 transition-all"
                      >
                        <img
                          src={image.image_url}
                          alt={`${productData.decor_name} gallery ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'https://via.placeholder.com/150x150?text=Gallery';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  
                  {productData.images.length > 8 && (
                    <div className="text-center">
                      <Button variant="outline" size="sm">
                        View All {productData.images.length} Gallery Images
                      </Button>
                    </div>
                  )}
                  
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center justify-between text-sm">
                      <div className="text-blue-800">
                        <strong>Dual-Image System:</strong> High-quality board images + fast-loading gallery
                      </div>
                      <div className="text-blue-600 text-xs">
                        {productData.board_images?.length || 0} Board • {productData.images.length} Gallery
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Product Specifications Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Product Specifications</h2>
            <p className="text-lg text-gray-600">Technical details and product information</p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Info className="w-5 h-5 text-blue-600 mr-2" />
                  Technical Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                  <div>
                    <span className="text-gray-600">Decor ID:</span>
                    <div className="font-medium text-gray-900 mt-1">{productData.decor_id}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Surface Texture:</span>
                    <div className="font-medium text-gray-900 mt-1">{productData.texture}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Product Name:</span>
                    <div className="font-medium text-gray-900 mt-1">{productData.decor_name}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Data Source:</span>
                    <div className="font-medium text-green-600 mt-1">Official Data</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Available Product Types Section */}
      {productData.availability && Array.isArray(productData.availability) && productData.availability.length > 0 && (
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Available Product Types</h2>
              <p className="text-lg text-gray-600">This decor is available in {productData.availability.length} different product types</p>
            </div>
            
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {productData.availability.map((item, index) => (
                  <div key={index} className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="w-12 h-12 mr-4 bg-green-100 rounded-full flex items-center justify-center">
                      {item.product_type === 'Decorative Faced Boards' && '🔲'}
                      {item.product_type === 'Edging' && '📏'}
                      {item.product_type === 'Laminates' && '📋'}
                      {item.product_type === 'Worktops' && '🔳'}
                      {item.product_type === 'Compact Laminate' && '📐'}
                      {item.product_type === 'Splashbacks' && '🪟'}
                      {item.product_type === 'Upstands' && '📐'}
                      {!['Decorative Faced Boards', 'Edging', 'Laminates', 'Worktops', 'Compact Laminate', 'Splashbacks', 'Upstands'].includes(item.product_type) && '📦'}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {item.product_type}
                      </div>
                      <div className="flex items-center mt-1">
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                        <span className="text-sm text-gray-600">Available</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Recommended Combinations Section */}
      {productData.combinations && Array.isArray(productData.combinations) && productData.combinations.length > 0 && (
        <section className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Recommended Combinations</h2>
              <p className="text-lg text-gray-600">Professional decor combinations for harmonious design</p>
            </div>
            
            <div className="max-w-6xl mx-auto">
              <div className="grid gap-6">
                {productData.combinations.map((combo, index) => {
                  const recommendedProduct = productData.recommended_products?.find(
                    p => p.decor_id === combo.recommended_decor_id
                  );
                  
                  return (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start space-x-6">
                        {/* Product Image */}
                        <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {(recommendedProduct as any)?.primary_image ? (
                            <img
                              src={(recommendedProduct as any).primary_image.image_url}
                              alt={`${combo.recommended_decor_id} preview`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = 'https://via.placeholder.com/96x96?text=Decor';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                              No Image
                            </div>
                          )}
                        </div>
                        
                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {recommendedProduct?.decor_name || combo.recommended_decor_id}
                              </h3>
                              <p className="text-gray-600 mt-1">
                                {combo.recommended_decor_id} • {recommendedProduct?.texture || 'Texture'}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              <Badge variant="outline" className="bg-white">
                                Match
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="mt-3">
                            <p className="text-gray-600 line-clamp-2">
                              {recommendedProduct?.description?.substring(0, 150) || 
                               'Professional combination recommendation for harmonious interior design'}
                              {recommendedProduct?.description && recommendedProduct.description.length > 150 && '...'}
                            </p>
                          </div>
                          
                          <div className="mt-4 flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                              Match Type: <span className="capitalize font-medium text-gray-700">{combo.match_type}</span>
                            </div>
                            <Link 
                              to={`/product/${encodeURIComponent(combo.recommended_decor_id)}`}
                              className="inline-flex items-center text-red-600 hover:text-red-700 font-medium text-sm"
                            >
                              View Product Details
                              <ExternalLink className="w-4 h-4 ml-1" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="text-center mt-8 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>{productData.combinations.length} professional combinations</strong> recommended for {productData.decor_name}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Interior Match Section */}
      {productData.interior_match && productData.interior_match.interior_style && (
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Interior Match: Created for Harmonious Designs
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                With the Interior Match, you benefit from coordinated combination options for furniture and flooring. 
                The decor package includes same-decor and colour-coordinated flooring as well as furniture and interior design products. 
                This allows you to create coordinated modern designs.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Interior Match Image */}
              <div className="relative">
                <img
                  src="https://cdn.egger.com/img/pim/8854509256734/8860184084510/AR_16_9.webp?width=1024&srcext=png"
                  alt="Interior Match Design Concept"
                  className="w-full h-auto rounded-lg shadow-lg"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/600x400?text=Interior+Match';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent rounded-lg flex items-center">
                  <div className="text-white p-8">
                    <h3 className="text-4xl font-bold mb-2">Interior</h3>
                    <h3 className="text-4xl font-bold">MATCH</h3>
                  </div>
                </div>
              </div>

              {/* Interior Match Details */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    {productData.interior_match.interior_style} Style
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {productData.interior_match.design_notes || 
                     `This decor is perfectly suited for ${productData.interior_match.interior_style.toLowerCase()} interior designs, 
                      offering coordinated options that create harmonious and modern living spaces.`}
                  </p>
                </div>

                {productData.interior_match.room_types && productData.interior_match.room_types.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Recommended Room Types:</h4>
                    <div className="flex flex-wrap gap-2">
                      {productData.interior_match.room_types.map((room, index) => (
                        <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {room}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {productData.interior_match.color_palette && productData.interior_match.color_palette.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Color Palette:</h4>
                    <div className="flex flex-wrap gap-2">
                      {productData.interior_match.color_palette.map((color, index) => (
                        <Badge key={index} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {color}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Eye className="w-4 h-4 mr-2" />
                    Explore Interior Match Collection
                  </Button>
                </div>
              </div>
            </div>
        </div>
      </section>
      )}

      {/* Enhanced Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <img src={rightfitLogo} alt="RightFit" className="h-8 w-auto" />
                <span className="font-semibold text-white">RightFit Interior Designer</span>
              </div>
              <p className="text-gray-300 text-sm">
                Professional interior design tools with authentic materials database.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Navigation</h3>
              <div className="space-y-2 text-sm">
                <Link to="/egger-boards" className="block text-gray-300 hover:text-white transition-colors">Materials Gallery</Link>
                <Link to="/designer" className="block text-gray-300 hover:text-white transition-colors">Interior Designer Tool</Link>
                <Link to="/" className="block text-gray-300 hover:text-white transition-colors">Homepage</Link>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Current Product</h3>
              <div className="space-y-2 text-sm">
                <div className="text-gray-300">Product: <span className="text-white font-medium">{productData.decor_id}</span></div>
                <div className="text-gray-300">Name: <span className="text-white font-medium">{productData.decor_name}</span></div>
                <div className="text-gray-300">Texture: <span className="text-white font-medium">{productData.texture}</span></div>
                <div className="text-gray-300">Images: <span className="text-white font-medium">{productData.images?.length || 0} Available</span></div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Data Quality</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center text-green-300">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Official Data
                </div>
                <div className="flex items-center text-green-300">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Real Product Information
                </div>
                <div className="flex items-center text-green-300">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  High-Resolution Images
                </div>
                <div className="flex items-center text-green-300">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Professional Database
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>© 2024 RightFit Interior Designer. Product data courtesy of EGGER. All product information is sourced from official databases.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
                    </div>
                    
                    {/* Main Board Image */}
                    <div className="aspect-[16/9] bg-gray-200 rounded-lg overflow-hidden relative group">
                      <img
                        src={productData.board_images.find(img => img.is_main_board)?.image_url || productData.board_images[0].image_url}
                        alt={`${productData.decor_name} main board`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          // console.log('❌ [ProductPage] Board image failed to load');
                          e.currentTarget.src = 'https://via.placeholder.com/800x450?text=Board+Image';
                        }}
                      />
                      <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                        Main Board View
                      </div>
                      <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                        High-Res PNG
                      </div>
                    </div>
                    
                    {/* Board Image Thumbnails */}
                    {productData.board_images.length > 1 && (
                      <div className="grid grid-cols-2 gap-3">
                        {productData.board_images.map((boardImg, index) => (
                          <div key={index} className="aspect-[4/3] bg-gray-200 rounded-lg overflow-hidden relative group cursor-pointer">
                            <img
                              src={boardImg.image_url}
                              alt={`${productData.decor_name} ${boardImg.is_main_board ? 'main board' : 'close-up'}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                e.currentTarget.src = 'https://via.placeholder.com/400x300?text=Board+Image';
                              }}
                            />
                            <div className="absolute bottom-2 left-2 bg-white bg-opacity-90 px-2 py-1 rounded text-xs font-medium">
                              {boardImg.is_main_board ? 'Main Board' : 'Close-up Detail'}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* WebP Gallery Images (Additional Views) */}
                  {productData.images && productData.images.length > 0 && (
                    <div className="space-y-3 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-700">Additional Gallery</h3>
                        <Badge variant="outline" className="text-xs">
                          {productData.images.length} WebP Images
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-2">
                        {productData.images.slice(0, 8).map((image, index) => (
                          <div 
                            key={index} 
                            className="aspect-square bg-gray-200 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-red-300 transition-all"
                            onClick={() => setSelectedImageIndex(index)}
                          >
                            <img
                              src={image.image_url}
                              alt={`${productData.decor_name} gallery ${index + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = 'https://via.placeholder.com/100x100?text=Gallery';
                              }}
                            />
                          </div>
                        ))}
                      </div>
                      
                      {productData.images.length > 8 && (
                        <div className="text-center">
                          <Button variant="outline" size="sm">
                            View All {productData.images.length} Gallery Images
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Image System Info */}
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center justify-between text-sm">
                      <div className="text-blue-800">
                        <strong>Dual-Image System:</strong> High-quality board images + fast-loading gallery
                      </div>
                      <div className="text-blue-600 text-xs">
                        {productData.board_images.length} Board • {productData.images.length} Gallery
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-gray-400 mb-4 text-4xl">📷</div>
                    <p className="text-gray-600">No board images available</p>
                    <p className="text-gray-500 text-sm mt-2">Contact EGGER for product imagery</p>
                  </div>
                </div>
              )}
            </div>

            {/* Enhanced Product Info */}
            <div className="space-y-6">
              {/* Product Specifications */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Info className="w-5 h-5 text-blue-600 mr-2" />
                    Product Specifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Decor Code:</span>
                      <div className="font-medium text-gray-900">{productData.decor_id}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Texture:</span>
                      <div className="font-medium text-gray-900">{productData.texture}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Product Name:</span>
                      <div className="font-medium text-gray-900">{productData.decor_name}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Data Source:</span>
                      <div className="font-medium text-green-600">EGGER Official</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Availability Section */}
              {productData.availability && Array.isArray(productData.availability) && productData.availability.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Package className="w-5 h-5 text-green-600 mr-2" />
                        Available Product Types
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        {productData.availability.length} Types
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {productData.availability.map((item, index) => (
                        <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <div className="w-10 h-10 mr-3 bg-green-100 rounded-full flex items-center justify-center">
                            {item.product_type === 'Decorative Faced Boards' && '🔲'}
                            {item.product_type === 'Edging' && '📏'}
                            {item.product_type === 'Laminates' && '📋'}
                            {item.product_type === 'Worktops' && '🔳'}
                            {item.product_type === 'Compact Laminate' && '📐'}
                            {item.product_type === 'Splashbacks' && '🪟'}
                            {item.product_type === 'Upstands' && '📐'}
                            {!['Decorative Faced Boards', 'Edging', 'Laminates', 'Worktops', 'Compact Laminate', 'Splashbacks', 'Upstands'].includes(item.product_type) && '📦'}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">
                              {item.product_type}
                            </div>
                            <div className="flex items-center mt-1">
                              <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                              <span className="text-xs text-gray-600">Available</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Enhanced Product Combinations with Full Data */}
              {productData.combinations && Array.isArray(productData.combinations) && productData.combinations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Palette className="w-5 h-5 text-purple-600 mr-2" />
                        Recommended Combinations
                      </div>
                      <Badge className="bg-purple-100 text-purple-800">
                        {productData.combinations.length} Professional Matches
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      {productData.combinations.map((combo, index) => {
                        // Find the full product data for this combination
                        const recommendedProduct = productData.recommended_products?.find(
                          p => p.decor_id === combo.recommended_decor_id
                        );
                        
                        return (
                          <Link 
                            key={index} 
                            to={`/product/${encodeURIComponent(combo.recommended_decor_id)}`}
                            className="block group"
                          >
                            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-100 group-hover:border-purple-300 group-hover:shadow-lg transition-all duration-300">
                              <div className="flex items-start space-x-4">
                                {/* Product Image */}
                                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform">
                                  {(recommendedProduct as any)?.primary_image?.image_url ? (
                                    <img
                                      src={(recommendedProduct as any).primary_image.image_url}
                                      alt={recommendedProduct?.decor_name || combo.recommended_decor_id}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        // Fallback to decor code display
                                        e.currentTarget.style.display = 'none';
                                        const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                                        if (nextElement) nextElement.style.display = 'flex';
                                      }}
                                    />
                                  ) : null}
                                  <div className="w-full h-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center" style={{ display: (recommendedProduct as any)?.primary_image?.image_url ? 'none' : 'flex' }}>
                                    <div className="text-purple-600 text-xl font-bold">
                                      {combo.recommended_decor_id.split(' ')[0]}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Product Details */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between mb-2">
              <div>
                                      <h4 className="font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">
                                        {recommendedProduct?.decor_name || combo.recommended_decor_id}
                                      </h4>
                                      <p className="text-sm text-gray-600">
                                        {combo.recommended_decor_id} • {recommendedProduct?.texture || 'EGGER Texture'}
                                      </p>
                                    </div>
                                    <div className="flex items-center space-x-2 flex-shrink-0">
                                      <Badge variant="outline" className="text-xs bg-white">
                                        EGGER Match
                                      </Badge>
                                      <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                                    {recommendedProduct?.category && (
                                      <span className="flex items-center">
                                        <div className="w-2 h-2 bg-purple-400 rounded-full mr-1"></div>
                                        {recommendedProduct.category}
                                      </span>
                                    )}
                                    {recommendedProduct?.color_family && (
                                      <span className="flex items-center">
                                        <div className="w-2 h-2 bg-blue-400 rounded-full mr-1"></div>
                                        {recommendedProduct.color_family}
                                      </span>
                                    )}
                                    <span className="flex items-center">
                                      <Star className="w-3 h-3 text-yellow-500 mr-1" />
                                      Professional Match
                                    </span>
                </div>

                                  <p className="text-sm text-gray-600 mt-2">
                                    {recommendedProduct?.description?.substring(0, 120) || 
                                     'Professional EGGER combination recommendation for harmonious interior design'}
                                    {recommendedProduct?.description && recommendedProduct.description.length > 120 && '...'}
                </p>
              </div>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                    
                    {/* Combination Summary */}
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Professional EGGER combinations for {productData.decor_name}</span>
                        <span>{productData.combinations.length} harmonious matches available</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  size="lg"
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => productData.product_page_url && window.open(productData.product_page_url, '_blank')}
                >
                  <ExternalLink className="w-5 h-5 mr-2" />
                  View on EGGER Official Website
                </Button>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    onClick={() => {
                      const designerUrl = `/designer?decor=${encodeURIComponent(productData.decor_id)}`;
                      window.open(designerUrl, '_blank');
                    }}
                  >
                    <Ruler className="w-4 h-4 mr-2" />
                    Use in Designer
                </Button>
                <Button
                  variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    onClick={copyProductDetails}
                >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Details
                </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Interior Match Section */}
      {productData.interior_match && productData.interior_match.interior_style && (
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Interior Match: Created for Harmonious Designs
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Professional design coordination with EGGER's Interior Match system
              </p>
                  </div>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="relative">
                <div className="aspect-[4/3] bg-gradient-to-br from-red-50 to-red-100 rounded-lg overflow-hidden">
                  {productData.images && productData.images.length > 1 ? (
                    <img 
                      src={productData.images[1].image_url}
                      alt="Interior Match Application"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = productData.images[0].image_url;
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-red-600 text-6xl font-light mb-4">Interior</div>
                        <div className="text-red-800 text-4xl font-bold">MATCH</div>
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-10 flex items-center justify-center">
                    <div className="bg-white bg-opacity-90 px-6 py-3 rounded-lg">
                      <div className="text-red-600 text-2xl font-bold">Interior MATCH</div>
                    </div>
                </div>
              </div>
            </div>

              <div>
                <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                      Design Coordination Benefits
                    </CardTitle>
                </CardHeader>
                  <CardContent>
                    <div className="prose text-gray-700">
                      <p className="leading-relaxed">
                        {productData.interior_match.design_notes || 
                        'With the Interior Match, you benefit from coordinated combination options for furniture and flooring. The decor package includes same-decor and colour-coordinated flooring as well as furniture and interior design products. This allows you to create coordinated modern designs.'}
                      </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                    <CardTitle>Match Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-red-600 rounded-full mr-3"></div>
                        <span className="text-gray-600">Style:</span>
                        <span className="font-medium text-gray-900 ml-2">
                          {productData.interior_match.interior_style.replace('Interior Match: ', '')}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-red-600 rounded-full mr-3"></div>
                        <span className="text-gray-600">Coordination:</span>
                        <span className="font-medium text-gray-900 ml-2">Furniture & Flooring</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-red-600 rounded-full mr-3"></div>
                        <span className="text-gray-600">Design System:</span>
                        <span className="font-medium text-gray-900 ml-2">EGGER Interior Match</span>
                      </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* Enhanced Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <img src={rightfitLogo} alt="RightFit" className="h-8 w-auto" />
                <span className="font-semibold text-white">RightFit Interior Designer</span>
              </div>
              <p className="text-gray-300 text-sm">
                Professional interior design tools with authentic materials database.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Navigation</h3>
              <div className="space-y-2 text-sm">
                <Link to="/egger-boards" className="block text-gray-300 hover:text-white transition-colors">Materials Gallery</Link>
                <Link to="/designer" className="block text-gray-300 hover:text-white transition-colors">Interior Designer Tool</Link>
                <Link to="/" className="block text-gray-300 hover:text-white transition-colors">Homepage</Link>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Current Product</h3>
              <div className="space-y-2 text-sm text-gray-300">
                <p><span className="text-gray-400">Product:</span> {productData.decor_id}</p>
                <p><span className="text-gray-400">Name:</span> {productData.decor_name}</p>
                <p><span className="text-gray-400">Texture:</span> {productData.texture}</p>
                <p><span className="text-gray-400">Images:</span> {productData.images?.length || 0} Available</p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Data Quality</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                  <span className="text-gray-300">EGGER Official Data</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                  <span className="text-gray-300">Real Product Information</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                  <span className="text-gray-300">High-Resolution Images</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                  <span className="text-gray-300">Professional Database</span>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>© 2024 RightFit Interior Designer. Product data courtesy of EGGER. All product information is sourced from official EGGER databases.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
