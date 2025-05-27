
import { useEffect } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { setSelectedPlace, setLocationInfo } from '@/store/slices/locationSlice';
import { setPlaceDetailCollapsed, setShowDirections } from '@/store/slices/uiSlice';
import { SecureApiClient } from '@/services/secureApiClient';
import { PlaceDetails } from '@/types';
import { toast } from '@/hooks/use-toast';

const apiClient = SecureApiClient.getInstance();

export const useUrlPlaceLoader = (mapRef: any, onPlaceSelect?: (place: PlaceDetails) => void) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const loadLatLngFromUrl = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const lat = parseFloat(urlParams.get('lat') || '');
      const lng = parseFloat(urlParams.get('lng') || '');
      if (isNaN(lat) || isNaN(lng)) return;
      console.log('Loading lat/lng from URL parameters:', lat, lng);
      if (mapRef?.current) {
        mapRef.current.flyTo(lng, lat);
        mapRef.current.addMarker(lng, lat);
        dispatch(setSelectedPlace(null));
        dispatch(setPlaceDetailCollapsed(false));
        dispatch(setShowDirections(false));
        const data = await apiClient.get<any[]>('/reverse/v3', {
          lng: lng.toString(),
          lat: lat.toString()
        });
        if (data && data.length > 0) {
          const placeDetails: PlaceDetails = {
            display: data[0].display,
            name: data[0].name,
            hs_num: data[0].name.split(' ')[0] || '',
            street: data[0].name.split(' ').slice(1).join(' ') || '',
            address: data[0].address,
            city_id: data[0].boundaries.find(b => b.type === 0)?.id || 0,
            city: data[0].boundaries.find(b => b.type === 0)?.name || '',
            district_id: data[0].boundaries.find(b => b.type === 1)?.id || 0,
            district: data[0].boundaries.find(b => b.type === 1)?.name || '',
            ward_id: data[0].boundaries.find(b => b.type === 2)?.id || 0,
            ward: data[0].boundaries.find(b => b.type === 2)?.name || '',
            lat: data[0].lat,
            lng: data[0].lng,
            ref_id: data[0].ref_id || ''
          };
          console.log('Loaded place details from lat/lng:', placeDetails);
          
          // Set as location info instead of selected place to avoid conflicts
          dispatch(setLocationInfo(placeDetails));
          
          // Update search bar if callback provided
          if (onPlaceSelect) {
            onPlaceSelect(placeDetails);
          }
        } else {
          console.warn('No place details found for lat/lng:', lat, lng);
        }
      }
    }
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
        
        // Set as location info instead of selected place to avoid conflicts
        dispatch(setLocationInfo(placeDetails));
        dispatch(setSelectedPlace(null));
        dispatch(setPlaceDetailCollapsed(false));
        dispatch(setShowDirections(false));
        
        // Update search bar if callback provided
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
    loadLatLngFromUrl();
  }, [dispatch, mapRef, onPlaceSelect]);
};
