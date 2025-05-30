
import { useCallback } from 'react';
import { useAppDispatch } from '../store/hooks';
import { setSelectedPlace, setLocationInfo } from '../store/slices/locationSlice';
import { setPlaceDetailCollapsed, setShowDirections } from '../store/slices/uiSlice';
import { PlaceDetails } from '../types';
import { MapViewRef } from '../components/MapView';
import { toast } from '../hooks/use-toast';

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

  const handleSharePlace = useCallback(async (place: PlaceDetails) => {
    try {
      // console.log('Sharing place:', place);
      if (!place.ref_id) {
        toast({
          title: "Lỗi chia sẻ",
          description: "Không thể chia sẻ địa điểm này",
          variant: "destructive"
        });
        return;
      }

      const shareUrl = `${window.location.origin}${window.location.pathname}?placeId=${place.ref_id}`;
      await navigator.clipboard.writeText(shareUrl);
      
      toast({
        title: "Đã sao chép liên kết",
        description: "Liên kết chia sẻ đã được sao chép vào clipboard"
      });
    } catch (error) {
      // console.error('Error sharing place:', error);
      toast({
        title: "Lỗi chia sẻ",
        description: "Không thể sao chép liên kết chia sẻ",
        variant: "destructive"
      });
    }
  }, []);

  return {
    handlePlaceSelect,
    handleClosePlaceDetails,
    handleCloseLocationInfo,
    handleSharePlace
  };
};
