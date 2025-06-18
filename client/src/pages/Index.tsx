import React, { useRef, useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setSidebarOpen, setPlaceDetailCollapsed } from '../store/slices/uiSlice';
import { setLocationInfo } from '../store/slices/locationSlice';
import { setCurrentLayer, setMapRef } from '../store/slices/mapSlice';
import { useMapHandlers } from '../hooks/useMapHandlers';
import { useLocationOperations } from '../hooks/useLocationOperations';
import { useDirectionOperations } from '../hooks/useDirectionOperations';
import { usePlaceOperations } from '../hooks/usePlaceOperations';
import { useUrlPlaceLoader } from '../hooks/useUrlPlaceLoader';
import { useUrlDirectionLoader } from '../hooks/useUrlDirectionLoader';
import { useBotDetection } from '../hooks/useBotDetection';
import { PlaceDetails } from '../types';
import MapView, { MapViewRef } from '../components/MapView';
import SearchBar, { SearchBarRef } from '../components/SearchBar';
import Sidebar from '../components/Sidebar';
import MapControls from '../components/MapControls';
import PlaceDetailsComponent from '../components/PlaceDetails';
import Direction, { DirectionRef } from '../components/Direction';
import MapContextMenu from '../components/MapContextMenu';
import LocationInfoCard from '../components/LocationInfoCard';
import MapLayerSelector from '../components/MapLayerSelector';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { PlaceDetails as PlaceDetailsType } from '../types';
import { MapLayerType } from '../components/MapLayerSelector';
const Index = () => {
  const dispatch = useAppDispatch();
  
  // Bot detection integration
  const { isBot, suspicionScore, flags } = useBotDetection(true);
  
  // Redux state
  const { isSidebarOpen, showDirections, isPlaceDetailCollapsed, isDirectionCollapsed } = useAppSelector((state) => state.ui);
  const { selectedPlace, locationInfo, startingPlace } = useAppSelector((state) => state.location);
  const { currentLayer, contextMenu } = useAppSelector((state) => state.map);
  
  // Calculate margin left for MapLayerSelector
  const calculateMapLayerMarginLeft = () => {
    let marginLeft = 0;
    
    // PlaceDetails is visible and not collapsed
    if (selectedPlace && !isPlaceDetailCollapsed) {
      marginLeft = 500; // PlaceDetails width
    }
    // Direction is visible and not collapsed
    else if (showDirections && !isDirectionCollapsed) {
      marginLeft = 500; // Direction width
    }
    
    return marginLeft;
  };
  
  // Refs
  const mapRef = useRef<MapViewRef>(null);
  const searchBarRef = useRef<SearchBarRef>(null);
  const directionRef = useRef<DirectionRef>(null);
  const directionActiveInputRef = useRef<number | null>(null);
  
  // Custom hooks
  const { handleMapContextMenu, handleMapClick, handleCloseContextMenu } = useMapHandlers();
  const { handleGetLocation, handleSetAsStart, handleSetAsEnd, handleAddWaypoint } = useLocationOperations();
  const { handleShowDirections, handleCloseDirections, handleDirectionMapClick } = useDirectionOperations();
  const { handlePlaceSelect, handleClosePlaceDetails, handleCloseLocationInfo, handleSharePlace } = usePlaceOperations();

  // URL loaders
  useUrlPlaceLoader(mapRef);
  useUrlDirectionLoader(mapRef, directionRef);

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

  const handlePlaceDetailsFromLocationInfo = (place: PlaceDetails) => {
    handlePlaceSelect(place, mapRef);
    
    // Fill search bar with place name or address (without triggering search)
    if (searchBarRef.current) {
      const displayText = place.name && place.name.trim() ? place.name : place.address;
      searchBarRef.current.setSearchQuery(displayText);
    }
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
      ref={searchBarRef}
      mapRef={mapRef}
      onMenuToggle={handleMenuToggle} 
      isMenuOpen={isSidebarOpen}
      onPlaceSelect={handlePlaceSelectWrapper}
      onClose={handleClosePlaceDetailsWrapper}
    />)}
  </div>

  {/* Language switcher in top-right corner */}
  <div className="absolute top-6 right-6 z-50">
    <LanguageSwitcher />
  </div>
  
  {/* PlaceDetails với z-index thấp hơn SearchBar */}
  {selectedPlace && !locationInfo && (
    <div className="absolute top-0 left-0 bottom-0 z-40">
      <PlaceDetailsComponent 
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
        onPlaceDetailsShow={handlePlaceDetailsFromLocationInfo}
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
  
  {/* Sidebar overlay */}
  {isSidebarOpen && (
    <div 
      className="absolute inset-0 z-20 bg-black bg-opacity-10"
      onClick={() => dispatch(setSidebarOpen(false))}
    />
  )}
  {/* MapControls */}
  <MapControls 
    mapRef={mapRef} 
    onLayerChange={handleMapLayerChange}
    currentLayer={currentLayer}
  />

  {/* Map Layer Selector - Bottom Left */}
  <MapLayerSelector
    isOpen={true}
    onClose={() => {}}
    onLayerSelect={handleMapLayerChange}
    currentLayer={currentLayer}
    marginLeft={calculateMapLayerMarginLeft()}
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
  

  {/* Bot Detection Status */}
  {/* <BotDetectionStatus 
    isBot={isBot}
    suspicionScore={suspicionScore}
    flags={flags}
    showDetails={false}
  /> */}
</div>
  );
};

export default Index;
