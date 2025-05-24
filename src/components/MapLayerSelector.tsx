
import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

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
  if (!isOpen) return null;

  const vectorLayers = [
    { id: 'vector', name: 'Vector' },
    { id: 'vector-light', name: 'Vector Light' },
    { id: 'vector-dark', name: 'Vector Dark' },
  ] as const;

  const rasterLayers = [
    { id: 'raster', name: 'Raster' },
    { id: 'light', name: 'Light' },
    { id: 'dark', name: 'Dark' },
  ] as const;

  const satelliteLayers = [
    { id: 'satellite', name: 'Satellite' },
    { id: 'hybrid', name: 'Hybrid' },
  ] as const;

  const LayerSection = ({ 
    title, 
    layers 
  }: { 
    title: string; 
    layers: readonly { id: MapLayerType; name: string }[] 
  }) => (
    <div className="py-1">
      <div className="px-3 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
        {title}
      </div>
      {layers.map(layer => (
        <button
          key={layer.id}
          onClick={() => onLayerSelect(layer.id)}
          className={cn(
            "w-full text-left px-3 py-2 text-sm rounded-md transition-colors mx-1",
            currentLayer === layer.id 
              ? "bg-primary text-primary-foreground" 
              : "hover:bg-gray-100"
          )}
        >
          {layer.name}
        </button>
      ))}
    </div>
  );

  return (
    <div className="absolute bottom-12 right-20 z-10 w-48 bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 animate-in fade-in duration-100">
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <h3 className="text-sm font-medium">Map Layers</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-6 w-6 rounded-full"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="py-1">
        <LayerSection title="Vector" layers={vectorLayers} />
        
        <Separator className="my-1" />
        
        <LayerSection title="Raster" layers={rasterLayers} />
        
        <Separator className="my-1" />
        
        <LayerSection title="Satellite" layers={satelliteLayers} />
      </div>
    </div>
  );
};

export default MapLayerSelector;
