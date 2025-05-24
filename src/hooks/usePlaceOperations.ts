
import { useCallback } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { setSelectedPlace, setLocationInfo } from '@/store/slices/locationSlice';
import { setPlaceDetailCollapsed, setShowDirections } from '@/store/slices/uiSlice';
import { PlaceDetails } from '@/types';
import { MapViewRef } from '@/components/MapView';

export const usePlaceOperations = () => {
  const dispatch = useAppDispatch();

  const handlePlaceSelect = useCallback((place: PlaceDetails, mapRef: React.RefObject<MapViewRef>) => {
    dispatch(setSelectedPlace(place));
    dispatch(setPlaceDetailCollapsed(false));
    dispatch(setShowDirections(false));
    dispatch(setLocationInfo(null));
    
    if (mapRef.current) {
      mapRef.current.flyTo(place.lng, place.lat);
      mapRef.current.addMarker(place.lng, place.lat);
    }
  }, [dispatch]);

  const handleClosePlaceDetails = useCallback((mapRef: React.RefObject<MapViewRef>) => {
    dispatch(setSelectedPlace(null));
    if (mapRef.current) {
      mapRef.current.removeMarkers();
    }
  }, [dispatch]);

  const handleCloseLocationInfo = useCallback((mapRef: React.RefObject<MapViewRef>) => {
    dispatch(setLocationInfo(null));
    if (mapRef.current) {
      mapRef.current.removeMarkers();
    }
  }, [dispatch]);

  return {
    handlePlaceSelect,
    handleClosePlaceDetails,
    handleCloseLocationInfo
  };
};
