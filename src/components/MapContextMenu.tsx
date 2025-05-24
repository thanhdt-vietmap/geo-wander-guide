import React, { useState, useEffect, useRef } from 'react';
import { Copy, MapPin, X } from 'lucide-react';
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
  x,
  y,
  lng,
  lat,
  isOpen,
  onClose,
  onGetLocation
}) => {
  const [animating, setAnimating] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (isOpen) {
      setAnimating(true);
      const timer = setTimeout(() => setAnimating(false), 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('contextmenu', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('contextmenu', handleClickOutside);
    };
  }, [isOpen, onClose]);

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

  // Adjust position to keep menu within viewport
  const adjustedX = Math.min(x, window.innerWidth - 240); // 240px is approximate menu width
  const adjustedY = Math.min(y, window.innerHeight - 150); // 150px is approximate menu height

  console.log('Rendering context menu at adjusted position:', { adjustedX, adjustedY, originalX: x, originalY: y });

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-transparent" 
        onClick={onClose}
        onContextMenu={(e) => {
          e.preventDefault();
          onClose();
        }}
      />
      
      {/* Context Menu */}
      <div
        ref={menuRef}
        className={`fixed z-50 w-56 rounded-md border bg-white p-1 shadow-md transition-all duration-100 ${
          animating ? 'animate-in fade-in zoom-in-95' : ''
        }`}
        style={{
          left: `${adjustedX}px`,
          top: `${adjustedY}px`,
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className="px-2 py-1.5 text-sm font-semibold text-gray-700 border-b">
          Location
        </div>
        
        {/* Coordinates Display */}
        <div className="px-2 py-1 text-xs text-gray-500">
          {formatCoord(lng)}, {formatCoord(lat)}
        </div>
        
        {/* Copy Coordinates */}
        <button
          onClick={copyCoordinates}
          className="flex w-full items-center px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer transition-colors"
        >
          <Copy className="mr-2 h-4 w-4" />
          <span>Copy coordinates</span>
        </button>
        
        {/* Separator */}
        <div className="my-1 h-px bg-gray-200" />
        
        {/* Get Location Details */}
        <button
          onClick={getLocationInfo}
          className="flex w-full items-center px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer transition-colors"
        >
          <MapPin className="mr-2 h-4 w-4" />
          <span>Get location details</span>
        </button>
        
        {/* Separator */}
        <div className="my-1 h-px bg-gray-200" />
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="flex w-full items-center px-2 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded cursor-pointer transition-colors"
        >
          <X className="mr-2 h-4 w-4" />
          <span>Close</span>
        </button>
      </div>
    </>
  );
};

export default MapContextMenu;