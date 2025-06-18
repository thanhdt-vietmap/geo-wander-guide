
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/button';
import CarIcon from '../icons/CarIcon';
import MotorcycleIcon from '../icons/MotorcycleIcon';
import BikeIcon from '../icons/BikeIcon';
import WalkIcon from '../icons/WalkIcon';

interface VehicleSelectorProps {
  vehicle: 'car' | 'bike' | 'foot' | 'motorcycle';
  onVehicleChange: (vehicle: 'car' | 'bike' | 'foot' | 'motorcycle') => void;
}

const VehicleSelector = ({ vehicle, onVehicleChange }: VehicleSelectorProps) => {
  const { t } = useTranslation();
  
  const modes = [
    { id: 'car', icon: <CarIcon className="w-6 h-6 vehicle-icon" />, label: t('direction.vehicle.car') },
    { id: 'motorcycle', icon: <MotorcycleIcon className="w-6 h-6 vehicle-icon" />, label: t('direction.vehicle.motorcycle') },
    { id: 'bike', icon: <BikeIcon className="w-6 h-6 vehicle-icon" />, label: t('direction.vehicle.bike') },
    { id: 'foot', icon: <WalkIcon className="w-6 h-6 vehicle-icon" />, label: t('direction.vehicle.foot') }
  ] as const;

  return (
    <div className="mb-[10px] mt-[10px]">
      <h3 className="font-medium mb-3 px-4">{t('direction.travelMode')}</h3>
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
