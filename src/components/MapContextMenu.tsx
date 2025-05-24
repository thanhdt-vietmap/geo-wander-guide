
import React, { useState, useEffect } from 'react';
import { Copy, MapPin } from 'lucide-react';
import { 
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator
} from '@/components/ui/context-menu';
import { toast } from 'sonner';

interface MapContextMenuProps {
  x: number;
  y: number;
  lng: number;
  lat: number;
  isOpen: boolean;
  onClose: () => void;
  onGetLocation: (lng: number, lat: number) => void;
}

const MapContextMenu: React.FC<MapContextMenuProps> = ({
  lng,
  lat,
  isOpen,
  onClose,
  onGetLocation
}) => {
  const [animating, setAnimating] = useState(true);
  
  useEffect(() => {
    if (isOpen) {
      setAnimating(true);
      const timer = setTimeout(() => setAnimating(false), 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const copyCoordinates = () => {
    const coordString = `${lng.toFixed(6)}, ${lat.toFixed(6)}`;
    navigator.clipboard.writeText(coordString)
      .then(() => toast.success('Coordinates copied to clipboard'))
      .catch(() => toast.error('Failed to copy coordinates'));
    onClose();
  };

  const getLocationInfo = () => {
    onGetLocation(lng, lat);
    onClose();
  };

  // Format coordinates for display
  const formatCoord = (coord: number) => coord.toFixed(6);

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 ${animating ? 'animate-in fade-in duration-100' : ''}`} onClick={onClose}>
      <ContextMenu>
        <ContextMenuTrigger 
          className="fixed" 
          style={{ 
            top: 0, 
            left: 0, 
            width: '100vw', 
            height: '100vh',
            pointerEvents: 'none' // Allow clicks to pass through to the overlay
          }} 
        />
        <ContextMenuContent className="w-56">
          <div className="px-2 py-1.5 text-sm font-semibold">Location</div>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={copyCoordinates} className="cursor-pointer">
            <Copy className="mr-2 h-4 w-4" />
            <span>
              {formatCoord(lng)}, {formatCoord(lat)}
            </span>
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={getLocationInfo} className="cursor-pointer">
            <MapPin className="mr-2 h-4 w-4" />
            <span>Get location details</span>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
};

export default MapContextMenu;
