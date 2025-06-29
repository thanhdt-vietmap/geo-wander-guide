
import React, { useState, useEffect } from 'react';
import { Navigation, BookmarkIcon, Share2, Edit, MapPin, Building, Tag, Clock, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from "@/components/ui/separator";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { toast } from '@/hooks/use-toast';

interface PlaceDetailsProps {
  place: {
    name: string;
    display: string;
    lat: number;
    lng: number;
    street?: string;
    ward?: string;
    district?: string;
    city?: string;
    ref_id?: string;
  } | null;
  onClose: () => void;
  onDirectionClick?: () => void;
}

const PlaceDetails: React.FC<PlaceDetailsProps> = ({ place, onClose, onDirectionClick }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [animating, setAnimating] = useState(false);

  // Add animation effect when component mounts
  useEffect(() => {
    setAnimating(true);
    const timer = setTimeout(() => setAnimating(false), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!place) return null;

  const addressParts = place.display?.split(',') || [];
  const fullAddress = addressParts.slice(1).join(',').trim();

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleShare = async () => {
    console.log('Sharing place:', place);
    if (!place.ref_id) {
      toast({
        title: "Lỗi chia sẻ",
        description: "Không thể chia sẻ địa điểm này",
        variant: "destructive"
      });
      return;
    }

    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('placeId', place.ref_id);
    
    try {
      await navigator.clipboard.writeText(currentUrl.toString());
      toast({
        title: "Đã sao chép liên kết",
        description: "Liên kết địa điểm đã được sao chép vào clipboard",
      });
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast({
        title: "Lỗi sao chép",
        description: "Không thể sao chép liên kết",
        variant: "destructive"
      });
    }
  };

  // Determine if we're on mobile using a simple media query check
  const isMobile = window.innerWidth <= 768; // 768px is a common breakpoint for mobile

  return (
    <>
      {/* Desktop sidebar-style drawer - only show on desktop */}
      {!isMobile && (
        <div className={`fixed top-0 left-0 h-full z-40 transition-all duration-100 ${
          isCollapsed 
            ? '-translate-x-full' 
            : 'translate-x-0'} ${
          animating ? 'animate-in fade-in slide-in-from-left duration-100' : ''
        }`}>
          <div className="flex h-full">
            <div className="bg-white shadow-lg pt-0 w-[500px] flex flex-col h-full border-r">
              
              {/* Background Image */}
              <div 
                className="w-full h-[250px] bg-cover bg-center relative" 
                style={{ backgroundImage: "url('/lovable-uploads/759ebf50-d075-4366-98b3-99771c255fa9.png')" }}
              >
                {/* Close button */}
                {/* <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={onClose} 
                  className="absolute top-6 right-6 bg-white rounded-full h-10 w-10 shadow-md"
                >
                  <X className="h-5 w-5" />
                </Button> */}
              </div>
              
              {/* Address and interactions */}
              <div className="px-6 py-4">
                <div className="flex items-start gap-4 py-3">
                  <MapPin className="h-5 w-5 text-gray-500 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">{place.display}</p>
                    <p className="text-sm text-gray-600 mt-1">{fullAddress}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-2 text-sm text-blue-600">
                  <Edit className="h-4 w-4" />
                  <button className="hover:underline">Suggest an edit on {place.name}</button>
                </div>
              </div>

              <Separator />

              {/* Action buttons */}
              <div className="flex justify-between px-6 py-4">
                <div className="flex flex-col items-center">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full h-12 w-12 bg-blue-50 text-blue-600"
                    onClick={onDirectionClick}
                  >
                    <Navigation className="h-6 w-6" />
                  </Button>
                  <span className="text-xs mt-1">Directions</span>
                </div>
                
                <div className="flex flex-col items-center">
                  <Button variant="ghost" size="icon" className="rounded-full h-12 w-12">
                    <BookmarkIcon className="h-6 w-6 text-gray-600" />
                  </Button>
                  <span className="text-xs mt-1">Save</span>
                </div>
                
                <div className="flex flex-col items-center">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full h-12 w-12"
                    onClick={handleShare}
                  >
                    <Share2 className="h-6 w-6 text-gray-600" />
                  </Button>
                  <span className="text-xs mt-1">Share</span>
                </div>

                <div className="flex flex-col items-center">
                  <Button variant="ghost" size="icon" className="rounded-full h-12 w-12">
                    <Building className="h-6 w-6 text-gray-600" />
                  </Button>
                  <span className="text-xs mt-1">Nearby</span>
                </div>
              </div>

              <Separator />

              {/* Additional actions */}
              <div className="flex-1 overflow-auto">
                <div className="px-6 py-2">
                  <Button variant="ghost" className="w-full justify-start gap-4 py-3 text-left">
                    <Tag className="h-5 w-5 text-gray-500" />
                    <span>Add a missing place</span>
                  </Button>
                  
                  <Button variant="ghost" className="w-full justify-start gap-4 py-3 text-left">
                    <Building className="h-5 w-5 text-gray-500" />
                    <span>Add your business</span>
                  </Button>
                  
                  <Button variant="ghost" className="w-full justify-start gap-4 py-3 text-left">
                    <Tag className="h-5 w-5 text-gray-500" />
                    <span>Add a label</span>
                  </Button>
                  
                  <Button variant="ghost" className="w-full justify-start gap-4 py-3 text-left">
                    <Clock className="h-5 w-5 text-gray-500" />
                    <span>Your Maps activity</span>
                  </Button>
                </div>

                <Separator className="my-2" />
                
                <div className="px-6 py-2">
                  <h3 className="text-base font-medium mb-4">At this place</h3>
                  {/* We would add content here if there was any business info to show */}
                  <p className="text-sm text-gray-500">No additional information available</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toggle button - only show on desktop */}
      {!isMobile && (
        <div 
          className={`fixed top-1/2 transform -translate-y-1/2 z-40 transition-all duration-100 ${isCollapsed ? 'left-0' : 'left-[500px]'}`}
        >
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-12 bg-white border border-gray-200 rounded-r-full rounded-l-none shadow-md"
            onClick={toggleCollapse}
          >
            {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
        </div>
      )}

      {/* Mobile drawer - only show on mobile */}
      {isMobile && (
        <Drawer open={!!place} onOpenChange={(open) => !open && onClose()}>
          <DrawerContent className="h-[85vh] animate-in slide-in-from-bottom duration-100">
            {/* Background Image */}
            <div 
              className="w-full h-[250px] bg-cover bg-center relative" 
              style={{ backgroundImage: "url('/lovable-uploads/759ebf50-d075-4366-98b3-99771c255fa9.png')" }}
            >
              {/* Close button */}
              <Button 
                variant="outline" 
                size="icon" 
                onClick={onClose} 
                className="absolute top-6 right-6 bg-white rounded-full h-10 w-10 shadow-md"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <DrawerHeader className="p-4 border-b">
              <DrawerTitle>{place.name}</DrawerTitle>
              <p className="text-sm text-gray-500">{fullAddress}</p>
            </DrawerHeader>
            <div className="p-4 overflow-auto">
              {/* Mobile version of the same content */}
              {/* Action buttons */}
              <div className="flex justify-between px-2 py-4">
                <div className="flex flex-col items-center">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full h-12 w-12 bg-blue-50 text-blue-600"
                    onClick={onDirectionClick}
                  >
                    <Navigation className="h-6 w-6" />
                  </Button>
                  <span className="text-xs mt-1">Directions</span>
                </div>
                
                <div className="flex flex-col items-center">
                  <Button variant="ghost" size="icon" className="rounded-full h-12 w-12">
                    <BookmarkIcon className="h-6 w-6 text-gray-600" />
                  </Button>
                  <span className="text-xs mt-1">Save</span>
                </div>
                
                <div className="flex flex-col items-center">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full h-12 w-12"
                    onClick={handleShare}
                  >
                    <Share2 className="h-6 w-6 text-gray-600" />
                  </Button>
                  <span className="text-xs mt-1">Share</span>
                </div>
              </div>

              <Separator />

              {/* The rest of the mobile content */}
              <div className="px-6 py-4">
                <div className="flex items-start gap-4 py-3">
                  <MapPin className="h-5 w-5 text-gray-500 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">{place.display}</p>
                    <p className="text-sm text-gray-600">{place.city}, Vietnam</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-2 text-sm text-blue-600">
                  <Edit className="h-4 w-4" />
                  <button className="hover:underline">Suggest an edit on {place.name}</button>
                </div>
              </div>

              <Separator />

              {/* Additional actions */}
              <div className="flex-1 overflow-auto">
                <div className="px-6 py-2">
                  <Button variant="ghost" className="w-full justify-start gap-4 py-3 text-left">
                    <Tag className="h-5 w-5 text-gray-500" />
                    <span>Add a missing place</span>
                  </Button>
                  
                  <Button variant="ghost" className="w-full justify-start gap-4 py-3 text-left">
                    <Building className="h-5 w-5 text-gray-500" />
                    <span>Add your business</span>
                  </Button>
                  
                  <Button variant="ghost" className="w-full justify-start gap-4 py-3 text-left">
                    <Tag className="h-5 w-5 text-gray-500" />
                    <span>Add a label</span>
                  </Button>
                  
                  <Button variant="ghost" className="w-full justify-start gap-4 py-3 text-left">
                    <Clock className="h-5 w-5 text-gray-500" />
                    <span>Your Maps activity</span>
                  </Button>
                </div>

                <Separator className="my-2" />
                
                <div className="px-6 py-2">
                  <h3 className="text-base font-medium mb-4">At this place</h3>
                  {/* We would add content here if there was any business info to show */}
                  <p className="text-sm text-gray-500">No additional information available</p>
                </div>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
};

export default PlaceDetails;
