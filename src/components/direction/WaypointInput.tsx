
import React from 'react';
import { Search, X, ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface WayPoint {
  name: string;
  lat: number;
  lng: number;
  ref_id?: string;
}

interface WaypointInputProps {
  waypoint: WayPoint;
  index: number;
  totalWaypoints: number;
  draggedIndex: number | null;
  activeInputIndex: number | null;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>, index: number) => void;
  onInputFocus: (index: number) => void;
  onMoveWaypoint: (index: number, direction: 'up' | 'down') => void;
  onRemoveWaypoint: (index: number) => void;
  onDragStart: (index: number) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onSwapWaypoints?: () => void;
  inputRef: (el: HTMLInputElement | null) => void;
}

const WaypointInput = ({
  waypoint,
  index,
  totalWaypoints,
  draggedIndex,
  activeInputIndex,
  onInputChange,
  onInputFocus,
  onMoveWaypoint,
  onRemoveWaypoint,
  onDragStart,
  onDragEnd,
  onDragOver,
  onSwapWaypoints,
  inputRef
}: WaypointInputProps) => {
  const getPlaceholder = () => {
    if (index === 0) return "Điểm bắt đầu hoặc tọa độ (vd: 21.0285, 105.8342)";
    if (index === totalWaypoints - 1) return "Điểm đến hoặc tọa độ (vd: 21.0285, 105.8342)";
    return "Điểm dừng hoặc tọa độ (vd: 21.0285, 105.8342)";
  };

  const canRemove = totalWaypoints > 2;
  const showInlineSwap = totalWaypoints === 2 && index === 0 && onSwapWaypoints;

  return (
    <div 
      className={`relative flex items-center gap-2 ${
        draggedIndex === index ? 'opacity-50 bg-gray-100' : ''
      }`}
      draggable={totalWaypoints > 2}
      onDragStart={() => onDragStart(index)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => onDragOver(e, index)}
    >
      {/* Reorder buttons for >2 waypoints */}
      {totalWaypoints > 2 && (
        <div className="flex flex-col">
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 p-0"
            onClick={() => onMoveWaypoint(index, 'up')}
            disabled={index === 0}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 p-0"
            onClick={() => onMoveWaypoint(index, 'down')}
            disabled={index === totalWaypoints - 1}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      <div className="flex-1 relative">
        <Input
          placeholder={getPlaceholder()}
          value={waypoint.name}
          onChange={(e) => onInputChange(e, index)}
          onFocus={() => onInputFocus(index)}
          className={`pl-10 ${canRemove ? 'pr-8' : 'pr-3'}`}
          ref={inputRef}
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        
        {/* Remove button for waypoints */}
        {canRemove && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6"
            onClick={() => onRemoveWaypoint(index)}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Swap button in the same row for exactly 2 waypoints */}
      {showInlineSwap && (
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 flex-shrink-0"
          onClick={onSwapWaypoints}
        >
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default WaypointInput;
