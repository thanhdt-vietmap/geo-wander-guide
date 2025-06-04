
import { useCallback } from 'react';
import { toast } from 'sonner';
import { getReverseGeocoding } from '../services/mapService';
import { useAppDispatch } from '../store/hooks';
import { setLocationInfo, setSelectedPlace, setStartingPlace } from '../store/slices/locationSlice';
import { setShowDirections } from '../store/slices/uiSlice';

export const useLocationOperations = () => {
  const dispatch = useAppDispatch();

  const handleGetLocation = useCallback(async (lng: number, lat: number, mapRef: any) => {
    try {
      dispatch(setSelectedPlace(null));
      
      const placeDetails = await getReverseGeocoding(lng, lat);
      dispatch(setLocationInfo(placeDetails));
      
      if (mapRef?.current) {
        mapRef.current.removeMarkers();
        mapRef.current.addMarker(lng, lat);
      }
    } catch (error) {
      toast.error('Failed to get location details');
      // console.error(error);
    }
  }, [dispatch]);

  const handleSetAsStart = useCallback(async (lng: number, lat: number, mapRef: any, ) => {
    try {
      const placeDetails = await getReverseGeocoding(lng, lat);
      dispatch(setStartingPlace(placeDetails));
      dispatch(setShowDirections(true));
      dispatch(setSelectedPlace(null));
      dispatch(setLocationInfo(null));
      if (mapRef?.current) {
        mapRef.current.removeMarkers();
        mapRef.current.removeRoutes();
      }
    } catch (error) {
      toast.error('Failed to set starting point');
      // console.error(error);
    }
  }, [dispatch]);

  const handleSetAsEnd = useCallback(async (lng: number, lat: number, mapRef: any, directionRef: any) => {
    try {
      const placeDetails = await getReverseGeocoding(lng, lat);
      
      // Always show directions first
      dispatch(setShowDirections(true));
      dispatch(setSelectedPlace(null));
      dispatch(setLocationInfo(null));
      
      // Add marker immediately for visual feedback
      if (mapRef?.current) {
        mapRef.current.addMarker(lng, lat, 'end');
      }
      
      // If directionRef exists and Direction is already open, set end point directly
      if (directionRef.current && directionRef.current.setEndPoint) {
        directionRef.current.setEndPoint(placeDetails);
      } else {
        // If Direction is not open yet, store as starting place and the new location as end point
        // We'll use a timeout to ensure Direction component is mounted before setting end point
        setTimeout(() => {
          if (directionRef.current && directionRef.current.setEndPoint) {
            directionRef.current.setEndPoint(placeDetails);
          }
        }, 100);
      }
    } catch (error) {
      toast.error('Failed to set end point');
      // console.error(error);
    }
  }, [dispatch]);

  const handleAddWaypoint = useCallback(async (lng: number, lat: number, directionRef: any, mapRef: any) => {
    try {
      const placeDetails = await getReverseGeocoding(lng, lat);
      
      // Add marker immediately for visual feedback
      if (mapRef?.current) {
        mapRef.current.addMarker(lng, lat, 'waypoint');
      }
      
      if (directionRef.current && directionRef.current.addWaypoint) {
        directionRef.current.addWaypoint(placeDetails);
      }
    } catch (error) {
      toast.error('Failed to add waypoint');
      // console.error(error);
    }
  }, []);

  return {
    handleGetLocation,
    handleSetAsStart,
    handleSetAsEnd,
    handleAddWaypoint,
  };
};
