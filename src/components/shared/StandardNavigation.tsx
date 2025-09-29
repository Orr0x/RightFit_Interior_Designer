import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import rightfitLogo from '@/assets/logo.png';
import { Badge } from '../ui/badge';
import { Database, FileText, Package, ArrowLeft } from 'lucide-react';

interface StandardNavigationProps {
  currentPage?: string;
  showBackButton?: boolean;
  backButtonText?: string;
  backButtonLink?: string;
  dataSource?: 'database' | 'csv' | 'unknown';
  additionalContent?: React.ReactNode;
  className?: string;
}

export default function StandardNavigation({
  currentPage = 'home',
  showBackButton = false,
  backButtonText = 'Back',
  backButtonLink = '/',
  dataSource = 'unknown',
  additionalContent,
  className = ''
}: StandardNavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      setIsNavVisible(currentY <= lastScrollY);
      setLastScrollY(currentY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const getDataSourceIndicator = () => {
    if (dataSource === 'unknown') return null;
    
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600">
        {dataSource === 'database' ? (
          <>
            <Database className="w-4 h-4 text-green-600" />
            <span className="text-green-600 font-medium">Database</span>
          </>
        ) : dataSource === 'csv' ? (
          <>
            <FileText className="w-4 h-4 text-orange-600" />
            <span className="text-orange-600 font-medium">CSV Files</span>
          </>
        ) : (
          <>
            <Package className="w-4 h-4 text-gray-400" />
            <span className="text-gray-400">Loading...</span>
          </>
        )}
      </div>
    );
  };

  return (
    <header 
      className={`fixed top-0 left-0 w-full z-50 transition-transform duration-300 bg-white border-b border-gray-200 ${
        isNavVisible ? 'translate-y-0' : '-translate-y-full'
      } ${className}`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          {/* Logo and Back Button */}
          <div className="flex items-center gap-4">
            {showBackButton && (
              <Link 
                to={backButtonLink} 
                className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                {backButtonText}
              </Link>
            )}
            
            <Link to="/" className="flex items-center gap-3">
              <img src={rightfitLogo} alt="RightFit Interiors logo" className="h-16 w-auto" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
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

          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:items-center lg:gap-6">
            <a href="/" className={`py-2 text-gray-800 hover:text-blue-600 transition-colors ${
              currentPage === 'home' ? 'text-blue-600 font-medium' : ''
            }`}>Home</a>
            <a href="#services" className="py-2 text-gray-800 hover:text-blue-600 transition-colors">Services</a>
            <a href="#gallery" className="py-2 text-gray-800 hover:text-blue-600 transition-colors">Gallery</a>
            <Link to="/blog" className="py-2 text-gray-800 hover:text-blue-600 transition-colors">Blog</Link>
            <Link to="/egger-boards" className={`py-2 text-gray-800 hover:text-blue-600 transition-colors ${
              currentPage === 'materials' ? 'text-blue-600 font-medium' : ''
            }`}>Materials & Finishes</Link>
            <a href="#contact" className="py-2 text-gray-800 hover:text-blue-600 transition-colors">Contact</a>
            <Link to="/app" className="py-2 text-gray-800 hover:text-blue-600 transition-colors font-medium">Interior Designer</Link>
            <a href="#contact" className="bg-blue-600 text-white px-4 py-2 rounded-full font-semibold hover:bg-blue-700 transition-colors">Free consultation</a>
          </div>

          {/* Right Side Content */}
          <div className="hidden lg:flex lg:items-center lg:gap-4">
            {getDataSourceIndicator()}
            {additionalContent}
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <nav 
          id="nav-menu"
          className={`lg:hidden ${isMenuOpen ? 'block' : 'hidden'} absolute top-full left-4 right-4 bg-white border rounded-lg shadow-lg p-3`}
        >
          <a href="/" className={`block py-2 text-gray-800 hover:text-blue-600 transition-colors ${
            currentPage === 'home' ? 'text-blue-600 font-medium' : ''
          }`}>Home</a>
          <a href="#services" className="block py-2 text-gray-800 hover:text-blue-600 transition-colors">Services</a>
          <a href="#gallery" className="block py-2 text-gray-800 hover:text-blue-600 transition-colors">Gallery</a>
          <Link to="/blog" className="block py-2 text-gray-800 hover:text-blue-600 transition-colors">Blog</Link>
          <Link to="/egger-boards" className={`block py-2 text-gray-800 hover:text-blue-600 transition-colors ${
            currentPage === 'materials' ? 'text-blue-600 font-medium' : ''
          }`}>Materials & Finishes</Link>
          <a href="#contact" className="block py-2 text-gray-800 hover:text-blue-600 transition-colors">Contact</a>
          <Link to="/app" className="block py-2 text-gray-800 hover:text-blue-600 transition-colors font-medium">Interior Designer</Link>
          <a href="#contact" className="block mt-2 bg-blue-600 text-white px-4 py-2 rounded-full font-semibold hover:bg-blue-700 transition-colors text-center">Free consultation</a>
          
          {/* Mobile Data Source Indicator */}
          {getDataSourceIndicator() && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              {getDataSourceIndicator()}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
