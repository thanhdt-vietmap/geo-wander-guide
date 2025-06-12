import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppDispatch } from '../store/hooks';
import { setShowDirections } from '../store/slices/uiSlice';
import { setStartingPlace, setSelectedPlace, setLocationInfo } from '../store/slices/locationSlice';
import { toast } from '../hooks/use-toast';
import { DirectionRef } from '../components/Direction';
import { MapViewRef } from '../components/MapView';
import { RouteShareService } from '../services/routeShareService';

interface WayPoint {
  name: string;
  lat: number;
  lng: number;
  ref_id?: string;
}

export const useUrlDirectionLoader = (
  mapRef: React.RefObject<MapViewRef>, 
  directionRef: React.RefObject<DirectionRef>
) => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  
  useEffect(() => {

    const loadDirectionFromUrl = async () => {
      // Use RouteShareService to parse waypoints (supports both encrypted and legacy formats)
      const routeData = RouteShareService.parseWaypointsFromUrl();
      
      if (!routeData) return;

      try {
        const { waypoints, vehicle } = routeData;
        
        console.log('Loading route from URL with coordinates:', waypoints);

        // Clear any existing selections
        dispatch(setSelectedPlace(null));
        dispatch(setLocationInfo(null));
        
        // Show directions panel
        dispatch(setShowDirections(true));

        // Set up map view to show all coordinates
        if (mapRef.current && waypoints.length > 0) {
          // Calculate bounds for all coordinates
          const lats = waypoints.map(coord => coord.lat);
          const lngs = waypoints.map(coord => coord.lng);
          const minLat = Math.min(...lats);
          const maxLat = Math.max(...lats);
          const minLng = Math.min(...lngs);
          const maxLng = Math.max(...lngs);
          
          // Add some padding
          const latPadding = (maxLat - minLat) * 0.1 || 0.01;
          const lngPadding = (maxLng - minLng) * 0.1 || 0.01;
          
          mapRef.current.fitBounds([
            [minLng - lngPadding, minLat - latPadding],
            [maxLng + lngPadding, maxLat + latPadding]
          ], {
            padding: {
              top: 100,
              bottom: 100,
              left: 550, // Account for direction panel width
              right: 100
            }
          });
        }

        // Wait for Direction component to mount, then load coordinates
        setTimeout(() => {
          if (directionRef.current) {
            // Load coordinates into direction component (no reverse geocoding, just fill inputs)
            loadCoordinatesIntoDirection(waypoints, directionRef, vehicle);
          } else {
            // Retry if component not ready
            setTimeout(() => {
              if (directionRef.current) {
                loadCoordinatesIntoDirection(waypoints, directionRef, vehicle);
              }
            }, 500);
          }
        }, 200);

        // Clear URL parameters after loading using RouteShareService
        RouteShareService.clearRouteFromUrl();

        toast({
          title: t('load.routeLoadedTitle'),
          description: t('load.routeLoadedDesc', { count: waypoints.length }),
        });

      } catch (error) {
        console.error('Error loading route from URL:', error);
        toast({
          title: t('load.routeLoadErrorTitle'),
          description: t('load.routeLoadErrorDesc'),
          variant: "destructive"
        });
        
        // Clear invalid parameters using RouteShareService
        RouteShareService.clearRouteFromUrl();
      }
    };

    loadDirectionFromUrl();
  }, [dispatch, mapRef, directionRef]);
};

// Helper function to load coordinates into the Direction component
const loadCoordinatesIntoDirection = (
  coordinates: Array<{lat: number, lng: number}>, 
  directionRef: React.RefObject<DirectionRef>,
  vehicle: string
) => {
  if (!directionRef.current) return;
  try {
    // Use the new setWaypointsFromCoordinates method that handles sequential input filling
    // This will create inputs and fill them with lat/lng coordinates with 500ms delays
    directionRef.current.setWaypointsFromCoordinates(coordinates);

    // Set vehicle type if provided
    if (vehicle && ['car', 'bike', 'foot', 'motorcycle'].includes(vehicle) && directionRef.current?.setVehicle) {
      directionRef.current.setVehicle(vehicle);
      console.log('Vehicle type set from URL:', vehicle);
    }

    console.log('Successfully started loading coordinates into Direction component');
  } catch (error) {
    console.error('Error loading coordinates into Direction component:', error);
  }
};
