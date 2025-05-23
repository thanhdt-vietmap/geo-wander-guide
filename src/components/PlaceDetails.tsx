
import React, { useState, useEffect } from 'react';
import { Navigation, BookmarkIcon, Share2, Edit, MapPin, Building, Tag, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from "@/components/ui/separator";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

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
  } | null;
  onClose: () => void;
}

const PlaceDetails: React.FC<PlaceDetailsProps> = ({ place, onClose }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if we're on mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // Initial check
    checkMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!place) return null;

  const addressParts = place.display?.split(',') || [];
  const fullAddress = addressParts.slice(1).join(',').trim();

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <>
      {/* Desktop sidebar-style panel - only show on desktop */}
      {!isMobile && (
        <div className="fixed top-[86px] left-6 z-10">
          <div className={`transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-96 opacity-100'}`}>
            <div className="bg-white shadow-lg rounded-lg border border-gray-200">
              {/* Header */}
              <div className="p-6 pb-2">
                <h2 className="text-xl font-semibold text-gray-900">{place.name}</h2>
                <p className="text-sm text-gray-600 mt-1">{fullAddress}</p>
              </div>

              {/* Action buttons */}
              <div className="flex justify-between px-6 py-4">
                <div className="flex flex-col items-center">
                  <Button variant="ghost" size="icon" className="rounded-full h-12 w-12 bg-blue-50 text-blue-600">
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
                  <Button variant="ghost" size="icon" className="rounded-full h-12 w-12">
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

              {/* Address and interactions */}
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
              <div className="max-h-[400px] overflow-auto">
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
                
                <div className="px-6 py-2 pb-4">
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
          className={`fixed top-[140px] z-20 transition-all duration-300 ${isCollapsed ? 'left-6' : 'left-[402px]'}`}
        >
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 bg-white border border-gray-200 rounded-full shadow-md"
            onClick={toggleCollapse}
          >
            {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
        </div>
      )}

      {/* Mobile drawer - only show on mobile */}
      {isMobile && (
        <Drawer open={!!place} onOpenChange={(open) => !open && onClose()}>
          <DrawerContent className="h-[85vh]">
            <DrawerHeader className="p-4 border-b">
              <DrawerTitle>{place.name}</DrawerTitle>
              <p className="text-sm text-gray-500">{fullAddress}</p>
            </DrawerHeader>
            <div className="p-4 overflow-auto">
              {/* Mobile version of the same content */}
              {/* Action buttons */}
              <div className="flex justify-between px-2 py-4">
                <div className="flex flex-col items-center">
                  <Button variant="ghost" size="icon" className="rounded-full h-12 w-12 bg-blue-50 text-blue-600">
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
                  <Button variant="ghost" size="icon" className="rounded-full h-12 w-12">
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
