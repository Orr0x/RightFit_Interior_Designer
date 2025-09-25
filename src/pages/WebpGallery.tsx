import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import rightfitLogo from '@/assets/logo.png';
import { WebpCard } from '../components/ui/WebpCard';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  Search,
  Filter,
  FileImage,
  HardDrive,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  BarChart3,
  Image as ImageIcon,
  Grid3X3,
  List
} from 'lucide-react';
import {
  WebpGalleryData,
  parseWebpData,
  filterWebpImages,
  sortWebpImages,
  formatFileSize
} from '../utils/webpData';

export default function WebpGallery() {
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [galleryData, setGalleryData] = useState<WebpGalleryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20); // Show 20 items per page
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<string>('');
  const [selectedSizeRange, setSelectedSizeRange] = useState<string>('');
  const [selectedOrientation, setSelectedOrientation] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      setIsNavVisible(currentY <= lastScrollY);
      setLastScrollY(currentY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Load webp data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await parseWebpData();
        // Additional safety check on loaded data
        if (data) {
          // Ensure arrays are properly initialized
          data.categories = data.categories || [];
          data.aspectRatios = data.aspectRatios || [];
          data.sizeRanges = data.sizeRanges || [];
          data.images = data.images || [];

          // Final validation of arrays
          data.categories = data.categories.filter(cat =>
            cat && typeof cat === 'string' && cat.trim().length > 0
          );
          data.aspectRatios = data.aspectRatios.filter(ratio =>
            ratio && typeof ratio === 'string' && ratio.trim().length > 0
          );
          data.sizeRanges = data.sizeRanges.filter(range =>
            range && typeof range === 'string' && range.trim().length > 0
          );

          console.log('Final validated data:', {
            categories: data.categories.length,
            aspectRatios: data.aspectRatios.length,
            sizeRanges: data.sizeRanges.length,
            sampleCategories: data.categories.slice(0, 3),
            sampleAspectRatios: data.aspectRatios.slice(0, 3),
            sampleSizeRanges: data.sizeRanges.slice(0, 3)
          });
        }
        setGalleryData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load webp data');
        console.error('Error loading webp data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter and sort data
  const filteredAndSortedImages = useMemo(() => {
    if (!galleryData) return [];

    let filtered = filterWebpImages(galleryData.images, {
      search: searchQuery,
      category: selectedCategory,
      aspectRatio: selectedAspectRatio,
      sizeRange: selectedSizeRange,
      orientation: selectedOrientation
    });

    return sortWebpImages(filtered, sortBy);
  }, [galleryData, searchQuery, selectedCategory, selectedAspectRatio, selectedSizeRange, selectedOrientation, sortBy]);

  // Debug logging for filter values
  useEffect(() => {
    if (galleryData) {
      console.log('Filter Values Debug:', {
        selectedCategory,
        selectedAspectRatio,
        selectedSizeRange,
        selectedOrientation,
        searchQuery,
        availableCategories: galleryData.categories.slice(0, 5),
        availableAspectRatios: galleryData.aspectRatios.slice(0, 5),
        availableSizeRanges: galleryData.sizeRanges.slice(0, 5)
      });
    }
  }, [galleryData, selectedCategory, selectedAspectRatio, selectedSizeRange, selectedOrientation, searchQuery]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredAndSortedImages.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = filteredAndSortedImages.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedAspectRatio, selectedSizeRange, selectedOrientation, sortBy]);

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedAspectRatio('');
    setSelectedSizeRange('');
    setSelectedOrientation('');
    setSortBy('name');
  };

  // Get active filter count
  const activeFilterCount =
    (searchQuery ? 1 : 0) +
    (selectedCategory ? 1 : 0) +
    (selectedAspectRatio ? 1 : 0) +
    (selectedSizeRange ? 1 : 0) +
    (selectedOrientation ? 1 : 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Loading WebP Gallery</h2>
          <p className="text-gray-600">Processing {galleryData?.totalImages || 0} images...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-6xl mb-4">🖼️</div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Error Loading Gallery</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 transition-transform duration-300 ${
        isNavVisible ? 'translate-y-0' : '-translate-y-full'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center space-x-2">
                <img src={rightfitLogo} alt="RightFit" className="h-8 w-auto" />
                <span className="font-bold text-xl text-gray-800">RightFit</span>
              </Link>
              <span className="text-gray-400">|</span>
              <span className="font-medium text-gray-700">WebP Gallery</span>
            </div>

            <div className="flex items-center space-x-4">
              <Link to="/" className="text-gray-600 hover:text-gray-900">← Back to Home</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-fixed relative bg-cover bg-center bg-fixed text-white text-center py-32 lg:py-40" style={{
        backgroundImage: "url('https://images.unsplash.com/photo-1554048612-b6a482b224ec?w=1920&h=1080&fit=crop&auto=format')"
      }}>
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        <div className="relative z-10 max-w-4xl mx-auto px-4">
          <h1 className="text-4xl lg:text-6xl font-bold mb-6">
            WebP Image Gallery
          </h1>
          <p className="text-xl lg:text-2xl mb-8 opacity-90">
            Professional WebP image collection with extensive metadata
          </p>
          <div className="flex justify-center space-x-6 text-lg">
            <div className="flex items-center">
              <FileImage className="w-5 h-5 mr-2" />
              {galleryData?.totalImages.toLocaleString() || 0} Images
            </div>
            <div className="flex items-center">
              <HardDrive className="w-5 h-5 mr-2" />
              {formatFileSize(galleryData?.metadata.totalSizeBytes || 0)} Total
            </div>
            <div className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              {galleryData?.metadata.uniqueProducts || 0} Products
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      {galleryData && (
        <section className="bg-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {galleryData.totalImages.toLocaleString()}
                  </div>
                  <div className="text-gray-600">Total Images</div>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {formatFileSize(galleryData.metadata.totalSizeBytes)}
                  </div>
                  <div className="text-gray-600">Total Size</div>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {galleryData.metadata.uniqueProducts}
                  </div>
                  <div className="text-gray-600">Unique Products</div>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="text-3xl font-bold text-orange-600 mb-2">
                    {galleryData.metadata.imageFormats.length}
                  </div>
                  <div className="text-gray-600">Formats</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <main className="bg-gray-50 min-h-screen" id="webp-gallery">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filters and Search */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <Filter className="w-5 h-5 mr-2" />
                Filters & Search
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {activeFilterCount} active
                  </Badge>
                )}
              </h2>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="text-sm"
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Clear All
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  className="text-sm"
                >
                  {viewMode === 'grid' ? <List className="w-4 h-4 mr-1" /> : <Grid3X3 className="w-4 h-4 mr-1" />}
                  {viewMode === 'grid' ? 'List' : 'Grid'}
                </Button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search images..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {galleryData?.categories
                    .filter((category) => {
                      const isValid = category &&
                                     typeof category === 'string' &&
                                     category.trim() !== '' &&
                                     category.trim().length > 0 &&
                                     category.trim() !== 'undefined' &&
                                     category.trim() !== 'null';
                      if (!isValid) {
                        console.warn('Invalid category filtered out:', {
                          original: category,
                          type: typeof category,
                          trimmed: category?.trim?.() || 'no trim method',
                          length: category?.length || 'no length'
                        });
                      }
                      return isValid;
                    })
                    .map((category) => {
                      const trimmedCategory = category.trim();
                      // Final validation before rendering
                      if (!trimmedCategory || trimmedCategory.length === 0) {
                        console.error('Empty category reached rendering stage:', category);
                        return null;
                      }
                      return (
                        <SelectItem key={trimmedCategory} value={trimmedCategory}>
                          {trimmedCategory}
                        </SelectItem>
                      );
                    })
                    .filter(Boolean)}
                </SelectContent>
              </Select>

              {/* Aspect Ratio Filter */}
              <Select value={selectedAspectRatio} onValueChange={setSelectedAspectRatio}>
                <SelectTrigger>
                  <SelectValue placeholder="All Aspect Ratios" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Aspect Ratios</SelectItem>
                  {galleryData?.aspectRatios
                    .filter((ratio) => {
                      const isValid = ratio &&
                                     typeof ratio === 'string' &&
                                     ratio.trim() !== '' &&
                                     ratio.trim().length > 0 &&
                                     ratio.trim() !== 'undefined' &&
                                     ratio.trim() !== 'null';
                      if (!isValid) {
                        console.warn('Invalid aspect ratio filtered out:', {
                          original: ratio,
                          type: typeof ratio,
                          trimmed: ratio?.trim?.() || 'no trim method',
                          length: ratio?.length || 'no length'
                        });
                      }
                      return isValid;
                    })
                    .map((ratio) => {
                      const trimmedRatio = ratio.trim();
                      // Final validation before rendering
                      if (!trimmedRatio || trimmedRatio.length === 0) {
                        console.error('Empty aspect ratio reached rendering stage:', ratio);
                        return null;
                      }
                      return (
                        <SelectItem key={trimmedRatio} value={trimmedRatio}>
                          {trimmedRatio}
                        </SelectItem>
                      );
                    })
                    .filter(Boolean)}
                </SelectContent>
              </Select>

              {/* Size Range Filter */}
              <Select value={selectedSizeRange} onValueChange={setSelectedSizeRange}>
                <SelectTrigger>
                  <SelectValue placeholder="All Sizes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Sizes</SelectItem>
                  {galleryData?.sizeRanges
                    .filter((range) => {
                      const isValid = range &&
                                     typeof range === 'string' &&
                                     range.trim() !== '' &&
                                     range.trim().length > 0 &&
                                     range.trim() !== 'undefined' &&
                                     range.trim() !== 'null';
                      if (!isValid) {
                        console.warn('Invalid size range filtered out:', {
                          original: range,
                          type: typeof range,
                          trimmed: range?.trim?.() || 'no trim method',
                          length: range?.length || 'no length'
                        });
                      }
                      return isValid;
                    })
                    .map((range) => {
                      const trimmedRange = range.trim();
                      // Final validation before rendering
                      if (!trimmedRange || trimmedRange.length === 0) {
                        console.error('Empty size range reached rendering stage:', range);
                        return null;
                      }
                      return (
                        <SelectItem key={trimmedRange} value={trimmedRange}>
                          {trimmedRange}
                        </SelectItem>
                      );
                    })
                    .filter(Boolean)}
                </SelectContent>
              </Select>

              {/* Orientation Filter */}
              <Select value={selectedOrientation} onValueChange={setSelectedOrientation}>
                <SelectTrigger>
                  <SelectValue placeholder="All Orientations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Orientations</SelectItem>
                  <SelectItem value="portrait">Portrait</SelectItem>
                  <SelectItem value="landscape">Landscape</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort By */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="size">Size</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="product">Product</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results Info */}
          <div className="mb-8 flex items-center justify-between">
            <p className="text-gray-600">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredAndSortedImages.length)} of {filteredAndSortedImages.length} images
            </p>

            {filteredAndSortedImages.length > 0 && (
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>Filtered: {filteredAndSortedImages.length}</span>
                <span>Total: {galleryData?.totalImages}</span>
              </div>
            )}
          </div>

          {/* Image Grid */}
          {paginatedItems.length > 0 ? (
            <div className={`grid gap-6 mb-16 ${
              viewMode === 'grid'
                ? 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                : 'grid-cols-1'
            }`}>
              {paginatedItems.map((image) => (
                <WebpCard key={image.id} image={image} />
              ))}
            </div>
          ) : (
            <Card className="rounded-2xl shadow-md">
              <CardContent className="p-16 text-center">
                <ImageIcon className="w-20 h-20 mx-auto mb-6 text-gray-300" />
                <h3 className="text-2xl font-semibold text-gray-600 mb-3">No Images Found</h3>
                <p className="text-gray-500 mb-6">
                  Try adjusting your filters or search terms to find more images.
                </p>
                <Button onClick={clearFilters} variant="outline">
                  Clear All Filters
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 mt-12">
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
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={page === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="w-10 h-10"
                  >
                    {page}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </main>

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
                Professional interior design solutions with cutting-edge WebP image technology.
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
    </ErrorBoundary>
  );
}
