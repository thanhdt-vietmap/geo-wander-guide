
import { useEffect } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { setSelectedPlace } from '@/store/slices/locationSlice';
import { setPlaceDetailCollapsed, setShowDirections } from '@/store/slices/uiSlice';
import { SecureApiClient } from '@/services/secureApiClient';
import { PlaceDetails } from '@/types';
import { toast } from '@/hooks/use-toast';

const apiClient = SecureApiClient.getInstance();

export const useUrlPlaceLoader = (mapRef: any, onPlaceSelect?: (place: PlaceDetails) => void) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const loadPlaceFromUrl = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const placeId = urlParams.get('placeId');
      
      if (!placeId) return;

      try {
        console.log('Loading place from URL parameter:', placeId);
        
        const placeDetails: PlaceDetails = await apiClient.get('/place/v3', {
          refid: placeId
        });
        
        console.log('Loaded place details from URL:', placeDetails);
        
        // Set the place in Redux state
        dispatch(setSelectedPlace(placeDetails));
        dispatch(setPlaceDetailCollapsed(false));
        dispatch(setShowDirections(false));
        
        // Update search bar and map
        if (onPlaceSelect) {
          onPlaceSelect(placeDetails);
        }
        
        // Fly to the location on map
        if (mapRef?.current) {
          mapRef.current.flyTo(placeDetails.lng, placeDetails.lat);
          mapRef.current.addMarker(placeDetails.lng, placeDetails.lat);
        }
        
        // Clear the URL parameter after loading
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('placeId');
        window.history.replaceState({}, '', newUrl.toString());
        
      } catch (error) {
        console.error('Error loading place from URL:', error);
        toast({
          title: "Lỗi tải địa điểm",
          description: "Không thể tải thông tin địa điểm từ liên kết",
          variant: "destructive"
        });
        
        // Clear the invalid parameter
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('placeId');
        window.history.replaceState({}, '', newUrl.toString());
      }
    };

    loadPlaceFromUrl();
  }, [dispatch, mapRef, onPlaceSelect]);
};
