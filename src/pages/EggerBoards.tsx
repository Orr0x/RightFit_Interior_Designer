import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import StandardNavigation from '../components/shared/StandardNavigation';
import { BoardCard } from '../components/ui/BoardCard';
import { ColourCard } from '../components/ui/ColourCard';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Package, ChevronLeft, ChevronRight, Clock, Star, Users, DollarSign, Search, Filter, X, SlidersHorizontal } from 'lucide-react';
import {
  ColoursData,
  ColourFinish,
  parseColoursCSV
} from '../utils/coloursData';
import {
  WebPDecorGroup,
  parseWebPImagesCSV
} from '../utils/webpImagesData';
import {
  EggerBoardsData,
  EggerBoardProduct,
  parseEggerBoardsCSV
} from '../utils/eggerBoardsData';
import { eggerDataService, EnhancedEggerProduct } from '../services/EggerDataService';
import { farrowBallDataService, FarrowBallFinish } from '../services/FarrowBallDataService';

export default function EggerBoards() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'materials' | 'finishes'>('materials');
  
  // Data state
  const [webpData, setWebpData] = useState<{ decors: WebPDecorGroup[], categories: string[], totalDecors: number } | null>(null);
  const [boardsData, setBoardsData] = useState<EggerBoardsData | null>(null);
  const [coloursData, setColoursData] = useState<ColoursData | null>(null);
  const [databaseProducts, setDatabaseProducts] = useState<EnhancedEggerProduct[]>([]);
  const [databaseFinishes, setDatabaseFinishes] = useState<FarrowBallFinish[]>([]);
  const [finishesDataSource, setFinishesDataSource] = useState<'database' | 'csv' | 'hybrid' | 'unknown'>('unknown');
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [dataSource, setDataSource] = useState<'database' | 'csv' | 'unknown'>('unknown');
  const [retryCount, setRetryCount] = useState(0);
  
  // Handle tab parameter from URL
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'finishes') {
      setActiveTab('finishes');
    } else if (tabParam === 'materials') {
      setActiveTab('materials');
    }
  }, [searchParams]);
  
  // Retry database connection periodically
  useEffect(() => {
    if (dataSource === 'csv' && retryCount < 3) {
      const retryTimer = setTimeout(() => {
        console.log(`🔄 Retrying database connection (attempt ${retryCount + 1}/3)...`);
        setRetryCount(prev => prev + 1);
        setLoading(true);
      }, 30000); // Retry every 30 seconds
      
      return () => clearTimeout(retryTimer);
    }
  }, [dataSource, retryCount]);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTexture, setSelectedTexture] = useState<string>('all');
  const [selectedColorFamily, setSelectedColorFamily] = useState<string>('all');
  const [selectedAvailability, setSelectedAvailability] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'newest' | 'popular'>('name');
  const [showFilters, setShowFilters] = useState(false);


  // Load data on component mount - try database first, fallback to CSV
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try database first with timeout and reduced data
        let databaseLoaded = false;
        try {
          console.log('🔄 Attempting to load data from database (optimized)...');
          
          // Load all materials from database
          const databasePromise = eggerDataService.getDecors(1, 0); // Load all records
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Database request timeout')), 15000) // Longer timeout for all data
          );
          
          const result = await Promise.race([databasePromise, timeoutPromise]) as any;
          
          if (result.data.length > 0) {
            console.log('✅ Database data loaded successfully:', result.data.length, 'products');
            setDatabaseProducts(result.data);
            setDataSource('database');
            databaseLoaded = true;
          } else {
            console.warn('⚠️ Database returned empty result, falling back to CSV');
          }
        } catch (dbError) {
          console.warn('⚠️ Database temporarily unavailable, using CSV data');
          console.warn('Reason:', dbError.message);
          
          // If it's a resource error, we'll use CSV for now
          if (dbError.message.includes('INSUFFICIENT_RESOURCES') || 
              dbError.message.includes('timeout')) {
            console.log('📄 Using CSV data due to Supabase limits (will retry database later)');
          }
        }

        // Load finishes data from database
        try {
          console.log('🔄 Loading Farrow & Ball finishes from database...');
          const finishesData = await farrowBallDataService.getAllFinishes();
          
          console.log('🔍 Raw finishes data from database:', {
            length: finishesData.length,
            firstItem: finishesData[0],
            sampleIds: finishesData.slice(0, 3).map(f => f.finish_id)
          });
          
          if (finishesData.length > 0) {
            console.log('✅ Finishes database data loaded successfully:', finishesData.length, 'finishes');
            setDatabaseFinishes(finishesData);
            setFinishesDataSource('database');
          } else {
            console.warn('⚠️ Finishes database returned empty result, falling back to CSV');
            setFinishesDataSource('csv');
          }
        } catch (finishesDbError) {
          console.warn('⚠️ Finishes database temporarily unavailable, using CSV data');
          console.warn('Reason:', finishesDbError);
          setFinishesDataSource('csv');
        }

        // Always load colours data (needed for finishes tab)
        // Load materials CSV data only if database wasn't loaded
        const fetchPromises = [fetch('/colours.csv')];
        
        if (!databaseLoaded) {
          // console.log('🔄 Loading materials data from CSV files...');
          setDataSource('csv');
          fetchPromises.push(fetch('/webp-images.csv'), fetch('/Boards.csv'));
        } else {
          // console.log('🔄 Loading only colours data (materials from database)...');
        }

        const responses = await Promise.all(fetchPromises);
        const coloursResponse = responses[0];
        const webpResponse = databaseLoaded ? null : responses[1];
        const boardsResponse = databaseLoaded ? null : responses[2];

        console.log('📡 Fetch responses:', {
          webp: webpResponse ? { ok: webpResponse.ok, status: webpResponse.status } : 'skipped (database)',
          boards: boardsResponse ? { ok: boardsResponse.ok, status: boardsResponse.status } : 'skipped (database)',
          colours: { ok: coloursResponse.ok, status: coloursResponse.status }
        });

        // Read response texts (only once per response!)
        let webpCsvText = '';
        let boardsCsvText = '';
        let coloursCsvText = '';

        if (webpResponse && webpResponse.ok) {
          webpCsvText = await webpResponse.text();
        }

        if (boardsResponse && boardsResponse.ok) {
          boardsCsvText = await boardsResponse.text();
        }

        if (coloursResponse.ok) {
          coloursCsvText = await coloursResponse.text();
          console.log('📄 Colours CSV loaded, length:', coloursCsvText.length);
        } else {
          console.error('❌ Colours CSV fetch failed:', coloursResponse.status, coloursResponse.statusText);
        }

        // Load WebP data (combined with boards data)
        if (webpCsvText) {
          const parsedWebpData = parseWebPImagesCSV(webpCsvText, boardsCsvText);
          setWebpData(parsedWebpData);
        }

        // Load boards data for fallback
        if (boardsCsvText) {
          const parsedBoardsData = parseEggerBoardsCSV(boardsCsvText);
          setBoardsData(parsedBoardsData);
        }

        // Load colours data
        if (coloursCsvText) {
          console.log('📄 Colours CSV text length:', coloursCsvText.length);
          const parsedColoursData = parseColoursCSV(coloursCsvText);
          console.log('✅ Colours data loaded:', {
            totalFinishes: parsedColoursData.totalFinishes,
            categories: parsedColoursData.categories,
            firstFinish: parsedColoursData.finishes[0]
          });
          setColoursData(parsedColoursData);
          console.log('🔧 Colours data state set, should be available now');
        } else {
          console.warn('❌ Could not load colours data - finishes tab may not work');
        }

        // console.log('✅ CSV data loaded successfully');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);


  // Extract filter options from data
  const filterOptions = useMemo(() => {
    if (activeTab === 'finishes' && coloursData) {
      // Handle finishes data
      const categories = [...new Set(coloursData.finishes.map(f => f.category).filter(Boolean))];
      
      return {
        categories: categories.sort(),
        textures: [], // Finishes don't have textures
        colorFamilies: [], // Finishes don't have color families in the same way
        availabilityStatuses: [] // Finishes don't have availability status
      };
    } else if (dataSource === 'database' && databaseProducts.length > 0) {
      const categories = [...new Set(databaseProducts.map(p => p.category).filter(Boolean))];
      const textures = [...new Set(databaseProducts.map(p => p.texture).filter(Boolean))];
      const colorFamilies = [...new Set(databaseProducts.map(p => p.color_family).filter(Boolean))];
      const availabilityStatuses = [...new Set(
        databaseProducts.flatMap(p => 
          p.availability?.map(a => a.availability_status) || []
        ).filter(Boolean)
      )];

      return {
        categories: categories.sort(),
        textures: textures.sort(),
        colorFamilies: colorFamilies.sort(),
        availabilityStatuses: availabilityStatuses.sort()
      };
    } else if (webpData && boardsData) {
      // Extract from CSV data
      const categories = [...new Set(webpData.categories)];
      const textures = [...new Set(webpData.decors.map(d => d.texture).filter(Boolean))];
      
      return {
        categories: categories.sort(),
        textures: textures.sort(),
        colorFamilies: ['Grey', 'White', 'Brown', 'Black', 'Beige', 'Blue'],
        availabilityStatuses: ['in_stock', 'limited', 'out_of_stock']
      };
    }
    
    return {
      categories: [],
      textures: [],
      colorFamilies: [],
      availabilityStatuses: []
    };
  }, [activeTab, dataSource, databaseProducts, webpData, boardsData, coloursData]);

  // Filter and search logic
  const filteredProducts = useMemo(() => {
    let products: any[] = [];
    
    if (dataSource === 'database' && activeTab === 'materials') {
      products = [...databaseProducts];
    } else if (dataSource === 'csv' && activeTab === 'materials' && webpData) {
      products = [...webpData.decors];
    } else if (activeTab === 'finishes') {
      console.log('🔍 Finishes tab - checking data sources:', {
        finishesDataSource,
        databaseFinishesLength: databaseFinishes.length,
        coloursDataLength: coloursData?.finishes?.length || 0
      });
      
      if (finishesDataSource === 'database' && databaseFinishes.length > 0) {
        console.log('🔍 Loading finishes data from database only:', { 
          databaseCount: databaseFinishes.length
        });
        
        // Convert database data to ColourFinish format
        products = databaseFinishes.map(dbFinish => {
          // Generate colour_id the same way CSV parser does
          const colour_id = `${dbFinish.color_name.toLowerCase().replace(/\s+/g, '-')}-${dbFinish.color_number}`;
          
          const result = {
            colour_id: colour_id,
            colour_name: dbFinish.color_name,
            colour_number: dbFinish.color_number,
            product_url: dbFinish.product_url,
            // Use color hex as thumbnail (will be styled as color swatch)
            thumb_url: dbFinish.main_color_hex,
            hover_url: dbFinish.main_color_hex,
            description: dbFinish.description || '',
            hex: dbFinish.main_color_hex,
            rgb: dbFinish.main_color_rgb
          };
          
          // Debug logging for first few items
          if (products.length < 3) {
            console.log('🔧 Database to ColourFinish conversion:', {
              original: dbFinish.finish_id,
              generated: colour_id,
              url: `/finishes/${colour_id}`,
              result
            });
          }
          
          return result;
        });
        
        // Set data source to database
        setFinishesDataSource('database');
      } else if (coloursData) {
        console.log('🔍 Loading finishes data from CSV only:', { coloursData, finishesCount: coloursData.finishes.length });
        products = [...coloursData.finishes];
      } else {
        console.log('❌ No finishes data available:', { coloursData, databaseFinishes, finishesDataSource, activeTab });
      }
    }

    // Apply search filter
    if (searchQuery) {
      products = products.filter(product => {
        let searchableText = '';
        
        if (activeTab === 'finishes') {
          // Handle finishes (ColourFinish objects)
          searchableText = [
            product.colour_name || product.name || '',
            product.number || '',
            product.description || '',
            product.category || ''
          ].join(' ').toLowerCase();
        } else {
          // Handle materials (Egger products)
          searchableText = [
            product.decor_name || product.decorName || product.name || '',
            product.decor_id || product.decorId || '',
            product.decor || '',
            product.texture || '',
            product.category || '',
            product.color_family || ''
          ].join(' ').toLowerCase();
        }
        
        return searchableText.includes(searchQuery.toLowerCase());
      });
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      products = products.filter(product => {
        if (activeTab === 'finishes') {
          // Handle finishes (ColourFinish objects)
          return (product.category || product.colour_name || product.name || '').toLowerCase().includes(selectedCategory.toLowerCase());
        } else {
          // Handle materials (Egger products)
          return (product.category || product.decorName || product.name || '').toLowerCase().includes(selectedCategory.toLowerCase());
        }
      });
    }

    // Apply texture filter (only for materials)
    if (selectedTexture !== 'all' && activeTab === 'materials') {
      products = products.filter(product => 
        product.texture === selectedTexture
      );
    }

    // Apply color family filter (only for materials)
    if (selectedColorFamily !== 'all' && activeTab === 'materials') {
      products = products.filter(product => 
        product.color_family === selectedColorFamily
      );
    }

    // Apply availability filter (database only)
    if (selectedAvailability !== 'all' && dataSource === 'database') {
      products = products.filter(product => {
        return product.availability?.some((a: any) => a.availability_status === selectedAvailability);
      });
    }

    // Apply sorting
    products.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          const nameA = a.decor_name || a.decorName || a.name || '';
          const nameB = b.decor_name || b.decorName || b.name || '';
          return nameA.localeCompare(nameB);
        case 'newest':
          const dateA = new Date(a.created_at || a.updated_at || 0);
          const dateB = new Date(b.created_at || b.updated_at || 0);
          return dateB.getTime() - dateA.getTime();
        case 'popular':
          // Mock popularity based on combinations count or image count
          const popularityA = (a.combinations?.length || 0) + (a.images?.length || 0);
          const popularityB = (b.combinations?.length || 0) + (b.images?.length || 0);
          return popularityB - popularityA;
        default:
          return 0;
      }
    });

    return products;
  }, [
    dataSource,
    activeTab,
    databaseProducts,
    webpData,
    coloursData,
    databaseFinishes,
    finishesDataSource,
    searchQuery,
    selectedCategory,
    selectedTexture,
    selectedColorFamily,
    selectedAvailability,
    sortBy
  ]);

  // Process data for display
  const processedData = useMemo(() => {
    return {
      items: filteredProducts,
      totalItems: filteredProducts.length,
      categories: filterOptions.categories.length,
      itemType: activeTab
    };
  }, [filteredProducts, filterOptions.categories.length, activeTab]);

  // Reset to page 1 when tab changes or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, selectedCategory, selectedTexture, selectedColorFamily, selectedAvailability, sortBy]);

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedTexture('all');
    setSelectedColorFamily('all');
    setSelectedAvailability('all');
    setSortBy('name');
  };

  // Count active filters
  const activeFiltersCount = [
    searchQuery,
    selectedCategory !== 'all' ? selectedCategory : null,
    selectedTexture !== 'all' ? selectedTexture : null,
    selectedColorFamily !== 'all' ? selectedColorFamily : null,
    selectedAvailability !== 'all' ? selectedAvailability : null
  ].filter(Boolean).length;

  // Pagination calculations
  const totalPages = Math.ceil(processedData.items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = processedData.items.slice(startIndex, endIndex);

  // Preload images for next page for smoother navigation
  useEffect(() => {
    if (processedData.items.length === 0) return;

    const preloadNextPage = () => {
      const nextPageStart = currentPage * itemsPerPage;
      const nextPageEnd = Math.min(nextPageStart + itemsPerPage, processedData.items.length);

      if (nextPageStart < processedData.items.length) {
        // Preload first image of each item on the next page
        for (let i = nextPageStart; i < nextPageEnd && i < processedData.items.length; i++) {
          const item = processedData.items[i];
          if (processedData.itemType === 'materials') {
            const materialItem = item as EggerBoardProduct;
            if (materialItem.images.length > 0) {
              const img = new Image();
              img.src = materialItem.images[0];
            }
          } else if (processedData.itemType === 'finishes') {
            const finishItem = item as ColourFinish;
            if (finishItem.thumb_url) {
              const img = new Image();
              img.src = finishItem.thumb_url;
            }
          }
        }
      }
    };

    preloadNextPage();
  }, [currentPage, processedData, itemsPerPage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg text-gray-600">Loading Materials...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">Failed to load boards data</p>
            <p className="text-gray-600 text-sm">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      {/* Standard Navigation */}
      <StandardNavigation 
        currentPage="materials" 
        dataSource={activeTab === 'finishes' ? finishesDataSource : dataSource}
      />

      {/* Hero Section */}
      <section
        className="hero-fixed relative bg-cover bg-center bg-fixed text-white text-center py-32 lg:py-40"
        style={{
          backgroundImage: "url('https://c.pxhere.com/photos/5c/3f/photo-1606932.jpg!d')"
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-55"></div>
        <div className="relative z-10 container mx-auto px-4">
          <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 leading-tight">
            {activeTab === 'materials' ? 'Premium Materials Collection' : 'Premium Finishes Collection'}
          </h1>
          <p className="text-xl lg:text-2xl font-light mb-8 text-gray-200 max-w-3xl mx-auto">
            {activeTab === 'materials'
              ? 'Explore our extensive collection of EGGER MFC boards and premium materials for your furniture and interior design projects.'
              : 'Discover our extensive range of colours and finishes for your interior design projects. From bold statement colours to subtle neutrals.'
            }
          </p>
          <a href="#materials" className="inline-block bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors shadow-lg">
            Explore {activeTab === 'materials' ? 'Materials' : 'Finishes'}
          </a>
        </div>

        {/* Feature row overlay */}
        <div className="relative z-10 flex flex-wrap justify-center gap-6 mt-16 py-8 bg-white bg-opacity-85 text-gray-800 border-t border-b border-gray-200">
          <div className="flex-1 text-center max-w-64 min-w-48">
            <div className="font-semibold mb-1">
              {activeTab === 'materials' ? 'Premium Quality' : 'Farrow & Ball Collection'}
            </div>
            <div className="text-sm text-gray-600">
              {activeTab === 'materials'
                ? 'EGGER MFC boards for professional results.'
                : 'Premium paint colours from the renowned British manufacturer.'
              }
            </div>
          </div>
          <div className="flex-1 text-center max-w-64 min-w-48">
            <div className="font-semibold mb-1">
              {activeTab === 'materials' ? 'Extensive Range' : 'Heritage Quality'}
            </div>
            <div className="text-sm text-gray-600">
              {processedData.totalItems} {activeTab === 'materials' ? 'materials' : 'finishes'} across {processedData.categories} categories.
            </div>
          </div>
          <div className="flex-1 text-center max-w-64 min-w-48">
            <div className="font-semibold mb-1">Expert Selection</div>
            <div className="text-sm text-gray-600">Curated for furniture and interior design.</div>
          </div>
        </div>
      </section>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-20 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 justify-center">
            <button
              onClick={() => setActiveTab('materials')}
              className={`py-4 px-6 font-medium text-lg border-b-2 transition-colors ${
                activeTab === 'materials'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Materials ({dataSource === 'database' ? databaseProducts.length : (webpData?.totalDecors || 0)})
            </button>
            <button
              onClick={() => setActiveTab('finishes')}
              className={`py-4 px-6 font-medium text-lg border-b-2 transition-colors ${
                activeTab === 'finishes'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Finishes ({coloursData?.totalFinishes || 0})
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Search Bar */}
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-4">
              {/* Sort Dropdown */}
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'name' | 'newest' | 'popular')}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name A-Z</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                </SelectContent>
              </Select>

              {/* Filter Toggle */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="relative"
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge className="ml-2 bg-blue-600 text-white text-xs px-2 py-0.5">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>

              {/* Clear Filters */}
              {activeFiltersCount > 0 && (
                <Button
                  variant="ghost"
                  onClick={clearFilters}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Clear All
                </Button>
              )}
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Category Filter */}
                {filterOptions.categories.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {filterOptions.categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Texture Filter */}
                {filterOptions.textures.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Texture</label>
                    <Select value={selectedTexture} onValueChange={setSelectedTexture}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Textures" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Textures</SelectItem>
                        {filterOptions.textures.map((texture) => (
                          <SelectItem key={texture} value={texture}>
                            {texture}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Color Family Filter */}
                {filterOptions.colorFamilies.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Color Family</label>
                    <Select value={selectedColorFamily} onValueChange={setSelectedColorFamily}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Colors" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Colors</SelectItem>
                        {filterOptions.colorFamilies.map((color) => (
                          <SelectItem key={color} value={color}>
                            {color}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Availability Filter (Database only) */}
                {dataSource === 'database' && filterOptions.availabilityStatuses.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
                    <Select value={selectedAvailability} onValueChange={setSelectedAvailability}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        {filterOptions.availabilityStatuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status.replace('_', ' ').toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Results Summary */}
          <div className="flex items-center justify-between mb-6">
            <div className="text-gray-600">
              Showing <span className="font-medium">{Math.min(startIndex + 1, processedData.totalItems)}</span> to{' '}
              <span className="font-medium">{Math.min(endIndex, processedData.totalItems)}</span> of{' '}
              <span className="font-medium">{processedData.totalItems}</span> {activeTab}
              {activeFiltersCount > 0 && (
                <span className="ml-2 text-blue-600">
                  ({activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} applied)
                </span>
              )}
            </div>

            {/* Active Filters Tags */}
            {activeFiltersCount > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                {searchQuery && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Search: "{searchQuery}"
                    <button onClick={() => setSearchQuery('')}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {selectedCategory !== 'all' && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Category: {selectedCategory}
                    <button onClick={() => setSelectedCategory('all')}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {selectedTexture !== 'all' && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Texture: {selectedTexture}
                    <button onClick={() => setSelectedTexture('all')}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {selectedColorFamily !== 'all' && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Color: {selectedColorFamily}
                    <button onClick={() => setSelectedColorFamily('all')}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {selectedAvailability !== 'all' && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Status: {selectedAvailability.replace('_', ' ').toUpperCase()}
                    <button onClick={() => setSelectedAvailability('all')}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="bg-white" id="materials">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

          {/* Top Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-3 mb-8">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="h-12 px-6"
              >
                <ChevronLeft className="w-5 h-5 mr-2" />
                Previous
              </Button>

              {/* Page numbers */}
              <div className="flex items-center space-x-2">
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 7) {
                    pageNum = i + 1;
                  } else if (currentPage <= 4) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 3) {
                    pageNum = totalPages - 6 + i;
                  } else {
                    pageNum = currentPage - 3 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="lg"
                      onClick={() => setCurrentPage(pageNum)}
                      className="min-w-[50px] h-12"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="lg"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="h-12 px-6"
              >
                Next
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          )}

          {/* Results Info */}
          <div className="mb-8 flex items-center justify-center">
            <p className="text-gray-600 text-lg">
              Showing {startIndex + 1}-{Math.min(endIndex, processedData.items.length)} of {processedData.items.length} {activeTab === 'materials' ? 'materials' : 'finishes'}
            </p>
          </div>

          {/* Dynamic Content Grid */}
          {paginatedItems.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              {paginatedItems.map((item) => {
                if (activeTab === 'materials') {
                  if (dataSource === 'database') {
                    const enhancedProduct = item as EnhancedEggerProduct;
                    return <EnhancedBoardCard key={enhancedProduct.decor_id} product={enhancedProduct} />;
                  } else {
                    const decorGroup = item as WebPDecorGroup;
                    return <BoardCard key={decorGroup.decor_id} decorGroup={decorGroup} />;
                  }
                } else {
                  const finish = item as ColourFinish;
                  return <ColourCard key={finish.colour_id} finish={finish} />;
                }
              })}
            </div>
          ) : (
            <Card className="rounded-2xl shadow-md">
              <CardContent className="p-16 text-center">
                <Package className="w-20 h-20 mx-auto mb-6 text-gray-300" />
                <h3 className="text-2xl font-semibold text-gray-600 mb-3">
                  No {activeTab === 'materials' ? 'materials' : 'finishes'} found
                </h3>
                <p className="text-gray-500 text-lg">
                  Unable to load the {activeTab === 'materials' ? 'materials' : 'finishes'} collection at this time.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-3">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="h-12 px-6"
              >
                <ChevronLeft className="w-5 h-5 mr-2" />
                Previous
              </Button>

              {/* Page numbers */}
              <div className="flex items-center space-x-2">
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 7) {
                    pageNum = i + 1;
                  } else if (currentPage <= 4) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 3) {
                    pageNum = totalPages - 6 + i;
                  } else {
                    pageNum = currentPage - 3 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="lg"
                      onClick={() => setCurrentPage(pageNum)}
                      className="min-w-[50px] h-12"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="lg"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="h-12 px-6"
              >
                Next
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Website Footer */}
      <footer className="bg-green-700 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
            <div>
              <h3 className="text-xl font-semibold mb-4">Transformations</h3>
              <p className="text-gray-200 mb-6">Expert kitchen and bathroom renovations for homeowners.</p>
              <div className="flex gap-4">
                <a href="https://www.facebook.com/" className="text-gray-200 hover:text-white">Facebook</a>
                <a href="https://www.instagram.com/" className="text-gray-200 hover:text-white">Instagram</a>
                <a href="https://www.tiktok.com/" className="text-gray-200 hover:text-white">TikTok</a>
                <a href="https://twitter.com/" className="text-gray-200 hover:text-white">X</a>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4">Get in touch</h3>
              <div className="space-y-2 text-gray-200">
                <div>07838 481 948</div>
                <div>
                  <a href="mailto:Contact-Us@rightfit-kitchens.co.uk" className="hover:text-white">
                    Contact-Us@rightfit-kitchens.co.uk
                  </a>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4">Service</h3>
              <form className="space-y-3">
                <input
                  type="email"
                  placeholder="Your email for contact"
                  required
                  className="w-full px-4 py-3 rounded-lg text-gray-800"
                />
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Submit your request now
                </button>
              </form>
            </div>
          </div>

          <div className="border-t border-white border-opacity-20 mt-12 pt-8 text-center">
            <p className="text-gray-200">© {new Date().getFullYear()}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
}

// Enhanced Board Card Component for Database Products
function EnhancedBoardCard({ product }: { product: EnhancedEggerProduct }) {
  return (
    <Card className="group hover:shadow-xl transition-all duration-300 bg-white rounded-2xl overflow-hidden border border-gray-100">
      <div className="relative">
        {product.images.length > 0 ? (
          <div className="relative w-full h-64 overflow-hidden">
            <img
              src={product.images[0].image_url}
              alt={product.decor_name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            {product.images.length > 1 && (
              <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-xs">
                +{product.images.length - 1} more
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400">No image</span>
          </div>
        )}
        
        {/* Enhanced badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {product.has_combinations && (
            <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
              <Star className="w-4 h-4" />
              {product.combination_count} matches
            </div>
          )}
          {product.availability.some(a => a.availability_status === 'in_stock') && (
            <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              In Stock
            </div>
          )}
        </div>

        {/* Price badge */}
        {product.cost_per_sqm && (
          <div className="absolute top-4 right-4 bg-white text-gray-900 px-3 py-1 rounded-full text-sm font-medium shadow-md">
            £{product.cost_per_sqm.toFixed(2)}/m²
          </div>
        )}
      </div>

      <CardContent className="p-6">
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
            {product.decor_name}
          </h3>
          
          <p className="text-sm text-gray-600 font-mono">{product.decor_id}</p>
          
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="bg-gray-100 px-2 py-1 rounded">{product.texture}</span>
            {product.category && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">{product.category}</span>
            )}
          </div>

          {/* Enhanced info */}
          <div className="space-y-2 text-sm text-gray-600">
            {product.availability.length > 0 && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{product.availability[0].lead_time_days} days lead time</span>
              </div>
            )}
            
            {product.interior_match && (
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{product.interior_match.room_types.join(', ')}</span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-4">
            <Button asChild className="flex-1 bg-blue-600 hover:bg-blue-700">
              <Link to={`/product/${product.decor_id}`}>
                View Details
              </Link>
            </Button>
            {product.product_page_url && (
              <Button
                variant="outline"
                onClick={() => window.open(product.product_page_url, '_blank')}
                className="px-4"
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

