import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import rightfitLogo from '@/assets/logo.png';
import StandardNavigation from '../components/shared/StandardNavigation';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
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
  Copy,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { farrowBallDataService, FarrowBallFinishWithDetails } from '../services/FarrowBallDataService';

export default function ColorProductPage() {
  const { finishId } = useParams<{ finishId: string }>();
  const [colorData, setColorData] = useState<FarrowBallFinishWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    const loadColorData = async () => {
      if (!finishId) return;
      try {
        setLoading(true);
        const data = await farrowBallDataService.getFinishById(finishId);
        setColorData(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load color data');
      } finally {
        setLoading(false);
      }
    };

    loadColorData();
  }, [finishId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !colorData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">Failed to load color data</p>
            <p className="text-gray-600 text-sm">{error || 'Color not found.'}</p>
            <Link to="/finishes" className="mt-4 inline-flex items-center text-blue-600 hover:underline">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Finishes Gallery
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const mainImage = colorData.farrow_ball_images.find(img => img.is_main_image) || colorData.farrow_ball_images[0];
  const colorSchemes = colorData.farrow_ball_color_schemes || [];

  return (
    <div className="min-h-screen" style={{ backgroundColor: `${colorData.main_color_hex}20` }}>
      {/* Standard Navigation */}
      <StandardNavigation 
        currentPage="finishes"
        showBackButton={true}
        backButtonText="Back to Finishes Gallery"
        backButtonLink="/finishes"
        additionalContent={
          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
            Farrow & Ball Official Data
          </Badge>
        }
      />

      {/* Enhanced Hero Section with Color Details */}
      <section className="pt-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-8">
            <Link to="/finishes" className="hover:text-blue-600 transition-colors">Finishes Gallery</Link>
            <span>›</span>
            <span className="text-blue-600 font-medium">{colorData.color_name}</span>
          </nav>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Color Preview */}
            <div className="space-y-6">
              <div className="relative">
                <div 
                  className="w-full h-96 rounded-2xl shadow-2xl border-4 border-white"
                  style={{ backgroundColor: colorData.main_color_hex }}
                />
                <div className="absolute top-4 right-4">
                  <Badge className="bg-white text-gray-800 shadow-lg">
                    {colorData.color_number}
                  </Badge>
                </div>
              </div>

              {/* Color Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Palette className="w-6 h-6 text-blue-600" />
                    Color Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Hex Code</label>
                      <div className="flex items-center gap-2 mt-1">
                        <div 
                          className="w-6 h-6 rounded border border-gray-300"
                          style={{ backgroundColor: colorData.main_color_hex }}
                        />
                        <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                          {colorData.main_color_hex}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigator.clipboard.writeText(colorData.main_color_hex)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">RGB</label>
                      <div className="mt-1">
                        <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                          {colorData.main_color_rgb}
                        </code>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Color Details */}
            <div className="space-y-6">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  {colorData.color_name}
                </h1>
                <p className="text-xl text-gray-600 mb-6">
                  Farrow & Ball No. {colorData.color_number}
                </p>
                <p className="text-lg text-gray-700 leading-relaxed">
                  {colorData.description}
                </p>
              </div>

              {/* Key Features */}
              {colorData.key_features && colorData.key_features.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <Star className="w-6 h-6 text-yellow-500" />
                      Key Features
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {colorData.key_features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild className="flex-1">
                  <a 
                    href={colorData.product_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-5 h-5" />
                    View on Farrow & Ball
                  </a>
                </Button>
                <Button variant="outline" className="flex-1">
                  <Download className="w-5 h-5 mr-2" />
                  Download Color Card
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Color Schemes Section */}
      {colorSchemes.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Color Schemes
              </h2>
              <p className="text-lg text-gray-600">
                Suggested color combinations for {colorData.color_name}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {colorSchemes.map((scheme, index) => (
                <Card key={index} className="overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div 
                        className="w-16 h-16 rounded-lg shadow-md border-2 border-white"
                        style={{ backgroundColor: scheme.hex }}
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900 capitalize">
                          {scheme.color_type}
                        </h3>
                        <p className="text-sm text-gray-600 font-mono">
                          {scheme.hex}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => navigator.clipboard.writeText(scheme.hex)}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Color Code
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Additional Images Section */}
      {colorData.farrow_ball_images.length > 1 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Product Images
              </h2>
              <p className="text-lg text-gray-600">
                See {colorData.color_name} in different applications
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {colorData.farrow_ball_images.slice(0, 6).map((image, index) => (
                <Card key={index} className="overflow-hidden group cursor-pointer">
                  <div className="aspect-square relative overflow-hidden">
                    <img
                      src={image.image_url}
                      alt={`${colorData.color_name} - Image ${index + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
