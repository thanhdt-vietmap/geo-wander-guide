import React, { useRef, useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSidebarOpen, setPlaceDetailCollapsed } from '@/store/slices/uiSlice';
import { setLocationInfo } from '@/store/slices/locationSlice';
import { setCurrentLayer, setMapRef } from '@/store/slices/mapSlice';
import { useMapHandlers } from '@/hooks/useMapHandlers';
import { useLocationOperations } from '@/hooks/useLocationOperations';
import { useDirectionOperations } from '@/hooks/useDirectionOperations';
import { usePlaceOperations } from '@/hooks/usePlaceOperations';
import { useUrlPlaceLoader } from '@/hooks/useUrlPlaceLoader';
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
  const { handleShowDirections, handleCloseDirections, handleDirectionMapClick } = useDirectionOperations();
  const { handlePlaceSelect, handleClosePlaceDetails, handleCloseLocationInfo, handleSharePlace } = usePlaceOperations();

  // URL place loader
  useUrlPlaceLoader(mapRef);

  // Event handlers
  const handleMenuToggle = () => {
    dispatch(setSidebarOpen(!isSidebarOpen));
  };

  const handleSidebarClose = () => {
    dispatch(setSidebarOpen(false));
  };

  const handlePlaceSelectWrapper = (place: PlaceDetailsType) => {
    handlePlaceSelect(place, mapRef);
  };

  const handleClosePlaceDetailsWrapper = () => {
    handleClosePlaceDetails(mapRef);
  };

  const handleCloseLocationInfoWrapper = () => {
    handleCloseLocationInfo(mapRef);
  };

  const handleShowDirectionsWrapper = () => {
    handleShowDirections();
  };

  const handleCloseDirectionsWrapper = () => {
    handleCloseDirections(mapRef);
  };

  const handleDirectionMapClickWrapper = (activeInputIndex: number | null) => {
    directionActiveInputRef.current = activeInputIndex;
    return handleDirectionMapClick(activeInputIndex);
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

  return (<div className="relative w-full h-screen overflow-hidden bg-gray-50">
  <MapView 
    ref={mapRef} 
    className="absolute inset-0 mapContainer" 
    onContextMenu={handleMapContextMenu}
    onClick={onMapClick}
    initialMapStyle={currentLayer}
    onMapStyleChange={handleMapStyleChange}
  />
  
  {/* SearchBar với z-index cao nhất để nằm trên tất cả */}
  <div className="absolute top-0 left-0 right-0 z-50">
   {!showDirections&&( <SearchBar 
      mapRef={mapRef}
      onMenuToggle={handleMenuToggle} 
      isMenuOpen={isSidebarOpen}
      onPlaceSelect={handlePlaceSelectWrapper}
      onClose={handleClosePlaceDetailsWrapper}
    />)}
  </div>
  
  {/* PlaceDetails với z-index thấp hơn SearchBar */}
  {selectedPlace && !locationInfo && (
    <div className="absolute top-0 left-0 bottom-0 z-40">
      <PlaceDetails 
        place={selectedPlace} 
        onClose={handleClosePlaceDetailsWrapper}
        onDirectionClick={handleShowDirectionsWrapper}
      />
    </div>
  )}

  {/* LocationInfoCard với z-index thấp hơn SearchBar */}
  {locationInfo && !selectedPlace && (
    <div className="absolute  left-0 right-0 bottom-0 z-40">
      <LocationInfoCard 
        place={locationInfo}
        onClose={handleCloseLocationInfoWrapper}
        onDirectionClick={handleShowDirectionsWrapper}
      />
    </div>
  )}

  {/* Direction component */}
  {showDirections && (
    <Direction 
      ref={directionRef}
      onClose={handleCloseDirectionsWrapper} 
      mapRef={mapRef}
      startingPlace={startingPlace}
      onMapClick={handleDirectionMapClickWrapper}
    />
  )}
  
  {/* Sidebar */}
  <Sidebar isOpen={isSidebarOpen} onClose={handleSidebarClose} />
  
  {/* MapControls */}
  <MapControls 
    mapRef={mapRef} 
    onLayerChange={handleMapLayerChange}
    currentLayer={currentLayer}
  />
  
  {/* Context Menu */}
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
      onAddWaypoint={(lng, lat) => handleAddWaypoint(lng, lat, directionRef, mapRef)}
      showDirectionOptions={true}
      canAddWaypoint={canAddWaypoint}
    />
  )}
  
  {/* Sidebar overlay */}
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
