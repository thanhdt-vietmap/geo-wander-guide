
import React, { useEffect, useRef, useState } from 'react';
import { X, ChevronUp, Map, Satellite } from 'lucide-react';
// import { Button } from '@/client/src/components/ui/button';
import { Button } from './../components/ui/button';
import { Separator } from '../components/ui/separator';
import { cn } from '../lib/utils';

// Import map preview images
import tileImage from '../assets/tile.png';
import darkImage from '../assets/dark.png';
import hybridImage from '../assets/hybrid.png';
import satelliteImage from '../assets/satellite.png';

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

  // Function to get the appropriate image for each layer
  const getLayerImage = (layerId: MapLayerType) => {
    switch (layerId) {
      case 'dark':
      case 'vector-dark':
        return darkImage;
      case 'hybrid':
        return hybridImage;
      case 'satellite':
        return satelliteImage;
      case 'vector':
      case 'vector-light':
      case 'raster':
      case 'light':
      default:
        return tileImage;
    }
  };

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
    
    // Select default tile option when clicking tab
    const defaultOption = tab === 'vector' ? 'vector' : 'raster';
    onLayerSelect(defaultOption);
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
    layer,
    isSelected 
  }: { 
    layer: { id: MapLayerType; name: string; description: string };
    isSelected: boolean;
  }) => (
    <button
      onClick={() => handleLayerSelect(layer.id)}
      className={cn(
        "relative flex flex-col justify-end gap-1 p-2 transition-all duration-200",
        "rounded-lg border border-[#E9EAEC] bg-white",
        isSelected 
          ? "shadow-[1px_4px_4px_0px_rgba(0,0,0,0.25)]" 
          : "shadow-[0px_4px_6px_-2px_rgba(16,24,40,0.03),0px_8px_12px_-2px_rgba(16,24,40,0.08)]"
      )}
      style={{
        width: '74px',
        height: '74px'
      }}
    >
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 rounded-lg overflow-hidden"
        style={{
          backgroundImage: `url(${getLayerImage(layer.id)})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      
      {/* Overlay based on selection state */}
      <div 
        className="absolute inset-0 rounded-lg"
        style={{
          backgroundColor: isSelected 
            ? 'rgba(106, 106, 106, 0.4)' 
            : 'rgba(52, 64, 84, 0.2)'
        }}
      />
      

      
      {/* Layer Name */}
      <div 
        className="relative z-10 text-center rounded px-1 py-0.5 bg-white"
        style={{
          fontFamily: 'Nunito Sans',
          fontWeight: 700,
          fontSize: layer.name.length > 8 ? '8px' : layer.name.length > 6 ? '9px' : '10px',
          lineHeight: layer.name.length > 8 ? '10px' : layer.name.length > 6 ? '11px' : '12px',
          color: '#6B7280'
        }}
      >
        {layer.name.toUpperCase()}
      </div>
    </button>
  );

  return (
    <div 
      ref={selectorRef}
      className="fixed bottom-6 left-6 z-30"
    >
      {/* Always Visible Active Item */}
      <div 
        className="mb-3"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-center">
          {/* Active item - always visible */}
          <div className="mr-2">
            <LayerOption 
              layer={getCurrentLayerInfo()} 
              isSelected={true}
            />
          </div>
          
          {/* Other items - show on hover with staggered left-to-right animation */}
          <div className="overflow-hidden">
            <div 
              className={cn(
                "flex transition-all duration-500 ease-out",
                (isExpanded || isHovered) ? "translate-x-0 opacity-100" : "translate-x-[-100%] opacity-0 w-0"
              )}
            >
              {(activeTab === 'vector' ? vectorLayers : rasterLayers)
                .filter(layer => layer.id !== currentLayer)
                .map((layer, index) => (
                  <div 
                    key={layer.id} 
                    className="mr-2 flex-shrink-0"
                    style={{
                      transitionDelay: (isExpanded || isHovered) ? `${index * 100}ms` : '0ms'
                    }}
                  >
                    <LayerOption 
                      layer={layer} 
                      isSelected={false}
                    />
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      </div>

      {/* Main Tab Selector - Toggle Switch Style */}
      <div 
        className="relative flex items-center bg-white rounded-full shadow-lg border border-gray-200 p-1 gap-0 w-[170px]"
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
