
import React from 'react';
import { Layers, Compass, ZoomIn, ZoomOut, Navigation } from 'lucide-react';
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

  const handleCompass = () => {
    console.log('Compass clicked');
  };

  const handleNavigation = () => {
    console.log('Navigation clicked');
  };

  return (
    <div className="absolute bottom-6 right-6 z-10 flex flex-col gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={handleLayerToggle}
        className="bg-white shadow-lg hover:bg-gray-50"
        title="Đổi lớp bản đồ"
      >
        <Layers className="h-4 w-4" />
      </Button>
      
      <Button
        variant="outline"
        size="icon"
        onClick={handleCompass}
        className="bg-white shadow-lg hover:bg-gray-50"
        title="La bàn"
      >
        <Compass className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={handleNavigation}
        className="bg-white shadow-lg hover:bg-gray-50"
        title="Điều hướng"
      >
        <Navigation className="h-4 w-4" />
      </Button>

      <div className="flex flex-col gap-1">
        <Button
          variant="outline"
          size="icon"
          onClick={handleZoomIn}
          className="bg-white shadow-lg hover:bg-gray-50"
          title="Phóng to"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          onClick={handleZoomOut}
          className="bg-white shadow-lg hover:bg-gray-50"
          title="Thu nhỏ"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default MapControls;
