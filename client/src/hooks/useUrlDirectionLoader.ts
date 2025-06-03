import { useEffect } from 'react';
import { useAppDispatch } from '../store/hooks';
import { setShowDirections } from '../store/slices/uiSlice';
import { setStartingPlace, setSelectedPlace, setLocationInfo } from '../store/slices/locationSlice';
import { apiService } from '../services/apiService';
import { getReverseGeocoding } from '../services/mapService';
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
        const pointStrings = pointsParam.split(';');
        
        if (pointStrings.length < 2) {
          console.warn('Invalid route URL: need at least 2 points');
          return;
        }

        // Parse each point
        const waypoints: WayPoint[] = [];
        const processedCoordinates = new Set<string>(); // Track processed coordinates to avoid duplicate calls
        
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
          
          // Add delay between reverse geocoding calls (500ms)
          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          
          // Get location details using reverse geocoding
          try {
            const locationDetails = await getReverseGeocoding(lng, lat);
            waypoints.push({
              name: locationDetails.display,
              lat: locationDetails.lat,
              lng: locationDetails.lng,
              ref_id: locationDetails.ref_id
            });
          } catch (error) {
            // If reverse geocoding fails, use coordinates as name
            waypoints.push({
              name: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
              lat,
              lng
            });
          }
        }

        if (waypoints.length < 2) {
          console.warn('Could not parse enough valid waypoints from URL');
          return;
        }        console.log('Loading route from URL with waypoints:', waypoints);

        // Clear any existing selections
        dispatch(setSelectedPlace(null));
        dispatch(setLocationInfo(null));
        
        // Show directions panel
        dispatch(setShowDirections(true));

        // Set up map view to show all waypoints
        if (mapRef.current && waypoints.length > 0) {
          // Calculate bounds for all waypoints
          const lats = waypoints.map(wp => wp.lat);
          const lngs = waypoints.map(wp => wp.lng);
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

        // Wait for Direction component to mount, then load waypoints
        setTimeout(() => {
          if (directionRef.current) {
            // Load all waypoints at once into direction component
            loadWaypointsIntoDirection(waypoints, directionRef, vehicleParam);
          } else {
            // Retry if component not ready
            setTimeout(() => {
              if (directionRef.current) {
                loadWaypointsIntoDirection(waypoints, directionRef, vehicleParam);
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
          description: `Loaded route with ${waypoints.length} waypoints`,
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

// Helper function to load waypoints into the Direction component
const loadWaypointsIntoDirection = (
  waypoints: WayPoint[], 
  directionRef: React.RefObject<DirectionRef>,
  vehicleParam: string | null
) => {
  if (!directionRef.current) return;

  try {
    // Use the new setAllWaypoints method to set all waypoints at once
    // This ensures the correct number of inputs (waypoints.length) is generated
    directionRef.current.setAllWaypoints(waypoints);

    // Set vehicle type if provided
    if (vehicleParam && ['car', 'bike', 'foot', 'motorcycle'].includes(vehicleParam) && directionRef.current?.setVehicle) {
      directionRef.current.setVehicle(vehicleParam);
      console.log('Vehicle type set from URL:', vehicleParam);
    }

    console.log('Successfully loaded waypoints into Direction component');
  } catch (error) {
    console.error('Error loading waypoints into Direction component:', error);
  }
};
