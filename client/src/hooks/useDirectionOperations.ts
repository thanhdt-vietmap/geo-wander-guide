
import { useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setStartingPlace, setSelectedPlace, setLocationInfo } from '../store/slices/locationSlice';
import { setShowDirections } from '../store/slices/uiSlice';
import { DirectionRef } from '../components/Direction';
import { MapViewRef } from '../components/MapView';

export const useDirectionOperations = () => {
  const dispatch = useAppDispatch();
  const { selectedPlace, locationInfo } = useAppSelector((state) => state.location);
  
  const handleShowDirections = useCallback(() => {
    dispatch(setStartingPlace(selectedPlace || locationInfo));
    dispatch(setShowDirections(true));
    dispatch(setSelectedPlace(null));
    dispatch(setLocationInfo(null));
  }, [dispatch, selectedPlace, locationInfo]);

  const handleCloseDirections = useCallback((mapRef: React.RefObject<MapViewRef>) => {
    dispatch(setShowDirections(false));
    dispatch(setStartingPlace(null));
    
    if (mapRef.current) {
      mapRef.current.setMarkerDragCallback(null);
      mapRef.current.removeMarkers();
      mapRef.current.removeRoutes();
    }
  }, [dispatch]);

  const handleDirectionMapClick = useCallback((activeInputIndex: number | null) => {
    return true;
  }, []);

  return {
    handleShowDirections,
    handleCloseDirections,
    handleDirectionMapClick
  };
};
