import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, ExternalLink, Palette, Home, Info, Image as ImageIcon } from 'lucide-react';
import rightfitLogo from '../assets/logo.png';
import { farrowBallDataService, FarrowBallFinishWithDetails } from '../services/FarrowBallDataService';
import { parseColoursCSV } from '../utils/coloursData';

// Use the correct database interface
type FarrowBallColor = FarrowBallFinishWithDetails;

export default function FarrowBallProductPage() {
  const { colorId } = useParams<{ colorId: string }>();
  const [color, setColor] = useState<FarrowBallFinishWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Load color data - CSV for main image, database for detailed features
  useEffect(() => {
    const loadColor = async () => {
      if (!colorId) return;
      
      try {
        setLoading(true);
        
        // Load CSV data for correct main image
        const csvResponse = await fetch('/colours.csv');
        if (!csvResponse.ok) {
          throw new Error('Failed to load CSV data');
        }
        const csvText = await csvResponse.text();
        const csvData = parseColoursCSV(csvText);
        
        // Find the color in CSV data
        const csvColor = csvData.finishes.find(f => f.colour_id === colorId);
        if (!csvColor) {
          setError('Color not found');
          return;
        }
        
        // Load database data for detailed features
        let dbColor = null;
        try {
          dbColor = await farrowBallDataService.getFinishById(colorId);
        } catch (dbError) {
          console.warn('Database not available, using CSV data only:', dbError);
        }
        
        // Combine data: CSV for main image, database for detailed features
        const combinedColor = {
          ...dbColor, // Database data for detailed features
          // Override with CSV data for main image
          main_image_url: csvColor.thumb_url,
          csv_data: csvColor
        };
        
        setColor(combinedColor);
      } catch (err) {
        console.error('Error loading color:', err);
        setError('Failed to load color data');
      } finally {
        setLoading(false);
      }
    };

    loadColor();
  }, [colorId]);



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-96 bg-gray-200 rounded"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !color) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <Palette className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-2xl font-semibold text-gray-600 mb-2">Color Not Found</h2>
            <p className="text-gray-500 mb-6">
              The color you're looking for doesn't exist or has been removed.
            </p>
            <Link to="/finishes">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Finishes
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: color.main_color_hex + '20' }} // 20% opacity of the main color
    >
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/finishes">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Finishes
                </Button>
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <Link to="/" className="flex items-center">
                <img src={rightfitLogo} alt="RightFit" className="h-8" />
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(color.product_url || '', '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View on Farrow & Ball
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - Images */}
          <div className="space-y-6">
            {/* Main Image */}
            <div className="aspect-square rounded-2xl overflow-hidden bg-white shadow-lg">
              {selectedImageIndex === 0 ? (
                // Show main product image from CSV data (correct color)
                <img
                  src={color.main_image_url || color.csv_data?.thumb_url || ''}
                  alt={color.color_name}
                  className="w-full h-full object-cover"
                />
              ) : selectedImageIndex > 0 && color.farrow_ball_color_schemes && color.farrow_ball_color_schemes[selectedImageIndex - 1] ? (
                // Show color swatch for palette colors
                <div 
                  className="w-full h-full flex items-center justify-center"
                  style={{ backgroundColor: color.farrow_ball_color_schemes[selectedImageIndex - 1].hex }}
                >
                  <div className="text-center text-white drop-shadow-lg">
                    <h3 className="text-2xl font-bold mb-2">{color.farrow_ball_color_schemes[selectedImageIndex - 1].color_type}</h3>
                    <p className="text-lg font-mono">{color.farrow_ball_color_schemes[selectedImageIndex - 1].hex}</p>
                    <p className="text-sm opacity-90">{color.farrow_ball_color_schemes[selectedImageIndex - 1].rgb}</p>
                  </div>
                </div>
              ) : (
                // Fallback
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <div className="text-center">
                    <Palette className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">No image available</p>
                  </div>
                </div>
              )}
            </div>

            {/* Color Palette Thumbnails */}
            {color.farrow_ball_color_schemes && color.farrow_ball_color_schemes.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-700">View Options</h3>
                <div className="grid grid-cols-4 gap-3">
                  {/* Main Product Image */}
                  <div
                    className={`aspect-square rounded-lg border-2 transition-all cursor-pointer ${
                      selectedImageIndex === 0
                        ? 'border-blue-500 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedImageIndex(0)}
                  >
                    <img
                      src={color.main_image_url || color.csv_data?.thumb_url || ''}
                      alt={`${color.color_name} Main`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Color Palette Colors */}
                  {color.farrow_ball_color_schemes.map((colorItem, index) => (
                    <div
                      key={index}
                      className={`aspect-square rounded-lg border-2 transition-all cursor-pointer ${
                        selectedImageIndex === index + 1
                          ? 'border-blue-500 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedImageIndex(index + 1)}
                      style={{ backgroundColor: colorItem.hex }}
                    >
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Details */}
          <div className="space-y-8">
            {/* Color Info */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <h1 className="text-4xl font-bold text-gray-900">{color.color_name}</h1>
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  No.{color.color_number}
                </Badge>
              </div>
              
              {/* Color Swatch */}
              <div className="flex items-center space-x-4 mb-6">
                <div
                  className="w-16 h-16 rounded-lg border-2 border-gray-200 shadow-sm"
                  style={{ backgroundColor: color.main_color_hex || '#000000' }}
                ></div>
                <div>
                  <p className="text-sm text-gray-500">Color Code</p>
                  <p className="font-mono text-lg">{color.main_color_hex || 'N/A'}</p>
                  <p className="text-sm text-gray-500">{color.main_color_rgb || 'N/A'}</p>
                </div>
              </div>

              <p className="text-lg text-gray-700 leading-relaxed">
                {color.description}
              </p>
            </div>

            {/* Key Features */}
            {color.key_features.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Info className="w-5 h-5 mr-2" />
                    Key Features
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {color.key_features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Color Palette */}
            {color.farrow_ball_color_schemes && color.farrow_ball_color_schemes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Palette className="w-5 h-5 mr-2" />
                    Suggested Color Scheme
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    These colors work beautifully together. Click on any color above to see it in detail.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {color.farrow_ball_color_schemes.map((colorItem, index) => (
                      <div 
                        key={index} 
                        className="text-center cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => setSelectedImageIndex(index + 1)}
                      >
                        <div
                          className="w-full h-16 rounded-lg border-2 border-gray-200 mb-2 hover:border-blue-300 transition-colors"
                          style={{ backgroundColor: colorItem.hex }}
                        ></div>
                        <p className="text-xs text-gray-500 capitalize font-medium">{colorItem.color_type}</p>
                        <p className="text-sm font-mono">{colorItem.hex}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <Button
                size="lg"
                className="flex-1"
                onClick={() => window.open(color.url, '_blank')}
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                View on Farrow & Ball
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  // In real implementation, this would add to favorites or project
                  console.log('Add to project:', color.color_name);
                }}
              >
                <Home className="w-5 h-5 mr-2" />
                Add to Project
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
