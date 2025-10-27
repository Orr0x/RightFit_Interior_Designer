/**
 * TypeManager - Admin interface for managing appliance and furniture types
 * Provides CRUD operations for appliance_types and furniture_types tables
 */

import React, { useState, useEffect } from 'react';
import { ComponentTypeService, ApplianceType, FurnitureType } from '@/services/ComponentTypeService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { Logger } from '@/utils/Logger';

export const TypeManager: React.FC = () => {
  const [appliances, setAppliances] = useState<ApplianceType[]>([]);
  const [furniture, setFurniture] = useState<FurnitureType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [applianceData, furnitureData] = await Promise.all([
        ComponentTypeService.getAllApplianceTypes(),
        ComponentTypeService.getAllFurnitureTypes()
      ]);
      setAppliances(applianceData);
      setFurniture(furnitureData);
    } catch (error) {
      Logger.error('[TypeManager] Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Component Type Manager</h1>
        <p className="text-muted-foreground">
          Manage appliance and furniture type definitions for 3D rendering
        </p>
      </div>

      <Tabs defaultValue="appliances" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="appliances">
            Appliances ({appliances.length})
          </TabsTrigger>
          <TabsTrigger value="furniture">
            Furniture ({furniture.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="appliances" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Appliance Types</span>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Appliance
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {appliances.map((appliance) => (
                  <Card key={appliance.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{appliance.appliance_name}</h3>
                          <Badge variant="outline">{appliance.appliance_code}</Badge>
                          <Badge>{appliance.category}</Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Color: </span>
                            <span className="flex items-center gap-2">
                              <div
                                className="w-6 h-6 rounded border"
                                style={{ backgroundColor: appliance.default_color }}
                              />
                              {appliance.default_color}
                            </span>
                          </div>

                          {appliance.default_finish && (
                            <div>
                              <span className="text-muted-foreground">Finish: </span>
                              <span>{appliance.default_finish}</span>
                            </div>
                          )}

                          {appliance.typical_width && (
                            <div>
                              <span className="text-muted-foreground">Dimensions: </span>
                              <span>
                                {appliance.typical_width} × {appliance.typical_height} × {appliance.typical_depth} cm
                              </span>
                            </div>
                          )}
                        </div>

                        {appliance.description && (
                          <p className="text-sm text-muted-foreground">
                            {appliance.description}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="furniture" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Furniture Types</span>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Furniture
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {furniture.map((item) => (
                  <Card key={item.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{item.furniture_name}</h3>
                          <Badge variant="outline">{item.furniture_code}</Badge>
                          <Badge>{item.category}</Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          {item.default_color && (
                            <div>
                              <span className="text-muted-foreground">Color: </span>
                              <span className="flex items-center gap-2">
                                <div
                                  className="w-6 h-6 rounded border"
                                  style={{ backgroundColor: item.default_color }}
                                />
                                {item.default_color}
                              </span>
                            </div>
                          )}

                          {item.default_material && (
                            <div>
                              <span className="text-muted-foreground">Material: </span>
                              <span>{item.default_material}</span>
                            </div>
                          )}

                          {item.typical_width && (
                            <div>
                              <span className="text-muted-foreground">Dimensions: </span>
                              <span>
                                {item.typical_width} × {item.typical_height} × {item.typical_depth} cm
                              </span>
                            </div>
                          )}

                          {item.weight_capacity_kg && (
                            <div>
                              <span className="text-muted-foreground">Weight Capacity: </span>
                              <span>{item.weight_capacity_kg} kg</span>
                            </div>
                          )}
                        </div>

                        {item.style_tags && item.style_tags.length > 0 && (
                          <div className="flex gap-2">
                            {item.style_tags.map((tag) => (
                              <Badge key={tag} variant="secondary">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {item.description && (
                          <p className="text-sm text-muted-foreground">
                            {item.description}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TypeManager;
