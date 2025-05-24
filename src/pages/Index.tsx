import React, { useState, useRef, useCallback, useEffect } from 'react';
import MapView, { MapViewRef } from '@/components/MapView';
import SearchBar from '@/components/SearchBar';
import Sidebar from '@/components/Sidebar';
import MapControls from '@/components/MapControls';
import PlaceDetails from '@/components/PlaceDetails';
import Direction, { DirectionRef } from '@/components/Direction';
import MapContextMenu from '@/components/MapContextMenu';
import LocationInfoCard from '@/components/LocationInfoCard';
import { PlaceDetails as PlaceDetailsType } from '@/types';
import { getReverseGeocoding } from '@/services/mapService';
import { toast } from 'sonner';
import { MapLayerType } from '@/components/MapLayerSelector';

const Index = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetailsType | null>(null);
  const [isPlaceDetailCollapsed, setIsPlaceDetailCollapsed] = useState(false);
  const [showDirections, setShowDirections] = useState(false);
  const [startingPlace, setStartingPlace] = useState<PlaceDetailsType | null>(null);
  const [locationInfo, setLocationInfo] = useState<PlaceDetailsType | null>(null);
  const mapRef = useRef<MapViewRef>(null);
  const directionActiveInputRef = useRef<number | null>(null);
  const [currentMapLayer, setCurrentMapLayer] = useState<MapLayerType>('vector');
  const directionRef = useRef<DirectionRef>(null);
  
  // State for context menu
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    lng: number;
    lat: number;
  } | null>(null);

  const handleMenuToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
  };

  const handlePlaceSelect = (place: PlaceDetailsType) => {
    setSelectedPlace(place);
    // Ensure the place detail is expanded when a place is selected
    setIsPlaceDetailCollapsed(false);
    // Hide directions if they were showing
    setShowDirections(false);
    // Close location info card if it's open
    setLocationInfo(null);
    
    // Update map view with the selected place
    if (mapRef.current) {
      mapRef.current.flyTo(place.lng, place.lat);
      mapRef.current.addMarker(place.lng, place.lat);
    }
  };

  const handleClosePlaceDetails = () => {
    setSelectedPlace(null);
    if (mapRef.current) {
      mapRef.current.removeMarkers();
    }
  };

  const handleCloseLocationInfo = () => {
    setLocationInfo(null);
    if (mapRef.current) {
      mapRef.current.removeMarkers();
    }
  };

  const handleShowDirections = () => {
    // Set the starting place to the currently selected place
    setStartingPlace(selectedPlace || locationInfo);
    setShowDirections(true);
    // When showing directions, hide place details and location info
    setSelectedPlace(null);
    setLocationInfo(null);
    // Clear any existing markers
    if (mapRef.current) {
      mapRef.current.removeMarkers();
      mapRef.current.removeRoutes();
    }
  };

  const handleCloseDirections = () => {
    setShowDirections(false);
    setStartingPlace(null);
    directionActiveInputRef.current = null;
    // Clear marker drag callback when closing directions
    if (mapRef.current) {
      mapRef.current.setMarkerDragCallback(null);
      mapRef.current.removeMarkers();
      mapRef.current.removeRoutes();
    }
  };

  // Track the active input in Direction component
  const handleDirectionMapClick = (activeInputIndex: number | null) => {
    directionActiveInputRef.current = activeInputIndex;
    return true; // Continue handling map clicks
  };

  // Handle right-click on map - use useCallback to prevent re-renders
  const handleMapContextMenu = useCallback((e: { lngLat: [number, number] }) => {
    console.log('Context menu triggered at:', e.lngLat); // Debug log
    
    // Use a more reliable way to get mouse position
    let x = 100;
    let y = 100;
    
    // Try to get mouse position from the last mouse event
    if (window.event) {
      const mouseEvent = window.event as MouseEvent;
      x = mouseEvent.clientX;
      y = mouseEvent.clientY;
    }
    
    console.log('Setting context menu at position:', { x, y }); // Debug positioning
    
    setContextMenu({
      isOpen: true,
      x: x,
      y: y,
      lng: e.lngLat[0],
      lat: e.lngLat[1],
    });
  }, []);

  // Handle click on map - use useCallback to prevent re-renders
  const handleMapClick = useCallback(async (e: { lngLat: [number, number] }) => {
    try {
      // Close any open context menu
      if (contextMenu?.isOpen) {
        setContextMenu(prev => prev ? { ...prev, isOpen: false } : null);
      }
      
      // Check if Direction component is open
      if (showDirections) {
        // Get location details
        const placeDetails = await getReverseGeocoding(e.lngLat[0], e.lngLat[1]);
        
        // Don't show the location info card, just add a temporary marker
        if (mapRef.current) {
          mapRef.current.addMarker(e.lngLat[0], e.lngLat[1], 'waypoint');
        }
        
        // Let the Direction component know about this click
        return;
      }
      
      // Regular click handling when Direction isn't open
      if (selectedPlace) setSelectedPlace(null);
      
      // Get location details
      const placeDetails = await getReverseGeocoding(e.lngLat[0], e.lngLat[1]);
      
      // Set location info card
      setLocationInfo(placeDetails);
      
      // Add a marker
      if (mapRef.current) {
        mapRef.current.removeMarkers();
        mapRef.current.addMarker(e.lngLat[0], e.lngLat[1]);
      }
    } catch (error) {
      toast.error('Failed to get location details');
      console.error(error);
    }
  }, [contextMenu?.isOpen, showDirections, selectedPlace]);

  // Close context menu
  const handleCloseContextMenu = () => {
    if (contextMenu) {
      setContextMenu({ ...contextMenu, isOpen: false });
    }
  };

  // Get location details from coordinates
  const handleGetLocation = async (lng: number, lat: number) => {
    try {
      // Close any open UI elements
      if (selectedPlace) setSelectedPlace(null);
      
      const placeDetails = await getReverseGeocoding(lng, lat);
      
      // Show location info card instead of place details
      setLocationInfo(placeDetails);
      
      // Add a marker
      if (mapRef.current) {
        mapRef.current.removeMarkers();
        mapRef.current.addMarker(lng, lat);
      }
    } catch (error) {
      toast.error('Failed to get location details');
      console.error(error);
    }
  };

  // Set location as starting point
  const handleSetAsStart = async (lng: number, lat: number) => {
    try {
      const placeDetails = await getReverseGeocoding(lng, lat);
      setStartingPlace(placeDetails);
      setShowDirections(true);
      setSelectedPlace(null);
      setLocationInfo(null);
      
      if (mapRef.current) {
        mapRef.current.removeMarkers();
        mapRef.current.removeRoutes();
      }
    } catch (error) {
      toast.error('Failed to set starting point');
      console.error(error);
    }
  };

  // Set location as end point
  const handleSetAsEnd = async (lng: number, lat: number) => {
    try {
      const placeDetails = await getReverseGeocoding(lng, lat);
      
      if (!showDirections) {
        // If directions are not open, open them with empty start and this as end
        setStartingPlace(null);
        setShowDirections(true);
        setSelectedPlace(null);
        setLocationInfo(null);
      }
      
      // Set as end point in Direction component
      if (directionRef.current && directionRef.current.setEndPoint) {
        directionRef.current.setEndPoint(placeDetails);
      }
      
      if (mapRef.current) {
        mapRef.current.removeMarkers();
        mapRef.current.removeRoutes();
      }
    } catch (error) {
      toast.error('Failed to set end point');
      console.error(error);
    }
  };

  // Add waypoint
  const handleAddWaypoint = async (lng: number, lat: number) => {
    try {
      const placeDetails = await getReverseGeocoding(lng, lat);
      
      // Add waypoint to Direction component
      if (directionRef.current && directionRef.current.addWaypoint) {
        directionRef.current.addWaypoint(placeDetails);
      }
    } catch (error) {
      toast.error('Failed to add waypoint');
      console.error(error);
    }
  };

  // Check if we can add waypoint (Direction is open and inputs have values)
  const canAddWaypoint = showDirections && directionRef.current?.hasValidInputs?.();

  // Handle map layer change
  const handleMapLayerChange = (layerType: MapLayerType) => {
    if (mapRef.current) {
      mapRef.current.setMapStyle(layerType);
      setCurrentMapLayer(layerType);
    }
  };

  // Handle map style change from MapView component
  const handleMapStyleChange = (styleType: string) => {
    setCurrentMapLayer(styleType as MapLayerType);
  };

  // Setup marker drag callback when Direction component is active
  useEffect(() => {
    if (showDirections && directionRef.current && mapRef.current) {
      // Set the callback to update waypoint coordinates in Direction component
      mapRef.current.setMarkerDragCallback((index: number, lng: number, lat: number) => {
        if (directionRef.current && directionRef.current.updateWaypointCoordinates) {
          directionRef.current.updateWaypointCoordinates(index, lng, lat);
        }
      });
    } else if (mapRef.current) {
      // Clear the callback when Direction is not active
      mapRef.current.setMarkerDragCallback(null);
    }
  }, [showDirections]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-50">
      {/* Map Container */}
      <MapView 
        ref={mapRef} 
        className="absolute inset-0 mapContainer" 
        onContextMenu={handleMapContextMenu}
        onClick={handleMapClick}
        initialMapStyle={currentMapLayer}
        onMapStyleChange={handleMapStyleChange}
      />
      
      {/* Search Bar */}
      <SearchBar 
        onMenuToggle={handleMenuToggle} 
        isMenuOpen={isSidebarOpen}
        onPlaceSelect={handlePlaceSelect}
      />
      
      {/* Place Details */}
      {selectedPlace && !locationInfo && (
        <PlaceDetails 
          place={selectedPlace} 
          onClose={handleClosePlaceDetails}
          onDirectionClick={handleShowDirections}
        />
      )}

      {/* Location Info Card */}
      {locationInfo && !selectedPlace && (
        <LocationInfoCard 
          place={locationInfo}
          onClose={handleCloseLocationInfo}
          onDirectionClick={handleShowDirections}
        />
      )}

      {/* Direction Panel */}
      {showDirections && (
        <Direction 
          ref={directionRef}
          onClose={handleCloseDirections} 
          mapRef={mapRef}
          startingPlace={startingPlace}
          onMapClick={handleDirectionMapClick}
        />
      )}
      
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={handleSidebarClose} />
      
      {/* Map Controls */}
      <MapControls 
        mapRef={mapRef} 
        onLayerChange={handleMapLayerChange}
        currentLayer={currentMapLayer}
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
          onGetLocation={handleGetLocation}
          onSetAsStart={handleSetAsStart}
          onSetAsEnd={handleSetAsEnd}
          onAddWaypoint={handleAddWaypoint}
          showDirectionOptions={true}
          canAddWaypoint={canAddWaypoint}
        />
      )}
      
      {/* Overlay to close sidebar when clicking outside */}
      {isSidebarOpen && (
        <div 
          className="absolute inset-0 z-20 bg-black bg-opacity-10"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Index;
