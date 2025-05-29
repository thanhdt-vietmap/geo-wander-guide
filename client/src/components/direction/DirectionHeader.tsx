
import React from 'react';
import { X } from 'lucide-react';
import { Button } from '../../components/ui/button';

interface DirectionHeaderProps {
  onClose: () => void;
}

const DirectionHeader = ({ onClose }: DirectionHeaderProps) => {
  return (
    <div 
      className="w-full h-[150px] bg-cover bg-center relative flex items-center justify-center" 
      style={{ backgroundImage: "url('/lovable-uploads/759ebf50-d075-4366-98b3-99771c255fa9.png')" }}
    >
      <Button 
        variant="outline" 
        size="icon" 
        onClick={onClose} 
        className="absolute top-6 right-6 bg-white rounded-full h-10 w-10 shadow-md"
      >
        <X className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default DirectionHeader;
