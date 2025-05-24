
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { PlaceDetails } from '@/types';
import { X } from 'lucide-react';

interface LocationInfoCardProps {
  place: PlaceDetails;
  onClose: () => void;
}

const LocationInfoCard: React.FC<LocationInfoCardProps> = ({ place, onClose }) => {
  return (
    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30 w-full max-w-md">
      <Card className="shadow-lg border-t-4 border-t-primary">
        <CardContent className="p-4 relative">
          <button 
            onClick={onClose}
            className="absolute top-2 right-2 rounded-full p-1 hover:bg-gray-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          
          <div className="mt-1">
            <h3 className="text-lg font-semibold text-primary">{place.name || place.display.split(' ')[0]}</h3>
            <p className="text-sm text-muted-foreground mt-1">{place.address}</p>
            
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="text-xs">
                <span className="block text-muted-foreground">Coordinates</span>
                <span className="font-medium">{place.lat.toFixed(6)}, {place.lng.toFixed(6)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LocationInfoCard;
