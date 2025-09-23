import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import rightfitLogo from '@/assets/logo.png';
import { BoardCard } from '../components/ui/BoardCard';
import { ColourCard } from '../components/ui/ColourCard';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Package, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  EggerBoardsData,
  EggerBoardProduct,
  parseEggerBoardsCSV
} from '../utils/eggerBoardsData';
import {
  ColoursData,
  ColourFinish,
  parseColoursCSV
} from '../utils/coloursData';

export default function EggerBoards() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [activeTab, setActiveTab] = useState<'materials' | 'finishes'>('materials');
  const [boardsData, setBoardsData] = useState<EggerBoardsData | null>(null);
  const [coloursData, setColoursData] = useState<ColoursData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20); // Show 20 items per page

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      setIsNavVisible(currentY <= lastScrollY);
      setLastScrollY(currentY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Load CSV data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load both datasets
        const [boardsResponse, coloursResponse] = await Promise.all([
          fetch('/Boards.csv'),
          fetch('/colours.csv')
        ]);

        // Load boards data
        if (boardsResponse.ok) {
          const boardsCsvText = await boardsResponse.text();
          const parsedBoardsData = parseEggerBoardsCSV(boardsCsvText);
          setBoardsData(parsedBoardsData);
        }

        // Load colours data
        if (coloursResponse.ok) {
          const coloursCsvText = await coloursResponse.text();
          const parsedColoursData = parseColoursCSV(coloursCsvText);
          setColoursData(parsedColoursData);
        } else {
          console.warn('Could not load colours data - finishes tab may not work');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);


  // Process data for display based on active tab
  const processedData = useMemo(() => {
    if (activeTab === 'materials' && boardsData) {
      return {
        items: boardsData.products.sort((a, b) => a.decor_name.localeCompare(b.decor_name)),
        totalItems: boardsData.products.length,
        categories: boardsData.decorCategories.length,
        itemType: 'materials'
      };
    } else if (activeTab === 'finishes' && coloursData) {
      return {
        items: coloursData.finishes.sort((a, b) => a.name.localeCompare(b.name)),
        totalItems: coloursData.totalFinishes,
        categories: coloursData.categories.length,
        itemType: 'finishes'
      };
    }
    return { items: [], totalItems: 0, categories: 0, itemType: 'materials' };
  }, [activeTab, boardsData, coloursData]);

  // Reset to page 1 when tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

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
          <p className="text-lg text-gray-600">Loading EGGER Boards...</p>
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
      {/* Floating Navbar */}
      <header
        className={`fixed top-0 left-0 w-full z-50 transition-transform duration-300 bg-white border-b border-gray-200 ${
          isNavVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <Link to="/" className="flex items-center gap-3">
              <img src={rightfitLogo} alt="RightFit Interiors logo" className="h-16 w-auto" />
            </Link>

            <button
              className="lg:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-controls="nav-menu"
              aria-expanded={isMenuOpen}
            >
              <span className="block w-6 h-0.5 bg-gray-800 mb-1.5 transition-all"></span>
              <span className="block w-6 h-0.5 bg-gray-800 mb-1.5 transition-all"></span>
              <span className="block w-6 h-0.5 bg-gray-800 transition-all"></span>
            </button>

            <nav className={`lg:flex lg:items-center lg:gap-6 ${isMenuOpen ? 'block' : 'hidden'} lg:block absolute lg:relative top-full lg:top-auto left-4 lg:left-auto right-4 lg:right-auto bg-white lg:bg-transparent border lg:border-0 rounded-lg lg:rounded-none shadow-lg lg:shadow-none p-3 lg:p-0`}>
              <a href="/" className="block lg:inline py-2 lg:py-0 text-gray-800 hover:text-blue-600 transition-colors">Home</a>
              <a href="#services" className="block lg:inline py-2 lg:py-0 text-gray-800 hover:text-blue-600 transition-colors">Services</a>
              <a href="#gallery" className="block lg:inline py-2 lg:py-0 text-gray-800 hover:text-blue-600 transition-colors">Gallery</a>
              <Link to="/blog" className="block lg:inline py-2 lg:py-0 text-gray-800 hover:text-blue-600 transition-colors">Blog</Link>
              <Link to="/egger-boards" className="block lg:inline py-2 lg:py-0 text-blue-600 font-medium">Materials & Finishes</Link>
              <a href="#contact" className="block lg:inline py-2 lg:py-0 text-gray-800 hover:text-blue-600 transition-colors">Contact</a>
              <Link to="/app" className="block lg:inline py-2 lg:py-0 text-gray-800 hover:text-blue-600 transition-colors font-medium">Interior Designer</Link>
              <a href="#contact" className="block lg:inline mt-2 lg:mt-0 bg-blue-600 text-white px-4 py-2 rounded-full font-semibold hover:bg-blue-700 transition-colors">Free consultation</a>
            </nav>
          </div>
        </div>
      </header>

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
              Materials ({processedData.itemType === 'materials' ? processedData.totalItems : (boardsData?.products.length || 0)})
            </button>
            <button
              onClick={() => setActiveTab('finishes')}
              className={`py-4 px-6 font-medium text-lg border-b-2 transition-colors ${
                activeTab === 'finishes'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Finishes ({processedData.itemType === 'finishes' ? processedData.totalItems : (coloursData?.totalFinishes || 0)})
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="bg-white" id="materials">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Dynamic Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {processedData.totalItems}
              </div>
              <div className="text-gray-600">
                {activeTab === 'materials' ? 'Premium Materials' : 'Paint Colours'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {processedData.categories}
              </div>
              <div className="text-gray-600">Categories</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                132
              </div>
              <div className="text-gray-600">Years Experience</div>
            </div>
          </div>

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
                  const material = item as EggerBoardProduct;
                  return <BoardCard key={material.decor_id} product={material} />;
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

