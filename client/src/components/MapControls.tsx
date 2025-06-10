
import React, { useState } from 'react';
import { ZoomIn, ZoomOut, Navigation, RotateCcw, Compass, MapPin, Rotate3d } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import { toast } from 'sonner';
import type { MapViewRef } from './MapView';
import { MapLayerType } from './MapLayerSelector';

interface MapControlsProps {
  mapRef?: React.RefObject<MapViewRef>;
  onLayerChange?: (layerType: MapLayerType) => void;
  currentLayer?: MapLayerType;
}

const MapControls: React.FC<MapControlsProps> = ({ 
  mapRef,
  onLayerChange,
  currentLayer = 'vector'
}) => {
  const [is3DMode, setIs3DMode] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  const handleZoomIn = () => {
    const map = mapRef?.current?.map;
    if (map) {
      map.zoomIn();
    }
  };

  const handleZoomOut = () => {
    const map = mapRef?.current?.map;
    if (map) {
      map.zoomOut();
    }
  };

  const handleRotate = () => {
    if (mapRef?.current) {
      // Rotate the map 45 degrees clockwise
      const currentBearing = mapRef.current.map?.getBearing() || 0;
      mapRef.current.rotateMap((currentBearing + 45) % 360);
    }
  };

  const handleCompass = () => {
    if (mapRef?.current) {
      mapRef.current.resetNorth();
    }
  };

  const handle3DToggle = () => {
    if (mapRef?.current) {
      mapRef.current.toggle3D();
      setIs3DMode(prev => !prev);
    }
  };

  const handleGetLocation = async () => {
    if (mapRef?.current) {
      setIsGettingLocation(true);
      try {
        const position = await mapRef.current.getCurrentLocation();
        if (!position) {
          toast.error('Could not get your location. Please check your browser permissions.');
        }
      } catch (error) {
        toast.error('Error getting location. Please try again.');
        // console.error('Location error:', error);
      } finally {
        setIsGettingLocation(false);
      }
    }
  };

  return (
    <TooltipProvider>
      <div className="absolute bottom-12 right-6 z-10 flex flex-col gap-3">
        {/* Main Controls Group */}
        <div className="flex flex-col gap-2">
          {/* Location Button */}
          {/* <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={handleGetLocation}
                disabled={isGettingLocation}
                className="bg-white shadow-lg hover:bg-gray-50 w-10 h-10 rounded-lg border-gray-200"
              >
                <MapPin className={`h-4 w-4 ${isGettingLocation ? 'animate-pulse' : ''}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Get current location</p>
            </TooltipContent>
          </Tooltip> */}
          
          {/* 3D Toggle Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={handle3DToggle}
                className={`${
                  is3DMode ? 'bg-blue-100' : 'bg-white'
                } shadow-lg hover:bg-gray-50 w-10 h-10 rounded-lg border-gray-200`}
              >
                <Rotate3d className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Toggle 3D view</p>
            </TooltipContent>
          </Tooltip>
          
          {/* Rotate Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRotate}
                className="bg-white shadow-lg hover:bg-gray-50 w-10 h-10 rounded-lg border-gray-200"
              >
                <Compass className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Rotate map</p>
            </TooltipContent>
          </Tooltip>

          {/* Reset North Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCompass}
                className="bg-white shadow-lg hover:bg-gray-50 w-10 h-10 rounded-lg border-gray-200"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Reset bearing to north</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Zoom Controls */}
        <div className="flex flex-col bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomIn}
                className="hover:bg-gray-50 w-10 h-10 rounded-none border-b border-gray-200"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Zoom in</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomOut}
                className="hover:bg-gray-50 w-10 h-10 rounded-none"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Zoom out</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default MapControls;
