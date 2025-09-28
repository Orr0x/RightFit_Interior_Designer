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
        
        console.log('🔄 [ProductPage] Loading product data...');
        console.log('🔍 [ProductPage] Looking for decor_id:', decorId);
        
        const enhancedProduct = await eggerDataService.getEnhancedProduct(decorId);
        
        if (enhancedProduct) {
          console.log('✅ [ProductPage] Real data loaded successfully');
          console.log('📊 [ProductPage] Data completeness:', {
            basic_info: '100%',
            images: enhancedProduct.images?.length > 0 ? '100%' : '0%',
            availability: enhancedProduct.availability?.length > 0 ? '100%' : '0%',
            combinations: enhancedProduct.combinations?.length > 0 ? '100%' : '0%',
            interior_match: enhancedProduct.interior_match ? '100%' : '0%'
          });
          setProductData(enhancedProduct);
        } else {
          console.log('⚠️ [ProductPage] Product not found:', decorId);
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

      {/* Enhanced Hero Section */}
      <section className="pt-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-8">
            <Link to="/egger-boards" className="hover:text-red-600 transition-colors">Materials Gallery</Link>
            <span>›</span>
            <span className="text-red-600 font-medium">{productData.decor_name}</span>
          </nav>

          {/* Product Title & Quick Info */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-2 lg:mb-0">
                {productData.decor_id} {productData.decor_name}
              </h1>
              <div className="flex items-center space-x-3">
                <Badge className="bg-red-600 text-white">
                  {productData.texture} Texture
                </Badge>
                <Badge variant="outline">
                  {productData.images?.length || 0} Images
                </Badge>
                {productData.availability && productData.availability.length > 0 && (
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    {productData.availability.length} Product Types
                  </Badge>
                )}
              </div>
            </div>
            <p className="text-lg text-gray-600">
              Professional decor with authentic materials data and high-quality imagery
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-8">
            <nav className="flex space-x-8">
              <button className="border-b-2 border-red-600 text-red-600 pb-4 px-1 font-medium flex items-center">
                <Eye className="w-4 h-4 mr-2" />
                Gallery View
              </button>
              <button className="text-gray-500 hover:text-gray-700 pb-4 px-1 flex items-center">
                <Info className="w-4 h-4 mr-2" />
                Product Details
              </button>
              <button 
                className="text-gray-500 hover:text-gray-700 pb-4 px-1 flex items-center"
                onClick={() => productData.product_page_url && window.open(productData.product_page_url, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                EGGER Official
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="grid lg:grid-cols-2 gap-12 mb-16">
            {/* Enhanced Image Gallery */}
            <div className="relative">
              {productData.images && productData.images.length > 0 ? (
                <div className="space-y-4">
                  {/* Primary Image Display */}
                  <div className="aspect-[16/9] bg-gray-200 rounded-lg overflow-hidden relative group">
                    <img
                      src={productData.images[selectedImageIndex]?.image_url || productData.images[0].image_url}
                      alt={`${productData.decor_name} view ${selectedImageIndex + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        console.log('❌ [ProductPage] Image failed to load');
                        e.currentTarget.src = 'https://via.placeholder.com/800x450?text=Product+Image';
                      }}
                    />
                    <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {selectedImageIndex + 1} of {productData.images.length}
                    </div>
                    <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                      {productData.images[selectedImageIndex]?.image_type?.toUpperCase() || 'IMAGE'}
                    </div>
                  </div>
                  
                  {/* Image Thumbnails */}
                  {productData.images.length > 1 && (
                    <div className="grid grid-cols-6 gap-2">
                      {productData.images.map((image, index) => (
                        <div 
                          key={index} 
                          className={`aspect-square bg-gray-200 rounded-lg overflow-hidden cursor-pointer transition-all ${
                            selectedImageIndex === index 
                              ? 'ring-2 ring-red-600 ring-offset-2' 
                              : 'hover:ring-2 hover:ring-gray-300'
                          }`}
                          onClick={() => setSelectedImageIndex(index)}
                        >
                          <img
                            src={image.image_url}
                            alt={`${productData.decor_name} thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = 'https://via.placeholder.com/100x100?text=No+Image';
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Image Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Image Types: {[...new Set(productData.images.map(img => img.image_type))].join(', ').toUpperCase()}</span>
                      <span>High Resolution Available</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-gray-400 mb-4 text-4xl">📷</div>
                    <p className="text-gray-600">No images available</p>
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

              {/* Product Combinations */}
              {productData.combinations && Array.isArray(productData.combinations) && productData.combinations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Palette className="w-5 h-5 text-purple-600 mr-2" />
                        Recommended Combinations
                      </div>
                      <Badge className="bg-purple-100 text-purple-800">
                        {productData.combinations.length} Matches
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {productData.combinations.map((combo, index) => (
                        <Link 
                          key={index} 
                          to={`/product/${encodeURIComponent(combo.recommended_decor_id)}`}
                          className="block group"
                        >
                          <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 group-hover:border-purple-300 group-hover:shadow-md transition-all">
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-medium text-gray-900 group-hover:text-purple-700">
                                {combo.recommended_decor_id}
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" className="text-xs">
                                  EGGER Match
                                </Badge>
                                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-purple-600" />
                              </div>
                            </div>
                            <div className="text-sm text-gray-600">
                              Professional EGGER combination recommendation for harmonious design
                            </div>
                          </div>
                        </Link>
                      ))}
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

      {/* Product Details Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Product Details & Character
              </h2>
              <div className="prose prose-lg text-gray-700">
                <p className="text-lg leading-relaxed mb-6">
                  {productData.colour_character_text || productData.description || 
                  `${productData.decor_name} features the ${productData.texture} texture, offering exceptional quality and authentic appearance. This EGGER decor is designed for professional interior applications, providing both aesthetic appeal and practical durability for modern design projects.`}
                </p>
                
                {/* Technical Details */}
                <Card>
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
                          {productData.images?.length || 0} High-Res Images
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Enhanced Image Display */}
            <div className="relative">
              {productData.images && productData.images.length > 0 ? (
                <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden relative group">
                  <img 
                    src={productData.images.find(img => img.is_primary)?.image_url || productData.images[0].image_url}
                    alt={`${productData.decor_name} detail view`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      console.log('❌ [ProductPage] Detail image failed to load');
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
                    <p className="text-gray-500 text-sm mt-2">Contact EGGER for imagery</p>
                  </div>
                </div>
              )}
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
