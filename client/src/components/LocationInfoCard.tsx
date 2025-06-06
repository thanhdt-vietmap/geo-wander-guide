
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { PlaceDetails } from '../types';
import { X, Navigation, Share } from 'lucide-react';
import { toast } from '../hooks/use-toast';
import { AESEncrypt } from '../utils/AESEncrypt';

interface LocationInfoCardProps {
  place: PlaceDetails;
  onClose: () => void;
  onDirectionClick?: () => void;
}

const LocationInfoCard: React.FC<LocationInfoCardProps> = ({ place, onClose, onDirectionClick }) => {
  const [animating, setAnimating] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setAnimating(false), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleShare = async () => {
    // // // // console.log('Sharing place:', place);
    try {
      if (!place.ref_id) {
        toast({
          title: "Lỗi chia sẻ",
          description: "Không thể chia sẻ địa điểm này",
          variant: "destructive"
        });
        return;
      }

      // Create place data object for encryption
      const placeData = {
        placeId: place.ref_id,
        lat: place.lat,
        lng: place.lng,
        name: place.name || place.display
      };

      try {
        // Encrypt the place data
        const encryptedData = AESEncrypt.encryptObject(placeData);
        const shareUrl = `${window.location.origin}${window.location.pathname}?p=${encryptedData}`;
        await navigator.clipboard.writeText(shareUrl);
      } catch (encryptError) {
        // Fallback to legacy format
        const shareUrl = `${window.location.origin}${window.location.pathname}?placeId=${place.ref_id}`;
        await navigator.clipboard.writeText(shareUrl);
      }
      
      toast({
        title: "Đã sao chép liên kết",
        description: "Liên kết chia sẻ đã được sao chép vào clipboard"
      });
    } catch (error) {
      // console.error('Error sharing place:', error);
      toast({
        title: "Lỗi chia sẻ",
        description: "Không thể sao chép liên kết chia sẻ",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30 w-full max-w-md">
      <Card className={`shadow-lg border-t-4 border-t-primary ${
        animating ? 'animate-in fade-in slide-in-from-bottom duration-100' : ''
      }`}>
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
              
              <div className="flex justify-end items-end gap-1">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1"
                  onClick={handleShare}
                >
                  <Share className="h-4 w-4" />
                  Chia sẻ
                </Button>
                
                {onDirectionClick && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-1"
                    onClick={onDirectionClick}
                  >
                    <Navigation className="h-4 w-4" />
                    Chỉ đường
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LocationInfoCard;
