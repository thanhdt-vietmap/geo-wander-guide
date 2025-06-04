import { useEffect } from 'react';
import { useAppDispatch } from '../store/hooks';
import { setShowDirections } from '../store/slices/uiSlice';
import { setStartingPlace, setSelectedPlace, setLocationInfo } from '../store/slices/locationSlice';
import { toast } from '../hooks/use-toast';
import { DirectionRef } from '../components/Direction';
import { MapViewRef } from '../components/MapView';

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
  
  useEffect(() => {

    const loadDirectionFromUrl = async () => {

      const urlParams = new URLSearchParams(window.location.search);
      const pointsParam = urlParams.get('points');
      const vehicleParam = urlParams.get('vehicle');

      if (!pointsParam) return;

      try {
        // Parse points parameter: "lat1,lng1;lat2,lng2;lat3,lng3"
        const pointStrings = pointsParam.split('|');
        if (pointStrings.length < 2) {
          console.warn('Invalid route URL: need at least 2 points');
          return;
        }

        // Parse each point to coordinates only
        const coordinates: Array<{lat: number, lng: number}> = [];
        const processedCoordinates = new Set<string>(); // Track processed coordinates to avoid duplicates
        
        for (let i = 0; i < pointStrings.length; i++) {
          const pointString = pointStrings[i];
          const [latStr, lngStr] = pointString.split(',');
          const lat = parseFloat(latStr);
          const lng = parseFloat(lngStr);
          
          if (isNaN(lat) || isNaN(lng)) {
            console.warn('Invalid coordinate in route URL:', pointString);
            continue;
          }
          
          // Create unique key for this coordinate pair
          const coordKey = `${lat.toFixed(6)},${lng.toFixed(6)}`;
          
          // Check if we've already processed this coordinate
          if (processedCoordinates.has(coordKey)) {
            console.warn('Duplicate coordinate detected, skipping:', coordKey);
            continue;
          }
          
          processedCoordinates.add(coordKey);
          
          // Just add coordinates, no reverse geocoding
          coordinates.push({ lat, lng });
        }

        if (coordinates.length < 2) {
          console.warn('Could not parse enough valid coordinates from URL');
          return;
        }

        console.log('Loading route from URL with coordinates:', coordinates);

        // Clear any existing selections
        dispatch(setSelectedPlace(null));
        dispatch(setLocationInfo(null));
        
        // Show directions panel
        dispatch(setShowDirections(true));

        // Set up map view to show all coordinates
        if (mapRef.current && coordinates.length > 0) {
          // Calculate bounds for all coordinates
          const lats = coordinates.map(coord => coord.lat);
          const lngs = coordinates.map(coord => coord.lng);
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
            loadCoordinatesIntoDirection(coordinates, directionRef, vehicleParam);
          } else {
            // Retry if component not ready
            setTimeout(() => {
              if (directionRef.current) {
                loadCoordinatesIntoDirection(coordinates, directionRef, vehicleParam);
              }
            }, 500);
          }
        }, 200);

        // Clear URL parameters after loading
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('points');
        newUrl.searchParams.delete('vehicle');
        window.history.replaceState({}, '', newUrl.toString());

        toast({
          title: "Route loaded from URL",
          description: `Loaded route with ${coordinates.length} waypoints`,
        });

      } catch (error) {
        console.error('Error loading route from URL:', error);
        toast({
          title: "Error loading route",
          description: "Could not load route from the shared link",
          variant: "destructive"
        });
        
        // Clear invalid parameters
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('points');
        newUrl.searchParams.delete('vehicle');
        window.history.replaceState({}, '', newUrl.toString());
      }
    };

    loadDirectionFromUrl();
  }, [dispatch, mapRef, directionRef]);
};

// Helper function to load coordinates into the Direction component
const loadCoordinatesIntoDirection = (
  coordinates: Array<{lat: number, lng: number}>, 
  directionRef: React.RefObject<DirectionRef>,
  vehicleParam: string | null
) => {
  if (!directionRef.current) return;
  try {
    // Use the new setWaypointsFromCoordinates method that handles sequential input filling
    // This will create inputs and fill them with lat/lng coordinates with 500ms delays
    directionRef.current.setWaypointsFromCoordinates(coordinates);

    // Set vehicle type if provided
    if (vehicleParam && ['car', 'bike', 'foot', 'motorcycle'].includes(vehicleParam) && directionRef.current?.setVehicle) {
      directionRef.current.setVehicle(vehicleParam);
      console.log('Vehicle type set from URL:', vehicleParam);
    }

    console.log('Successfully started loading coordinates into Direction component');
  } catch (error) {
    console.error('Error loading coordinates into Direction component:', error);
  }
};
