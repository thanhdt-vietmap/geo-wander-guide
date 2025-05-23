
import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Directions, Save, Share } from 'lucide-react';

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
  if (!place) return null;
  
  const addressParts = place.display?.split(',') || [];
  
  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 px-4 pb-4 pointer-events-none">
      <Card className="w-full shadow-lg pointer-events-auto">
        <CardContent className="pt-6 pb-2">
          <div className="mb-3">
            <h2 className="text-xl font-semibold text-gray-900">{place.name}</h2>
            <p className="text-sm text-gray-600">{addressParts.slice(1).join(',').trim()}</p>
          </div>
          
          <div className="flex items-center space-x-1 text-sm text-blue-600">
            <button className="hover:underline">Suggest an edit</button>
          </div>
        </CardContent>
        
        <CardFooter className="flex items-center justify-between py-2 border-t">
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center">
              <Button variant="ghost" size="icon" className="rounded-full h-12 w-12">
                <Directions className="h-6 w-6 text-blue-600" />
              </Button>
              <span className="text-xs mt-1">Directions</span>
            </div>
            
            <div className="flex flex-col items-center">
              <Button variant="ghost" size="icon" className="rounded-full h-12 w-12">
                <Save className="h-6 w-6 text-gray-600" />
              </Button>
              <span className="text-xs mt-1">Save</span>
            </div>
            
            <div className="flex flex-col items-center">
              <Button variant="ghost" size="icon" className="rounded-full h-12 w-12">
                <Share className="h-6 w-6 text-gray-600" />
              </Button>
              <span className="text-xs mt-1">Share</span>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            className="text-sm text-gray-700 hover:bg-gray-100"
            onClick={onClose}
          >
            Close
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PlaceDetails;
