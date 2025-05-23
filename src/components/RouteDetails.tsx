
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface RouteInstruction {
  distance: number;
  heading: number;
  sign: number;
  interval: number[];
  text: string;
  time: number;
  street_name: string;
  last_heading: number | null;
}

interface RouteDetailsProps {
  path: {
    distance: number;
    weight: number;
    time: number;
    instructions: RouteInstruction[];
  };
  onBack: () => void;
}

const RouteDetails: React.FC<RouteDetailsProps> = ({ path, onBack }) => {
  return (
    <div className="fixed top-0 left-0 h-full z-40 transition-all duration-300 w-[500px] bg-white shadow-lg">
      {/* Header */}
      <div 
        className="w-full h-[150px] bg-cover bg-center relative flex items-center justify-center" 
        style={{ backgroundImage: "url('/lovable-uploads/759ebf50-d075-4366-98b3-99771c255fa9.png')" }}
      >
        <Button 
          variant="outline" 
          size="icon" 
          onClick={onBack} 
          className="absolute top-6 left-6 bg-white rounded-full h-10 w-10 shadow-md"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Route Summary */}
      <div className="px-6 py-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Route Details</h2>
          <div className="text-right">
            <p className="text-sm font-medium">{(path.distance / 1000).toFixed(2)} km</p>
            <p className="text-sm text-gray-500">{Math.round(path.time / 60000)} mins</p>
          </div>
        </div>
        
        <Separator className="my-4" />
        
        {/* Instructions */}
        <div className="space-y-4 pb-20">
          {path.instructions.map((instruction, index) => (
            <div 
              key={index} 
              className="py-3 px-4 border-l-2 border-blue-500 hover:bg-gray-50 rounded-r-md"
            >
              <p className="font-medium">{instruction.text}</p>
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>{(instruction.distance / 1000).toFixed(2)} km</span>
                <span>{Math.round(instruction.time / 60000)} mins</span>
              </div>
              {instruction.street_name && (
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Street: </span> 
                  {instruction.street_name}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RouteDetails;
