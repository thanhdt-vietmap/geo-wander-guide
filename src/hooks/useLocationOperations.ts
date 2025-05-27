
import { useCallback } from 'react';
import { toast } from 'sonner';
import { getReverseGeocoding } from '@/services/mapService';
import { useAppDispatch } from '@/store/hooks';
import { setLocationInfo, setSelectedPlace, setStartingPlace } from '@/store/slices/locationSlice';
import { setShowDirections, setLocationLoading } from '@/store/slices/uiSlice';

export const useLocationOperations = () => {
  const dispatch = useAppDispatch();

  const handleGetLocation = useCallback(async (lng: number, lat: number, mapRef: any) => {
    try {
      dispatch(setSelectedPlace(null));
      dispatch(setLocationLoading(true));
      
      const placeDetails = await getReverseGeocoding(lng, lat);
      dispatch(setLocationInfo(placeDetails));
      
      if (mapRef?.current) {
        mapRef.current.removeMarkers();
        mapRef.current.addMarker(lng, lat);
      }
      dispatch(setLocationLoading(false));
    } catch (error) {
      dispatch(setLocationLoading(false));
      toast.error('Failed to get location details');
      console.error(error);
    }
  }, [dispatch]);

  const handleSetAsStart = useCallback(async (lng: number, lat: number, mapRef: any) => {
    try {
      dispatch(setLocationLoading(true));
      const placeDetails = await getReverseGeocoding(lng, lat);
      dispatch(setStartingPlace(placeDetails));
      dispatch(setShowDirections(true));
      dispatch(setSelectedPlace(null));
      dispatch(setLocationInfo(null));
      
      if (mapRef?.current) {
        mapRef.current.removeMarkers();
        mapRef.current.removeRoutes();
      }
      dispatch(setLocationLoading(false));
    } catch (error) {
      dispatch(setLocationLoading(false));
      toast.error('Failed to set starting point');
      console.error(error);
    }
  }, [dispatch]);

  const handleSetAsEnd = useCallback(async (lng: number, lat: number, mapRef: any, directionRef: any) => {
    try {
      dispatch(setLocationLoading(true));
      const placeDetails = await getReverseGeocoding(lng, lat);
      
      dispatch(setShowDirections(true));
      dispatch(setSelectedPlace(null));
      dispatch(setLocationInfo(null));
      
      if (directionRef.current && directionRef.current.setEndPoint) {
        directionRef.current.setEndPoint(placeDetails);
      }
      
      if (mapRef?.current) {
        mapRef.current.removeMarkers();
        mapRef.current.removeRoutes();
      }
      dispatch(setLocationLoading(false));
    } catch (error) {
      dispatch(setLocationLoading(false));
      toast.error('Failed to set end point');
      console.error(error);
    }
  }, [dispatch]);

  const handleAddWaypoint = useCallback(async (lng: number, lat: number, directionRef: any) => {
    try {
      dispatch(setLocationLoading(true));
      const placeDetails = await getReverseGeocoding(lng, lat);
      
      if (directionRef.current && directionRef.current.addWaypoint) {
        directionRef.current.addWaypoint(placeDetails);
      }
      dispatch(setLocationLoading(false));
    } catch (error) {
      dispatch(setLocationLoading(false));
      toast.error('Failed to add waypoint');
      console.error(error);
    }
  }, [dispatch]);

  return {
    handleGetLocation,
    handleSetAsStart,
    handleSetAsEnd,
    handleAddWaypoint,
  };
};
