import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import rightfitLogo from '@/assets/logo.png';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Package, Search, Filter, Star, Users, Clock, DollarSign, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  eggerDataService, 
  EnhancedEggerProduct, 
  EggerSearchFilters,
  EggerCategory,
  EggerTexture,
  EggerColorFamily
} from '../services/EggerDataService';

export default function EnhancedEggerBoards() {
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  
  // Data state
  const [products, setProducts] = useState<EnhancedEggerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // UI state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'id' | 'texture' | 'category' | 'price'>('name');
  const [filters, setFilters] = useState<EggerSearchFilters>({});
  
  // Lookup data
  const [categories, setCategories] = useState<EggerCategory[]>([]);
  const [textures, setTextures] = useState<EggerTexture[]>([]);
  const [colorFamilies, setColorFamilies] = useState<EggerColorFamily[]>([]);
  
  // Statistics
  const [stats, setStats] = useState({
    totalDecors: 0,
    totalImages: 0,
    totalCombinations: 0,
    categoriesCount: 0,
    texturesCount: 0
  });

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

  // Load lookup data on mount
  useEffect(() => {
    const loadLookupData = async () => {
      try {
        const [categoriesData, texturesData, colorFamiliesData, statsData] = await Promise.all([
          eggerDataService.getCategories(),
          eggerDataService.getTextures(),
          eggerDataService.getColorFamilies(),
          eggerDataService.getStatistics()
        ]);
        
        setCategories(categoriesData);
        setTextures(texturesData);
        setColorFamilies(colorFamiliesData);
        setStats(statsData);
      } catch (error) {
        console.error('Error loading lookup data:', error);
      }
    };

    loadLookupData();
  }, []);

  // Load products
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const searchFilters: EggerSearchFilters = {
          search: searchQuery || undefined,
          category: filters.category || undefined,
          texture: filters.texture || undefined,
          color_family: filters.color_family || undefined,
          has_combinations: filters.has_combinations
        };

        const result = await eggerDataService.getDecors(currentPage, itemsPerPage, searchFilters);
        setProducts(result.data);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load products');
        console.error('Error loading products:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [currentPage, searchQuery, filters]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters]);

  // Handle filter changes
  const handleFilterChange = (key: keyof EggerSearchFilters, value: string | boolean | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
  };

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading materials from database...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Database Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isNavVisible ? 'translate-y-0' : '-translate-y-full'
      } bg-white shadow-lg`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src={rightfitLogo} alt="RightFit" className="h-8 w-auto" />
              <span className="ml-2 text-xl font-bold text-gray-900">Materials Database</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Package className="w-4 h-4 mr-2" />
                Gallery
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-16">
        {/* Header */}
        <section className="bg-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Materials Database
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Professional materials with intelligent recommendations and real-time availability
              </p>
              
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6 max-w-6xl mx-auto">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{stats.totalDecors}</div>
                  <div className="text-sm text-gray-600">Total Materials</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{stats.totalCombinations}</div>
                  <div className="text-sm text-gray-600">Combinations</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{stats.categoriesCount}</div>
                  <div className="text-sm text-gray-600">Categories</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">{stats.texturesCount}</div>
                  <div className="text-sm text-gray-600">Textures</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-pink-600">{stats.totalImages}</div>
                  <div className="text-sm text-gray-600">Images</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Search and Filters */}
        <section className="bg-white border-b py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Search materials, decor IDs, textures..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <Select value={filters.category || ''} onValueChange={(value) => handleFilterChange('category', value || undefined)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Texture Filter */}
              <Select value={filters.texture || ''} onValueChange={(value) => handleFilterChange('texture', value || undefined)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Texture" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Textures</SelectItem>
                  {textures.map((texture) => (
                    <SelectItem key={texture.id} value={texture.name}>
                      {texture.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="id">Decor ID</SelectItem>
                  <SelectItem value="texture">Texture</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                  <SelectItem value="price">Price</SelectItem>
                </SelectContent>
              </Select>

              {/* Clear Filters */}
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </div>
        </section>

        {/* Products Grid */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {products.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No materials found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your search or filters</p>
                <Button onClick={clearFilters}>Clear all filters</Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map((product) => (
                    <EnhancedProductCard key={product.decor_id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                <div className="flex justify-center mt-12">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>
                    
                    <div className="flex items-center space-x-1">
                      <span className="text-sm text-gray-600">
                        Page {currentPage}
                      </span>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={products.length < itemsPerPage}
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </>
            )}

            {loading && (
              <div className="flex justify-center mt-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

// Enhanced Product Card Component
function EnhancedProductCard({ product }: { product: EnhancedEggerProduct }) {
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
      <CardHeader className="p-0">
        <div className="relative">
          {product.images.length > 0 && (
            <img
              src={product.images[0].image_url}
              alt={product.decor_name}
              className="w-full h-48 object-cover rounded-t-lg"
              loading="lazy"
            />
          )}
          
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.has_combinations && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Star className="w-3 h-3 mr-1" />
                {product.combination_count} matches
              </Badge>
            )}
            {product.availability.some(a => a.availability_status === 'in_stock') && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                In Stock
              </Badge>
            )}
          </div>

          {/* Price badge */}
          {product.cost_per_sqm && (
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="bg-white text-gray-900">
                <DollarSign className="w-3 h-3 mr-1" />
                £{product.cost_per_sqm.toFixed(2)}/m²
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <div className="space-y-2">
          <h3 className="font-semibold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
            {product.decor_name}
          </h3>
          
          <p className="text-sm text-gray-600">{product.decor_id}</p>
          
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>{product.texture}</span>
            {product.category && (
              <>
                <span>•</span>
                <span>{product.category}</span>
              </>
            )}
          </div>

          {/* Availability info */}
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">
              {product.availability.length > 0 
                ? `${product.availability[0].lead_time_days} days lead time`
                : 'Check availability'
              }
            </span>
          </div>

          {/* Interior match info */}
          {product.interior_match && (
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">
                {product.interior_match.room_types.join(', ')}
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <Button asChild size="sm" className="flex-1">
              <Link to={`/product/${product.decor_id}`}>
                View Details
              </Link>
            </Button>
            {product.product_page_url && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(product.product_page_url, '_blank')}
              >
                EGGER
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
