
import React, { useState } from 'react';
import { Navigation, BookmarkIcon, Share2, Edit, MapPin, Building, Tag, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

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

  if (!place) return null;

  const addressParts = place.display?.split(',') || [];
  const fullAddress = addressParts.slice(1).join(',').trim();

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="absolute inset-y-0 left-0 z-40 flex">
      {/* Main content */}
      <Sheet open={!!place} onOpenChange={() => {}}>
        <SheetContent 
          side="left" 
          className={`sm:max-w-md w-full p-0 border-r transition-all duration-300 ease-in-out ${isCollapsed ? 'translate-x-[-100%]' : ''}`}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <SheetHeader className="p-6 pb-2">
              <SheetTitle className="text-xl font-semibold text-gray-900">{place.name}</SheetTitle>
              <p className="text-sm text-gray-600 mt-1">{fullAddress}</p>
            </SheetHeader>

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

            {/* Close button for mobile */}
            <div className="sm:hidden p-4 border-t">
              <Button 
                variant="ghost" 
                className="w-full text-sm text-gray-700 hover:bg-gray-100"
                onClick={onClose}
              >
                Close
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Collapse/Expand button */}
      <div className={`flex items-center transform transition-transform duration-300 ease-in-out z-50 ${isCollapsed ? 'translate-x-0' : ''}`}>
        <Button 
          onClick={handleToggleCollapse}
          variant="outline" 
          size="icon" 
          className="h-10 w-8 rounded-r-md rounded-l-none bg-white border border-l-0 shadow-md"
        >
          {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </Button>
      </div>
    </div>
  );
};

export default PlaceDetails;
