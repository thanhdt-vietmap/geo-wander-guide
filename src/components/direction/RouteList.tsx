
import React from 'react';
import { Button } from '@/components/ui/button';
import { Map as MapIcon } from 'lucide-react';

interface RouteSummary {
  id: string;
  distance: number;
  time: number;
  color: string;
}

interface RouteListProps {
  routeSummaries: RouteSummary[];
  selectedRouteId: string | null;
  onSelectRoute: (routeId: string) => void;
  onShowRouteDetails: () => void;
}

const RouteList = ({ routeSummaries, selectedRouteId, onSelectRoute, onShowRouteDetails }: RouteListProps) => {
  if (routeSummaries.length === 0) return null;

  return (
    <div className="flex-1 overflow-auto px-4 py-2">
      <h3 className="font-medium mb-3">Available routes</h3>
      <div className="space-y-2">
        {routeSummaries.map((route) => (
          <div
            key={route.id}
            className={`p-3 border rounded-md cursor-pointer transition-all ${
              selectedRouteId === route.id 
                ? 'border-primary bg-primary/5' 
                : 'border-gray-200 hover:bg-gray-50'
            }`}
            onClick={() => onSelectRoute(route.id)}
          >
            <div className="flex items-center">
              <div 
                className="w-3 h-10 rounded-full mr-3" 
                style={{ backgroundColor: route.color }}
              />
              <div className="flex-1">
                <div className="flex justify-between">
                  <span className="font-medium">{(route.distance / 1000).toFixed(2)} km</span>
                  <span className="text-gray-600">{Math.round(route.time / 60000)} mins</span>
                </div>
              </div>
            </div>
            
            {selectedRouteId === route.id && (
              <div className="mt-3 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={onShowRouteDetails}
                >
                  <MapIcon className="h-4 w-4" />
                  View details
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RouteList;
