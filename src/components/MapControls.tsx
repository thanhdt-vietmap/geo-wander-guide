
import React from 'react';
import { Layers, ZoomIn, ZoomOut, Navigation, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MapControls: React.FC = () => {
  const handleZoomIn = () => {
    console.log('Zoom in clicked');
  };

  const handleZoomOut = () => {
    console.log('Zoom out clicked');
  };

  const handleLayerToggle = () => {
    console.log('Layer toggle clicked');
  };

  const handleNavigation = () => {
    console.log('Navigation clicked');
  };

  const handleCompass = () => {
    console.log('Compass clicked');
  };

  return (
    <div className="absolute bottom-6 right-6 z-10 flex flex-col gap-3">
      {/* Layer and Navigation Controls */}
      <div className="flex flex-col gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={handleLayerToggle}
          className="bg-white shadow-lg hover:bg-gray-50 w-10 h-10 rounded-lg border-gray-200"
          title="Layers"
        >
          <Layers className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          onClick={handleNavigation}
          className="bg-white shadow-lg hover:bg-gray-50 w-10 h-10 rounded-lg border-gray-200"
          title="Tilt"
        >
          <Navigation className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={handleCompass}
          className="bg-white shadow-lg hover:bg-gray-50 w-10 h-10 rounded-lg border-gray-200"
          title="Reset bearing to north"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Zoom Controls */}
      <div className="flex flex-col bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleZoomIn}
          className="hover:bg-gray-50 w-10 h-10 rounded-none border-b border-gray-200"
          title="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={handleZoomOut}
          className="hover:bg-gray-50 w-10 h-10 rounded-none"
          title="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default MapControls;
