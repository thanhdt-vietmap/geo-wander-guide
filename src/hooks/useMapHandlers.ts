
import { useCallback } from 'react';
import { toast } from 'sonner';
import { getReverseGeocoding } from '@/services/mapService';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setContextMenu, closeContextMenu } from '@/store/slices/mapSlice';
import { setLocationInfo, setSelectedPlace } from '@/store/slices/locationSlice';

export const useMapHandlers = () => {
  const dispatch = useAppDispatch();
  const { contextMenu } = useAppSelector((state) => state.map);
  const { showDirections, selectedPlace } = useAppSelector((state) => state.ui);

  const handleMapContextMenu = useCallback((e: { lngLat: [number, number] }) => {
    console.log('Context menu triggered at:', e.lngLat);
    
    let x = 100;
    let y = 100;
    
    if (window.event) {
      const mouseEvent = window.event as MouseEvent;
      x = mouseEvent.clientX;
      y = mouseEvent.clientY;
    }
    
    console.log('Setting context menu at position:', { x, y });
    
    dispatch(setContextMenu({
      isOpen: true,
      x: x,
      y: y,
      lng: e.lngLat[0],
      lat: e.lngLat[1],
    }));
  }, [dispatch]);

  const handleMapClick = useCallback(async (e: { lngLat: [number, number] }, mapRef: any) => {
    try {
      if (contextMenu?.isOpen) {
        dispatch(closeContextMenu());
      }
      
      if (showDirections) {
        const placeDetails = await getReverseGeocoding(e.lngLat[0], e.lngLat[1]);
        
        if (mapRef?.current) {
          mapRef.current.addMarker(e.lngLat[0], e.lngLat[1], 'waypoint');
        }
        return;
      }
      
      if (selectedPlace) dispatch(setSelectedPlace(null));
      
      const placeDetails = await getReverseGeocoding(e.lngLat[0], e.lngLat[1]);
      dispatch(setLocationInfo(placeDetails));
      
      if (mapRef?.current) {
        mapRef.current.removeMarkers();
        mapRef.current.addMarker(e.lngLat[0], e.lngLat[1]);
      }
    } catch (error) {
      toast.error('Failed to get location details');
      console.error(error);
    }
  }, [contextMenu?.isOpen, showDirections, selectedPlace, dispatch]);

  const handleCloseContextMenu = useCallback(() => {
    dispatch(closeContextMenu());
  }, [dispatch]);

  return {
    handleMapContextMenu,
    handleMapClick,
    handleCloseContextMenu,
  };
};
