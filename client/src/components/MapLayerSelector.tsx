
import React, { useEffect, useRef, useState } from 'react';
import { X, ChevronUp, Map, Satellite } from 'lucide-react';
// import { Button } from '@/client/src/components/ui/button';
import { Button } from './../components/ui/button';
import { Separator } from '../components/ui/separator';
import { cn } from '../lib/utils';

export type MapLayerType = 'vector' | 'light' | 'dark' | 'hybrid' | 'satellite' | 'raster' | 'vector-dark' | 'vector-light';

interface MapLayerSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onLayerSelect: (layerType: MapLayerType) => void;
  currentLayer: MapLayerType;
}

const MapLayerSelector: React.FC<MapLayerSelectorProps> = ({
  isOpen,
  onClose,
  onLayerSelect,
  currentLayer
}) => {
  const selectorRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'vector' | 'raster'>('vector');
  const [isHovered, setIsHovered] = useState(false);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
        setIsHovered(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsExpanded(false);
        setIsHovered(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  // Auto-expand on hover
  useEffect(() => {
    if (isHovered) {
      setIsExpanded(true);
    } else {
      // Add delay before closing to allow moving to popup
      const timer = setTimeout(() => {
        setIsExpanded(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isHovered]);

  // Set initial tab based on current layer
  useEffect(() => {
    if (['vector', 'vector-light', 'vector-dark', 'hybrid'].includes(currentLayer)) {
      setActiveTab('vector');
    } else if (['raster', 'light', 'dark', 'satellite'].includes(currentLayer)) {
      setActiveTab('raster');
    }
  }, [currentLayer]);

  if (!isOpen) return null;

  const vectorLayers = [
    { id: 'vector', name: 'Vector', description: 'Standard vector map' },
    { id: 'vector-light', name: 'Vector Light', description: 'Light theme vector map' },
    { id: 'vector-dark', name: 'Vector Dark', description: 'Dark theme vector map' },
    { id: 'hybrid', name: 'Hybrid', description: 'Satellite with labels' },
  ] as const;

  const rasterLayers = [
    { id: 'raster', name: 'Raster', description: 'Standard raster map' },
    { id: 'light', name: 'Light', description: 'Light theme raster map' },
    { id: 'dark', name: 'Dark', description: 'Dark theme raster map' },
    { id: 'satellite', name: 'Satellite', description: 'Satellite imagery' },
  ] as const;

  const getCurrentLayerInfo = () => {
    const allLayers = [...vectorLayers, ...rasterLayers];
    return allLayers.find(layer => layer.id === currentLayer) || vectorLayers[0];
  };

  const handleLayerSelect = (layerId: MapLayerType) => {
    onLayerSelect(layerId);
    setIsExpanded(false);
    setIsHovered(false);
  };

  const handleTabClick = (tab: 'vector' | 'raster') => {
    setActiveTab(tab);
    setIsExpanded(true);
  };

  const TabButton = ({ 
    tab, 
    icon: Icon, 
    label,
    isActive 
  }: { 
    tab: 'vector' | 'raster'; 
    icon: any; 
    label: string;
    isActive: boolean;
  }) => (
    <button
      onClick={() => handleTabClick(tab)}
      className={cn(
        "relative flex items-center justify-center px-4 py-2 text-sm transition-all duration-300 flex-1 z-10 text-center",
        isActive 
          ? "text-white font-medium" 
          : "text-gray-600 hover:text-gray-800 font-normal"
      )}
    >
      <span className="text-center">{label}</span>
    </button>
  );

  const LayerOption = ({ 
    layer 
  }: { 
    layer: { id: MapLayerType; name: string; description: string } 
  }) => (
    <button
      onClick={() => handleLayerSelect(layer.id)}
      className={cn(
        "w-full text-left p-3 rounded-lg transition-all duration-200 border",
        currentLayer === layer.id 
          ? "bg-blue-50 border-blue-200 text-blue-900" 
          : "bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300"
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium text-sm">{layer.name}</div>
          <div className="text-xs text-gray-500 mt-1">{layer.description}</div>
        </div>
        {currentLayer === layer.id && (
          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
        )}
      </div>
    </button>
  );

  return (
    <div 
      ref={selectorRef}
      className="fixed bottom-6 left-6 z-50"
    >
      {/* Expanded Layer Options - Show above buttons */}
      {(isExpanded || isHovered) && (
        <div 
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 min-w-[300px] mb-3 animate-in fade-in slide-in-from-bottom-2 duration-200"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {activeTab === 'vector' ? 'Vector Maps' : 'Raster Maps'}
            </h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setIsExpanded(false);
                setIsHovered(false);
              }}
              className="h-8 w-8 rounded-full hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-3">
            {activeTab === 'vector' 
              ? vectorLayers.map(layer => (
                  <LayerOption key={layer.id} layer={layer} />
                ))
              : rasterLayers.map(layer => (
                  <LayerOption key={layer.id} layer={layer} />
                ))
            }
          </div>

          {/* Current Selection Info */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="text-xs text-gray-500 mb-1">Current Selection</div>
            <div className="text-sm font-medium text-gray-900">
              {getCurrentLayerInfo().name}
            </div>
          </div>
        </div>
      )}

      {/* Main Tab Selector - Toggle Switch Style */}
      <div 
        className="relative flex items-center bg-white rounded-full shadow-lg border border-gray-200 p-1 gap-0 w-[170px]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Background slider */}
        <div 
          className={cn(
            "absolute top-1 bottom-1 bg-gray-700 rounded-full transition-all duration-300 ease-in-out w-[81px]",
            activeTab === 'vector' ? "left-1" : "right-1"
          )}
        />
        
        {/* Tab buttons */}
        <div className="relative flex w-full">
          <TabButton 
            tab="vector" 
            icon={Map} 
            label="Vector" 
            isActive={activeTab === 'vector'}
          />
          <TabButton 
            tab="raster" 
            icon={Satellite} 
            label="Raster" 
            isActive={activeTab === 'raster'}
          />
        </div>
      </div>
    </div>
  );
};

export default MapLayerSelector;
