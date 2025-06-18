
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { PlaceDetails } from '../types';
import { MapPin } from 'lucide-react';
import { toast } from '../hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { AESEncrypt } from '../utils/AESEncrypt';
import ShareIcon from './icons/ShareIcon';
import DirectionIcon from './icons/DirectionIcon';
import CloseIcon from './icons/CloseIcon';
import mapPreviewImage from '../assets/map-preview.png';

interface LocationInfoCardProps {
  place: PlaceDetails;
  onClose: () => void;
  onDirectionClick?: () => void;
  onPlaceDetailsShow?: (place: PlaceDetails) => void;
}

const LocationInfoCard: React.FC<LocationInfoCardProps> = ({ place, onClose, onDirectionClick, onPlaceDetailsShow }) => {
  const { t } = useTranslation();
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
          title: t('share.errorTitle'),
          description: t('share.errorDesc'),
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
        title: t('share.successTitle'),
        description: t('share.routeSuccessDesc')
      });
    } catch (error) {
      // console.error('Error sharing place:', error);
      toast({
        title: t('share.errorTitle'),
        description: t('share.copyErrorDesc'),
        variant: "destructive"
      });
    }
  };

  const handleTextClick = () => {
    if (onPlaceDetailsShow) {
      onClose(); // Close LocationInfoCard first
      onPlaceDetailsShow(place); // Then open PlaceDetails with the same data
    }
  };

  return (
    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30 w-full max-w-2xl">
      <Card className={`shadow-lg border-0 ${
        animating ? 'animate-in fade-in slide-in-from-bottom duration-100' : ''
      }`} style={{
        boxShadow: '0px 4px 6px -2px rgba(16, 24, 40, 0.03), 0px 8px 12px -2px rgba(16, 24, 40, 0.08)'
      }}>
        <CardContent className="p-4 relative">
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute z-10 rounded-full p-1 hover:bg-gray-100 transition-colors"
            style={{ top: '0px', right: '0px' }}
          >
            <CloseIcon className="h-6 w-6" />
          </button>
          
          {/* Main Content - Horizontal Layout */}
          <div className="flex items-start gap-4">
            {/* Map Preview Section */}
            <div className="relative flex-shrink-0 w-[118px] h-20 bg-gray-100 rounded-lg overflow-hidden">
              {/* Map Background */}
              <div className="absolute inset-0">
                <img 
                  src={mapPreviewImage} 
                  alt="Map preview"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            
            {/* Place Information */}
            <div className="flex-1 min-w-0 pt-1">
              <h3 
                className="text-base font-bold text-gray-900 leading-tight mb-2 truncate cursor-pointer transition-colors"
                onClick={handleTextClick}
              >
                {place.name || place.display.split(' ')[0]}
              </h3>
              
              <p 
                className="text-base text-gray-600 leading-tight mb-2 line-clamp-2 cursor-pointer transition-colors"
                onClick={handleTextClick}
              >
                {place.address}
              </p>
              
              <p className="text-sm font-medium text-blue-600 leading-tight">
                {place.lat.toFixed(6)}, {place.lng.toFixed(6)}
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-end gap-3 flex-shrink-0 h-20">
              {/* Share Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="h-10 px-3 border-gray-300 hover:bg-gray-50 rounded-3xl"
              >
                <ShareIcon className="h-[18px] w-[18px]" strokeColor="#616368" />
              </Button>
              
              {/* Direction Button */}
              {onDirectionClick && (
                <Button
                  onClick={onDirectionClick}
                  size="sm"
                  className="h-10 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-sm"
                  style={{
                    boxShadow: '0px 2px 5px 0px rgba(0, 0, 0, 0.1), 0px 33px 13px 0px rgba(0, 0, 0, 0.01)'
                  }}
                >
                  <DirectionIcon className="h-[18px] w-[18px]" fillColor="white" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LocationInfoCard;
