
import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type MapLayerType = 'vector' | 'light' | 'dark' | 'hybrid' | 'satellite';

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

  const layers = [
    { id: 'vector', name: 'Vector' },
    { id: 'light', name: 'Light' },
    { id: 'dark', name: 'Dark' },
    { id: 'hybrid', name: 'Hybrid' },
    { id: 'satellite', name: 'Satellite' },
  ] as const;

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
      <div className="p-1">
        {layers.map(layer => (
          <button
            key={layer.id}
            onClick={() => onLayerSelect(layer.id)}
            className={cn(
              "w-full text-left px-3 py-2 text-sm rounded-md transition-colors",
              currentLayer === layer.id 
                ? "bg-primary text-primary-foreground" 
                : "hover:bg-gray-100"
            )}
          >
            {layer.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MapLayerSelector;
