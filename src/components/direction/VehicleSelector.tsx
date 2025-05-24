
import React from 'react';
import { Button } from '@/components/ui/button';

interface VehicleSelectorProps {
  vehicle: 'car' | 'bike' | 'foot' | 'motorcycle';
  onVehicleChange: (vehicle: 'car' | 'bike' | 'foot' | 'motorcycle') => void;
}

const VehicleSelector = ({ vehicle, onVehicleChange }: VehicleSelectorProps) => {
  const modes = [
    { id: 'car', icon: <span>🚗</span>, label: 'Car' },
    { id: 'motorcycle', icon: <span>🏍️</span>, label: 'Motorcycle' },
    { id: 'bike', icon: <span>🚲</span>, label: 'Bike' },
    { id: 'foot', icon: <span>🚶</span>, label: 'Walk' }
  ] as const;

  return (
    <div className="mb-4">
      <h3 className="text-sm font-medium mb-2 mt-[10px] ml-[10px]">Travel mode</h3>
      <div className="flex gap-2 px-[30px]">
        {modes.map(mode => (
          <Button
            key={mode.id}
            variant={vehicle === mode.id ? 'default' : 'outline'}
            size="sm"
            className="flex-1"
            onClick={() => onVehicleChange(mode.id)}
          >
            <span className="mr-1">{mode.icon}</span>
            <span>{mode.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default VehicleSelector;
