
import React, { useRef, useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSidebarOpen, setPlaceDetailCollapsed, setShowDirections } from '@/store/slices/uiSlice';
import { setSelectedPlace, setLocationInfo, setStartingPlace } from '@/store/slices/locationSlice';
import { setCurrentLayer, setMapRef } from '@/store/slices/mapSlice';
import { useMapHandlers } from '@/hooks/useMapHandlers';
import { useLocationOperations } from '@/hooks/useLocationOperations';
import MapView, { MapViewRef } from '@/components/MapView';
import SearchBar from '@/components/SearchBar';
import Sidebar from '@/components/Sidebar';
import MapControls from '@/components/MapControls';
import PlaceDetails from '@/components/PlaceDetails';
import Direction, { DirectionRef } from '@/components/Direction';
import MapContextMenu from '@/components/MapContextMenu';
import LocationInfoCard from '@/components/LocationInfoCard';
import { PlaceDetails as PlaceDetailsType } from '@/types';
import { MapLayerType } from '@/components/MapLayerSelector';

const Index = () => {
  const dispatch = useAppDispatch();
  
  // Redux state
  const { isSidebarOpen, showDirections } = useAppSelector((state) => state.ui);
  const { selectedPlace, locationInfo, startingPlace } = useAppSelector((state) => state.location);
  const { currentLayer, contextMenu } = useAppSelector((state) => state.map);
  
  // Refs
  const mapRef = useRef<MapViewRef>(null);
  const directionRef = useRef<DirectionRef>(null);
  const directionActiveInputRef = useRef<number | null>(null);
  
  // Custom hooks
  const { handleMapContextMenu, handleMapClick, handleCloseContextMenu } = useMapHandlers();
  const { handleGetLocation, handleSetAsStart, handleSetAsEnd, handleAddWaypoint } = useLocationOperations();

  // Event handlers
  const handleMenuToggle = () => {
    dispatch(setSidebarOpen(!isSidebarOpen));
  };

  const handleSidebarClose = () => {
    dispatch(setSidebarOpen(false));
  };

  const handlePlaceSelect = (place: PlaceDetailsType) => {
    dispatch(setSelectedPlace(place));
    dispatch(setPlaceDetailCollapsed(false));
    dispatch(setShowDirections(false));
    dispatch(setLocationInfo(null));
    
    if (mapRef.current) {
      mapRef.current.flyTo(place.lng, place.lat);
      mapRef.current.addMarker(place.lng, place.lat);
    }
  };

  const handleClosePlaceDetails = () => {
    dispatch(setSelectedPlace(null));
    if (mapRef.current) {
      mapRef.current.removeMarkers();
    }
  };

  const handleCloseLocationInfo = () => {
    dispatch(setLocationInfo(null));
    if (mapRef.current) {
      mapRef.current.removeMarkers();
    }
  };

  const handleShowDirections = () => {
    dispatch(setStartingPlace(selectedPlace || locationInfo));
    dispatch(setShowDirections(true));
    dispatch(setSelectedPlace(null));
    dispatch(setLocationInfo(null));
    
    if (mapRef.current) {
      mapRef.current.removeMarkers();
      mapRef.current.removeRoutes();
    }
  };

  const handleCloseDirections = () => {
    dispatch(setShowDirections(false));
    dispatch(setStartingPlace(null));
    directionActiveInputRef.current = null;
    
    if (mapRef.current) {
      mapRef.current.setMarkerDragCallback(null);
      mapRef.current.removeMarkers();
      mapRef.current.removeRoutes();
    }
  };

  const handleDirectionMapClick = (activeInputIndex: number | null) => {
    directionActiveInputRef.current = activeInputIndex;
    return true;
  };

  const handleMapLayerChange = (layerType: MapLayerType) => {
    if (mapRef.current) {
      mapRef.current.setMapStyle(layerType);
      dispatch(setCurrentLayer(layerType));
    }
  };

  const handleMapStyleChange = (styleType: string) => {
    dispatch(setCurrentLayer(styleType as MapLayerType));
  };

  const canAddWaypoint = showDirections && directionRef.current?.hasValidInputs?.();

  // Map click handler with proper dependencies
  const onMapClick = useCallback(
    (e: { lngLat: [number, number] }) => handleMapClick(e, mapRef),
    [handleMapClick]
  );

  // Setup marker drag callback
  useEffect(() => {
    if (showDirections && directionRef.current && mapRef.current) {
      mapRef.current.setMarkerDragCallback((index: number, lng: number, lat: number) => {
        if (directionRef.current && directionRef.current.updateWaypointCoordinates) {
          directionRef.current.updateWaypointCoordinates(index, lng, lat);
        }
      });
    } else if (mapRef.current) {
      mapRef.current.setMarkerDragCallback(null);
    }
  }, [showDirections]);

  // Set map ref in Redux store
  useEffect(() => {
    if (mapRef.current) {
      dispatch(setMapRef(mapRef.current));
    }
  }, [dispatch]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-50">
      <MapView 
        ref={mapRef} 
        className="absolute inset-0 mapContainer" 
        onContextMenu={handleMapContextMenu}
        onClick={onMapClick}
        initialMapStyle={currentLayer}
        onMapStyleChange={handleMapStyleChange}
      />
      
      <SearchBar 
        onMenuToggle={handleMenuToggle} 
        isMenuOpen={isSidebarOpen}
        onPlaceSelect={handlePlaceSelect}
      />
      
      {selectedPlace && !locationInfo && (
        <PlaceDetails 
          place={selectedPlace} 
          onClose={handleClosePlaceDetails}
          onDirectionClick={handleShowDirections}
        />
      )}

      {locationInfo && !selectedPlace && (
        <LocationInfoCard 
          place={locationInfo}
          onClose={handleCloseLocationInfo}
          onDirectionClick={handleShowDirections}
        />
      )}

      {showDirections && (
        <Direction 
          ref={directionRef}
          onClose={handleCloseDirections} 
          mapRef={mapRef}
          startingPlace={startingPlace}
          onMapClick={handleDirectionMapClick}
        />
      )}
      
      <Sidebar isOpen={isSidebarOpen} onClose={handleSidebarClose} />
      
      <MapControls 
        mapRef={mapRef} 
        onLayerChange={handleMapLayerChange}
        currentLayer={currentLayer}
      />
      
      {contextMenu && contextMenu.isOpen && (
        <MapContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          lng={contextMenu.lng}
          lat={contextMenu.lat}
          isOpen={contextMenu.isOpen}
          onClose={handleCloseContextMenu}
          onGetLocation={(lng, lat) => handleGetLocation(lng, lat, mapRef)}
          onSetAsStart={(lng, lat) => handleSetAsStart(lng, lat, mapRef)}
          onSetAsEnd={(lng, lat) => handleSetAsEnd(lng, lat, mapRef, directionRef)}
          onAddWaypoint={(lng, lat) => handleAddWaypoint(lng, lat, directionRef)}
          showDirectionOptions={true}
          canAddWaypoint={canAddWaypoint}
        />
      )}
      
      {isSidebarOpen && (
        <div 
          className="absolute inset-0 z-20 bg-black bg-opacity-10"
          onClick={() => dispatch(setSidebarOpen(false))}
        />
      )}
    </div>
  );
};

export default Index;
