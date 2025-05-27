
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { getReverseGeocoding } from '@/services/mapService';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setContextMenu, closeContextMenu } from '@/store/slices/mapSlice';
import { setLocationInfo, setSelectedPlace } from '@/store/slices/locationSlice';
import { setLocationLoading } from '@/store/slices/uiSlice';

export const useMapHandlers = () => {
  const dispatch = useAppDispatch();
  const { contextMenu } = useAppSelector((state) => state.map);
  const { showDirections } = useAppSelector((state) => state.ui);
  const { selectedPlace } = useAppSelector((state) => state.location);

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
        dispatch(setLocationLoading(true));
        const placeDetails = await getReverseGeocoding(e.lngLat[0], e.lngLat[1]);
        
        if (mapRef?.current) {
          mapRef.current.addMarker(e.lngLat[0], e.lngLat[1], 'waypoint');
        }
        dispatch(setLocationLoading(false));
        return;
      }
      
      if (selectedPlace) dispatch(setSelectedPlace(null));
      
      dispatch(setLocationLoading(true));
      const placeDetails = await getReverseGeocoding(e.lngLat[0], e.lngLat[1]);
      dispatch(setLocationInfo(placeDetails));
      
      if (mapRef?.current) {
        mapRef.current.removeMarkers();
        mapRef.current.addMarker(e.lngLat[0], e.lngLat[1]);
      }
      dispatch(setLocationLoading(false));
    } catch (error) {
      dispatch(setLocationLoading(false));
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
