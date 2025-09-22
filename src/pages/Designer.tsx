import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, ArrowLeft, Layout, Box, Edit3, Shield, CheckCircle, Home, Settings, Gauge } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProject } from '@/contexts/ProjectContext';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useIsMobile } from '@/hooks/use-mobile';
import { DesignCanvas2D } from '@/components/designer/DesignCanvas2D';
import { Lazy3DView } from '@/components/designer/Lazy3DView';
import CompactComponentSidebar from '@/components/designer/CompactComponentSidebar';
import { CanvasElementCounter } from '@/components/designer/CanvasElementCounter';
import { ViewSelector } from '@/components/designer/ViewSelector';
import { DesignToolbar } from '@/components/designer/DesignToolbar';
import { PropertiesPanel } from '@/components/designer/PropertiesPanel';
import { ErrorBoundary } from '@/components/designer/ErrorBoundary';
import PerformanceMonitor from '@/components/designer/PerformanceMonitor';
import { RoomTabs } from '@/components/designer/RoomTabs';
import { KeyboardShortcutsHelp } from '@/components/designer/KeyboardShortcutsHelp';
import MobileDesignerLayout from '@/components/designer/MobileDesignerLayout';
import { toast } from 'sonner';
import { useDesignValidation } from '@/hooks/useDesignValidation';
import { RoomDesign, DesignElement, getDefaultZIndex } from '@/types/project';
import { migrateElements } from '@/utils/migrateElements';
import { ComponentService } from '@/services/ComponentService';
import rightfitLogo from '@/assets/logo.png';
import '@/utils/godMode'; // Load God mode utilities in development
import { testCurrentCoordinateSystem } from '@/utils/coordinateSystemDemo';


const Designer = () => {
  const navigate = useNavigate();
  const { projectId, roomId } = useParams();
  const { user } = useAuth();
  const {
    currentProject,
    currentRoomDesign,
    currentRoomId,
    loadProject,
    updateProject,
    updateCurrentRoomDesign,
    saveCurrentDesign,
    hasUnsavedChanges,
    lastAutoSave,
    loading,
    error,
  } = useProject();

  // UI State
  const [activeView, setActiveView] = useState<'2d' | '3d'>('2d');
  const [active2DView, setActive2DView] = useState<'plan' | 'front' | 'back' | 'left' | 'right'>('plan');
  const [selectedElement, setSelectedElement] = useState<DesignElement | null>(null);
  const [isEditingProjectName, setIsEditingProjectName] = useState(false);
  const [editingProjectName, setEditingProjectName] = useState('');
  const [activeTool, setActiveTool] = useState<'select' | 'fit-screen' | 'pan' | 'tape-measure' | 'none'>('select');
  const [showGrid, setShowGrid] = useState(true);
  const [showRuler, setShowRuler] = useState(false);
  const [showWireframe, setShowWireframe] = useState(false);
  const [showColorDetail, setShowColorDetail] = useState(true);
  const [fitToScreenSignal, setFitToScreenSignal] = useState(0);
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [lastValidatedDesign, setLastValidatedDesign] = useState<string | null>(null);
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false);

  // Tape measure state - multi-measurement support
  const [completedMeasurements, setCompletedMeasurements] = useState<{ start: { x: number; y: number }, end: { x: number; y: number } }[]>([]);
  const [currentMeasureStart, setCurrentMeasureStart] = useState<{ x: number; y: number } | null>(null);
  const [tapeMeasurePreview, setTapeMeasurePreview] = useState<{ x: number; y: number } | null>(null);

  // History for undo/redo
  const [history, setHistory] = useState<RoomDesign[]>([]);
  const [future, setFuture] = useState<RoomDesign[]>([]);

  // Initialize validation hook
  const { validateDesign, showValidationResults } = useDesignValidation();
  
  // Mobile detection
  const isMobile = useIsMobile();

  // Preload common data for performance
  useEffect(() => {
    const preloadData = async () => {
      try {
        console.log('🚀 [Designer] Preloading common component behaviors for performance');
        await ComponentService.preloadCommonBehaviors();
        console.log('✅ [Designer] Preloading complete');
      } catch (err) {
        console.warn('⚠️ [Designer] Preloading failed (non-critical):', err);
      }
    };

    preloadData();
  }, []);

  // Determine what to show based on URL and project state
  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    // If no project ID in URL, redirect to dashboard
    if (!projectId) {
      navigate('/dashboard');
      return;
    }

    // If project ID exists, load the project
    if (projectId && projectId !== currentProject?.id) {
      loadProject(projectId);
    }
  }, [user, projectId, currentProject?.id, loadProject, navigate]);

  // Handle room switching from URL
  useEffect(() => {
    if (roomId && currentProject && roomId !== currentRoomId) {
      const room = currentProject.room_designs?.find(r => r.id === roomId);
      if (room) {
        // Switch to the specified room
        // This will be handled by the ProjectContext
      }
    }
  }, [roomId, currentProject, currentRoomId]);

  // Convert RoomDesign to Design format for component compatibility
  const design = currentRoomDesign ? {
    id: currentRoomDesign.id,
    name: currentRoomDesign.name || 'Untitled Room',
    elements: migrateElements(currentRoomDesign.design_elements || []),
    roomDimensions: currentRoomDesign.room_dimensions || { width: 800, height: 600, ceilingHeight: 240 },
    roomType: currentRoomDesign.room_type,
  } : null;

  // Auto-fit when switching 2D views
  useEffect(() => {
    if (activeView === '2d') {
      // Trigger fit to screen when switching between 2D views
      setFitToScreenSignal(s => s + 1);
    }
  }, [active2DView, activeView]);

  // Don't auto-reset tape measure when tool changes - let user manually clear

  const handleSaveDesign = async () => {
    if (!currentRoomDesign) return;

    // Validate design before saving
    if (design) {
      const validationResult = validateDesign(design);
      if (!validationResult.isValid) {
        showValidationResults(validationResult);
        return;
      }
    }

    try {
      await saveCurrentDesign(true); // Manual save with notification
      
      if (design) {
        setLastValidatedDesign(JSON.stringify(design));
      }
    } catch (error) {
      toast.error('Failed to save design');
    }
  };

  const handleEditProjectName = () => {
    if (!currentProject) return;
    setIsEditingProjectName(true);
    setEditingProjectName(currentProject.name || '');
  };

  const handleSaveProjectName = async () => {
    if (!currentProject || !editingProjectName.trim()) return;

    try {
      await updateProject(currentProject.id, {
        name: editingProjectName.trim(),
      });
      setIsEditingProjectName(false);
      toast.success('Project name updated');
    } catch (error) {
      toast.error('Failed to update project name');
    }
  };

  const handleCancelEditProjectName = () => {
    setIsEditingProjectName(false);
    setEditingProjectName('');
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const handleUpdateRoomDimensions = async (dimensions: { width: number; height: number; ceilingHeight?: number }) => {
    if (!currentRoomDesign) return;

    // Save to history
    setHistory(prev => [...prev, { ...currentRoomDesign }]);
    setFuture([]);

    await updateCurrentRoomDesign({
      room_dimensions: dimensions,
    });
  };

  const handleAddElement = async (element: DesignElement) => {
    if (!currentRoomDesign) return;

    // Save to history
    setHistory(prev => [...prev, { ...currentRoomDesign }]);
    setFuture([]);

    // Assign default zIndex and isVisible values if not already set
    const defaultZIndex = getDefaultZIndex(element.type, element.id);
    const elementWithDefaults: DesignElement = {
      ...element,
      zIndex: element.zIndex ?? defaultZIndex,
      isVisible: element.isVisible ?? true
    };
    
    // Debug logging for layering
    console.log(`🎯 [Layering] Element: ${element.id} (${element.type}) -> zIndex: ${defaultZIndex}`);

    // Add the new element to the design
    const updatedElements = [...(currentRoomDesign.design_elements || []), elementWithDefaults];
    await updateCurrentRoomDesign({
      design_elements: updatedElements,
    });

    // Select the newly added element
    setSelectedElement(elementWithDefaults);
    
    // Show success message
    toast.success(`Added ${element.name} to design`);
  };

  const handleUpdateElement = async (elementId: string, updates: Partial<DesignElement>) => {
    if (!currentRoomDesign) return;

    console.log(`🔄 [Designer] handleUpdateElement called:`, {
      elementId,
      updates,
      hasZUpdate: 'z' in updates,
      zValue: updates.z
    });

    // Save to history
    setHistory(prev => [...prev, { ...currentRoomDesign }]);
    setFuture([]);

    const updatedElements = (currentRoomDesign.design_elements || []).map(el =>
      el.id === elementId ? { ...el, ...updates } : el
    );

    console.log(`📋 [Designer] Updated element:`, updatedElements.find(el => el.id === elementId));

    await updateCurrentRoomDesign({
      design_elements: updatedElements,
    });

    // Keep selected element in sync
    setSelectedElement(prev => (prev && prev.id === elementId ? { ...prev, ...updates } : prev));
  };

  const handleDeleteElement = async (elementId: string) => {
    if (!currentRoomDesign) return;

    // Save to history
    setHistory(prev => [...prev, { ...currentRoomDesign }]);
    setFuture([]);

    const filteredElements = (currentRoomDesign.design_elements || []).filter(el => el.id !== elementId);
    await updateCurrentRoomDesign({
      design_elements: filteredElements,
    });

    setSelectedElement(null);
  };


  // Toolbar functions
  const handleToolChange = (tool: 'select' | 'fit-screen' | 'pan' | 'tape-measure' | 'none') => {
    setActiveTool(tool);
    if (tool !== 'select') {
      setSelectedElement(null);
    }
  };

  const handleToggleGrid = () => {
    setShowGrid(!showGrid);
  };

  const handleToggleRuler = () => {
    setShowRuler(!showRuler);
  };

  const handleReset = async () => {
    if (!currentRoomDesign) return;

    // Save to history
    setHistory(prev => [...prev, { ...currentRoomDesign }]);
    setFuture([]);

    await updateCurrentRoomDesign({
      design_elements: [],
      room_dimensions: { width: 800, height: 600 },
    });

    setSelectedElement(null);
    toast.success('Design reset');
  };

  const handleCopyElement = () => {
    if (!selectedElement) return;
    
    const newElement = {
      ...selectedElement,
      id: Date.now().toString(),
      x: selectedElement.x + 20,
      y: selectedElement.y + 20
    };
    
    handleAddElement(newElement);
    setSelectedElement(newElement);
    toast.success('Element copied');
  };

  const handleDeleteSelected = () => {
    if (!selectedElement) return;
    handleDeleteElement(selectedElement.id);
    toast.success('Element deleted');
  };

  const handleFitToScreen = () => {
    setFitToScreenSignal(s => s + 1);
    setActiveTool('select');
    toast.success('Fit to screen');
  };

  const handleUndo = async () => {
    if (history.length === 0 || !currentRoomDesign) return;
    
    const prev = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    setFuture(f => [{ ...currentRoomDesign }, ...f]);
    
    await updateCurrentRoomDesign({
      design_elements: prev.design_elements,
      room_dimensions: prev.room_dimensions,
    });
    
    setSelectedElement(null);
  };

  const handleRedo = async () => {
    if (future.length === 0 || !currentRoomDesign) return;
    
    const next = future[0];
    setFuture(f => f.slice(1));
    setHistory(h => [...h, { ...currentRoomDesign }]);
    
    await updateCurrentRoomDesign({
      design_elements: next.design_elements,
      room_dimensions: next.room_dimensions,
    });
    
    setSelectedElement(null);
  };

  const handleValidateDesign = () => {
    if (!design) return;
    
    const validationResult = validateDesign(design);
    showValidationResults(validationResult);
    
    if (validationResult.isValid) {
      setLastValidatedDesign(JSON.stringify(design));
    }
  };

  // Tape measure functions - multi-measurement support
  const handleTapeMeasureClick = (x: number, y: number) => {
    if (activeTool !== 'tape-measure') return;

    if (!currentMeasureStart) {
      // First click - set start point for new measurement
      setCurrentMeasureStart({ x, y });
      setTapeMeasurePreview(null);
    } else {
      // Second click - complete measurement and add to completed list
      const newMeasurement = {
        start: currentMeasureStart,
        end: { x, y }
      };
      setCompletedMeasurements(prev => [...prev, newMeasurement]);
      setCurrentMeasureStart(null);
      setTapeMeasurePreview(null);
    }
  };

  const handleTapeMeasureMouseMove = (x: number, y: number) => {
    if (activeTool !== 'tape-measure' || !currentMeasureStart) return;
    
    // Show preview line while moving to second point
    setTapeMeasurePreview({ x, y });
  };

  const handleClearTapeMeasure = () => {
    // Clear all measurements
    setCompletedMeasurements([]);
    setCurrentMeasureStart(null);
    setTapeMeasurePreview(null);
  };

  // Check if design has changed since last validation
  const isDesignValidated = design ? lastValidatedDesign === JSON.stringify(design) : false;

  // Nudge functions for arrow key movement - 1cm precision nudges
  const handleNudgeLeft = () => {
    if (!selectedElement) return;
    const nudgeAmount = 1; // 1cm nudge
    handleUpdateElement(selectedElement.id, {
      x: Math.max(0, selectedElement.x - nudgeAmount)
    });
  };

  const handleNudgeRight = () => {
    if (!selectedElement || !currentRoomDesign) return;
    const nudgeAmount = 1; // 1cm nudge
    const maxX = (currentRoomDesign.room_dimensions?.width || 800) - selectedElement.width;
    handleUpdateElement(selectedElement.id, {
      x: Math.min(maxX, selectedElement.x + nudgeAmount)
    });
  };

  const handleNudgeUp = () => {
    if (!selectedElement) return;
    const nudgeAmount = 1; // 1cm nudge
    handleUpdateElement(selectedElement.id, {
      y: Math.max(0, selectedElement.y - nudgeAmount)
    });
  };

  const handleNudgeDown = () => {
    if (!selectedElement || !currentRoomDesign) return;
    const nudgeAmount = 1; // 1cm nudge
    const maxY = (currentRoomDesign.room_dimensions?.height || 600) - selectedElement.height;
    handleUpdateElement(selectedElement.id, {
      y: Math.min(maxY, selectedElement.y + nudgeAmount)
    });
  };

  // Test the new coordinate system
  const handleTestCoordinateSystem = () => {
    if (!design) {
      toast.error('No design available for coordinate system testing');
      return;
    }
    
    console.log('🧪 [Designer] Testing coordinate system...');
    toast.info('Testing coordinate system... Check console for results');
    
    try {
      const results = testCurrentCoordinateSystem(design);
      const passedCount = results.filter(r => r.passed).length;
      const totalCount = results.length;
      
      if (passedCount === totalCount) {
        toast.success(`✅ Coordinate system test PASSED! (${passedCount}/${totalCount})`);
      } else {
        toast.error(`❌ Coordinate system test FAILED! (${passedCount}/${totalCount})`);
      }
    } catch (error) {
      console.error('❌ [Designer] Coordinate system test failed:', error);
      toast.error('Coordinate system test failed - check console for details');
    }
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onUndo: history.length > 0 ? handleUndo : undefined,
    onRedo: future.length > 0 ? handleRedo : undefined,
    onCopy: selectedElement ? handleCopyElement : undefined,
    onDelete: selectedElement ? handleDeleteSelected : undefined,
    onSave: handleSaveDesign,
    onFitToScreen: handleFitToScreen,
    onToggleGrid: handleToggleGrid,
    onToggleRuler: handleToggleRuler,
    onSelectTool: () => setActiveTool('select'),
    onPanTool: () => setActiveTool('pan'),
    onEscape: () => {
      if (activeTool === 'tape-measure') {
        handleClearTapeMeasure();
      } else {
        setSelectedElement(null);
      }
    },
    onArrowLeft: selectedElement ? handleNudgeLeft : undefined,
    onArrowRight: selectedElement ? handleNudgeRight : undefined,
    onArrowUp: selectedElement ? handleNudgeUp : undefined,
    onArrowDown: selectedElement ? handleNudgeDown : undefined
  });

  if (!user) return null;

  // Show loading state
  if (loading) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading project...</p>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  // Show error state
  if (error) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Card className="w-full max-w-md p-6 text-center">
            <h2 className="text-lg font-semibold text-destructive mb-2">Error</h2>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={handleBackToDashboard}>
              <Home className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
          </Card>
        </div>
      </ErrorBoundary>
    );
  }

  // Show message if no room is selected
  if (!currentRoomDesign) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <header className="bg-white shadow-sm border-b px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={handleBackToDashboard}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </div>
              
              <div className="flex items-center gap-4">
                <img src={rightfitLogo} alt="RightFit Interiors logo" className="h-12 w-auto" />
                <h1 className="text-xl font-semibold">{currentProject?.name || 'Untitled Project'}</h1>
              </div>
              
              <div className="w-20"></div>
            </div>
          </header>
          
          <RoomTabs />
          
          <div className="flex-1 flex items-center justify-center">
            <Card className="w-full max-w-md p-6 text-center">
              <h2 className="text-lg font-semibold mb-2">No Room Selected</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Select a room from the tabs above or create a new room to start designing.
              </p>
            </Card>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
        
        <header className={`bg-white shadow-sm border-b px-4 py-3 ${isMobile ? 'hidden' : ''}`}>
          <div className="flex items-center justify-between w-full">
            {/* Left Section - Dashboard Button & Current Room */}
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={handleBackToDashboard}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              
              {/* Current Room Info */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
                  <Home className="h-4 w-4" />
                  <span className="capitalize">{currentRoomDesign.room_type.replace('-', ' ')}</span>
                </div>
              </div>
            </div>

            {/* Center Section - Logo, Project Name, and Tools */}
            <div className="flex items-center gap-4">
              <img src={rightfitLogo} alt="RightFit Interiors logo" className="h-12 w-auto" />
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {isEditingProjectName ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editingProjectName}
                        onChange={(e) => setEditingProjectName(e.target.value)}
                        className="text-lg font-semibold"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveProjectName();
                          if (e.key === 'Escape') handleCancelEditProjectName();
                        }}
                        autoFocus
                      />
                      <Button size="sm" onClick={handleSaveProjectName}>
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancelEditProjectName}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl font-semibold">
                        {currentProject?.name || 'Untitled Project'}
                        {hasUnsavedChanges && <span className="text-orange-500 ml-1">•</span>}
                      </h1>
                      <Button size="sm" variant="ghost" onClick={handleEditProjectName}>
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                
                {/* Manual Save Button and Auto-save Status */}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveDesign}
                    disabled={!hasUnsavedChanges}
                    className="flex items-center gap-1"
                  >
                    <Save className="h-4 w-4" />
                    Save
                  </Button>
                  
                  {lastAutoSave && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span>Auto-saved: {lastAutoSave.toLocaleTimeString()}</span>
                    </div>
                  )}
                </div>
                
                {/* Design Validation Status & Shortcuts */}
                <div className="flex items-center gap-2">
                  {isDesignValidated ? (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-xs">Validated</span>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleValidateDesign}
                      className="text-xs"
                    >
                      <Shield className="h-4 w-4 mr-1" />
                      Validate
                    </Button>
                  )}
                  
                  <KeyboardShortcutsHelp />
                  
                  {/* God Mode Dev Tools */}
                  {user?.user_tier === 'god' && (
                    <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-300">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          console.log('🎯 [Designer] Performance Monitor toggle clicked, current state:', showPerformanceMonitor);
                          setShowPerformanceMonitor(!showPerformanceMonitor);
                        }}
                        className="text-xs"
                        title="Performance Monitor"
                      >
                        <Gauge className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          // Navigate to dev tools page
                          console.log('🛠️ [Designer] Navigating to Dev Tools page');
                          navigate('/dev');
                        }}
                        className="text-xs"
                        title="Developer Tools"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Right Section - View Tabs */}
            <div className="flex items-center gap-3">
              {/* 3D/2D Tabs */}
              <Tabs className="shrink-0" value={activeView} onValueChange={(value) => setActiveView(value as '2d' | '3d')}>
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="2d" className="flex items-center space-x-2">
                    <Layout className="h-4 w-4" />
                    <span>2D Plan</span>
                  </TabsTrigger>
                  <TabsTrigger value="3d" className="flex items-center space-x-2">
                    <Box className="h-4 w-4" />
                    <span>3D View</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </header>

        {/* Room Tabs - Hidden on Mobile */}
        {!isMobile && <RoomTabs />}

        {/* Main Content - Conditional Mobile/Desktop Layout */}
        {isMobile && design ? (
          <MobileDesignerLayout
            design={design}
            selectedElement={selectedElement}
            onSelectElement={setSelectedElement}
            onAddElement={handleAddElement}
            onUpdateElement={handleUpdateElement}
            onDeleteElement={handleDeleteElement}
            onUpdateRoomDimensions={handleUpdateRoomDimensions}
            activeView={activeView}
            onViewChange={setActiveView}
            active2DView={active2DView}
            onActive2DViewChange={setActive2DView}
            activeTool={activeTool}
            onToolChange={handleToolChange}
            showGrid={showGrid}
            onToggleGrid={handleToggleGrid}
            showWireframe={showWireframe}
            onToggleWireframe={() => setShowWireframe(prev => !prev)}
            showColorDetail={showColorDetail}
            onToggleColorDetail={() => setShowColorDetail(prev => !prev)}
            fitToScreenSignal={fitToScreenSignal}
            onFitToScreen={handleFitToScreen}
            completedMeasurements={completedMeasurements}
            currentMeasureStart={currentMeasureStart}
            tapeMeasurePreview={tapeMeasurePreview}
            onTapeMeasureClick={handleTapeMeasureClick}
            onTapeMeasureMouseMove={handleTapeMeasureMouseMove}
            onClearTapeMeasure={handleClearTapeMeasure}
          />
        ) : (
          <div className="flex-1 flex">
            {/* Left Sidebar */}
            <div className={`${showLeftPanel ? 'w-80' : 'w-0'} bg-white border-r flex flex-col smooth-transition overflow-hidden relative z-10 h-full`}>
              {showLeftPanel && (
                <>
                  <div className="p-4 border-b">
                    <h2 className="font-semibold text-gray-900">Designer</h2>
                  </div>
                  <div className="flex-1">
                    <CompactComponentSidebar
                      onAddElement={handleAddElement}
                      roomType={currentRoomDesign.room_type}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Main Design Area */}
            <div className="flex-1 flex flex-col">
              {/* Toolbar */}
              <div className="bg-white border-b px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <DesignToolbar 
                    activeView={activeView}
                    onViewChange={setActiveView}
                    activeTool={activeTool}
                    onToolChange={handleToolChange}
                    showGrid={showGrid}
                    onToggleGrid={handleToggleGrid}
                    showRuler={showRuler}
                    onToggleRuler={handleToggleRuler}
                    showWireframe={showWireframe}
                    onToggleWireframe={() => setShowWireframe(prev => !prev)}
                    showColorDetail={showColorDetail}
                    onToggleColorDetail={() => setShowColorDetail(prev => !prev)}
                    onReset={handleReset}
                    onCopy={handleCopyElement}
                    onDelete={handleDeleteSelected}
                    onFitScreen={handleFitToScreen}
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                    canCopy={!!selectedElement}
                    canDelete={!!selectedElement}
                    canUndo={history.length > 0}
                    canRedo={future.length > 0}
                    showLeftPanel={showLeftPanel}
                    onToggleLeftPanel={() => setShowLeftPanel(prev => !prev)}
                    showRightPanel={showRightPanel}
                    onToggleRightPanel={() => setShowRightPanel(prev => !prev)}
                    onSave={handleSaveDesign}
                    onSaveNew={() => {}} // Not applicable in project mode
                    roomType={currentRoomDesign.room_type}
                    elementCount={currentRoomDesign.design_elements?.length || 0}
                    onValidateDesign={handleValidateDesign}
                    onTestCoordinateSystem={handleTestCoordinateSystem}
                  />
                  
                </div>
                
              </div>

              {/* Canvas Area */}
              <div className="flex-1 p-4">
                <Card className="h-full design-canvas-card transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl">
                  {activeView === '2d' && design ? (
                    <div className="h-full relative">
                      <DesignCanvas2D
                        key={`canvas-2d-${active2DView}-${currentRoomId}`}
                        design={design}
                        selectedElement={selectedElement}
                        onSelectElement={setSelectedElement}
                        onUpdateElement={handleUpdateElement}
                        onDeleteElement={handleDeleteElement}
                        onUpdateRoomDimensions={handleUpdateRoomDimensions}
                        onAddElement={handleAddElement}
                        showGrid={showGrid}
                        showRuler={showRuler}
                        showWireframe={showWireframe}
                        showColorDetail={showColorDetail}
                        activeTool={activeTool}
                        fitToScreenSignal={fitToScreenSignal}
                        active2DView={active2DView}
                        completedMeasurements={completedMeasurements}
                        currentMeasureStart={currentMeasureStart}
                        tapeMeasurePreview={tapeMeasurePreview}
                        onTapeMeasureClick={handleTapeMeasureClick}
                        onTapeMeasureMouseMove={handleTapeMeasureMouseMove}
                        onClearTapeMeasure={handleClearTapeMeasure}
                      />
                      
                      {/* View Selector Overlay - Top Left */}
                      <div className="absolute top-4 left-4 z-10">
                        <ViewSelector
                          activeView={active2DView}
                          onViewChange={setActive2DView}
                        />
                      </div>
                      
                      {/* Canvas Element Counter - Bottom Left */}
                      <CanvasElementCounter
                        elements={design.elements}
                        selectedElement={selectedElement}
                        onSelectElement={setSelectedElement}
                        onUpdateElement={handleUpdateElement}
                        onDeleteElement={handleDeleteElement}
                      />
                    </div>
                  ) : design ? (
                    <div className="h-full relative">
                      <Lazy3DView
                        key={`view3d-${currentRoomId}-${showLeftPanel}-${showRightPanel}`}
                        design={design}
                        selectedElement={selectedElement}
                        onSelectElement={setSelectedElement}
                        activeTool={activeTool === 'tape-measure' ? 'select' : activeTool}
                        showGrid={showGrid}
                        fitToScreenSignal={fitToScreenSignal}
                      />
                      
                      {/* Canvas Element Counter - Bottom Left */}
                      <CanvasElementCounter
                        elements={design.elements}
                        selectedElement={selectedElement}
                        onSelectElement={setSelectedElement}
                        onUpdateElement={handleUpdateElement}
                        onDeleteElement={handleDeleteElement}
                      />
                    </div>
                  ) : null}
                </Card>
              </div>
            </div>

            {/* Right Sidebar - Properties Panel */}
            <div className={`${showRightPanel ? 'w-80' : 'w-0'} bg-white border-l flex flex-col smooth-transition overflow-hidden relative z-10`}>
              {showRightPanel && design && (
                <>
                  <div className="p-4 border-b">
                    <h2 className="font-semibold text-gray-900">Properties</h2>
                  </div>
                  <PropertiesPanel
                    selectedElement={selectedElement}
                    onUpdateElement={handleUpdateElement}
                    roomDimensions={design.roomDimensions}
                    onUpdateRoomDimensions={handleUpdateRoomDimensions}
                    roomType={design.roomType}
                    active2DView={active2DView}
                  />
                </>
              )}
            </div>
          </div>
        )}

        {/* Performance Monitor - God Mode Only */}
        {user?.user_tier === 'god' && (
          <PerformanceMonitor
            isVisible={showPerformanceMonitor}
            onToggle={() => setShowPerformanceMonitor(!showPerformanceMonitor)}
          />
        )}
      </div>
    </ErrorBoundary>
  );
};

export default Designer;