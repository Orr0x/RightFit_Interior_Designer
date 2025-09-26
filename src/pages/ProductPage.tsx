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
  Ruler
} from 'lucide-react';

interface ProductImage {
  id: string;
  url: string;
  type: 'webp' | 'png';
  width?: number;
  height?: number;
  aspectRatio?: string;
  isMain?: boolean;
}

interface ProductData {
  decor_id: string;
  decor_name: string;
  decor: string;
  texture: string;
  product_page_url: string;
  images: ProductImage[];
  totalImages: number;
  categories: string[];
}

export default function ProductPage() {
  const { decorId } = useParams<{ decorId: string }>();
  const [productData, setProductData] = useState<ProductData | null>(null);
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

  // Load product data
  useEffect(() => {
    const loadProductData = async () => {
      if (!decorId) return;

      try {
        setLoading(true);
        setError(null);

        // Load both WebP and board data
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

      {/* Hero Section */}
      <section className="pt-20 pb-16 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Image Viewer - High Quality PNG Images */}
            <div className="relative">
              {productData.images && productData.images.length > 0 ? (
                <ImageViewer
                  images={productData.images.filter(img => img.type === 'png')}
                  className="shadow-2xl"
                />
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">📷</div>
                  <p className="text-gray-600">No board images available</p>
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-8">
              <div>
                <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                  {productData.decor_name}
                </h1>
                
                <div className="text-2xl text-gray-600 mb-8 font-medium">
                  {productData.decor_id}
                </div>

                <p className="text-xl text-gray-600 mb-8">
                  Premium {productData.decor} {productData.texture} material perfect for furniture and interior design projects.
                  Experience the quality and versatility of this exceptional surface material.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  onClick={() => window.open(productData.product_page_url, '_blank')}
                >
                  <ExternalLink className="w-5 h-5 mr-2" />
                  View on EGGER
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.open('/egger-boards', '_self')}
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back to Gallery
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

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
              <ImageViewer images={productData.images.filter(img => img.type === 'webp')} />
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
                    {productData.categories.map((category, index) => (
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
