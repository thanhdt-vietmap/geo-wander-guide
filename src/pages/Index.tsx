
import React, { useState, useRef } from 'react';
import MapView, { MapViewRef } from '@/components/MapView';
import SearchBar from '@/components/SearchBar';
import Sidebar from '@/components/Sidebar';
import MapControls from '@/components/MapControls';
import PlaceDetails from '@/components/PlaceDetails';
import Direction from '@/components/Direction';
import MapContextMenu from '@/components/MapContextMenu';
import { PlaceDetails as PlaceDetailsType } from '@/types';
import { getReverseGeocoding } from '@/services/mapService';
import { toast } from 'sonner';

const Index = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetailsType | null>(null);
  const [isPlaceDetailCollapsed, setIsPlaceDetailCollapsed] = useState(false);
  const [showDirections, setShowDirections] = useState(false);
  const [startingPlace, setStartingPlace] = useState<PlaceDetailsType | null>(null);
  const mapRef = useRef<MapViewRef>(null);
  
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

  const handlePlaceSelect = (place: PlaceDetailsType) => {
    setSelectedPlace(place);
    // Ensure the place detail is expanded when a place is selected
    setIsPlaceDetailCollapsed(false);
    // Hide directions if they were showing
    setShowDirections(false);
    
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

  const handleShowDirections = () => {
    // Set the starting place to the currently selected place
    setStartingPlace(selectedPlace);
    setShowDirections(true);
    // When showing directions, hide place details
    setSelectedPlace(null);
    // Clear any existing markers
    if (mapRef.current) {
      mapRef.current.removeMarkers();
      mapRef.current.removeRoutes();
    }
  };

  const handleCloseDirections = () => {
    setShowDirections(false);
    setStartingPlace(null);
    // Clear any direction-related data
    if (mapRef.current) {
      mapRef.current.removeMarkers();
      mapRef.current.removeRoutes();
    }
  };

  // Handle right-click on map
  const handleMapContextMenu = (e: { lngLat: [number, number] }) => {
    setContextMenu({
      isOpen: true,
      x: 0,
      y: 0,
      lng: e.lngLat[0],
      lat: e.lngLat[1],
    });
  };

  // Close context menu
  const handleCloseContextMenu = () => {
    if (contextMenu) {
      setContextMenu({ ...contextMenu, isOpen: false });
    }
  };

  // Get location details from coordinates
  const handleGetLocation = async (lng: number, lat: number) => {
    try {
      const placeDetails = await getReverseGeocoding(lng, lat);
      handlePlaceSelect(placeDetails);
    } catch (error) {
      toast.error('Failed to get location details');
      console.error(error);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-50">
      {/* Map Container */}
      <MapView 
        ref={mapRef} 
        className="absolute inset-0" 
        onContextMenu={handleMapContextMenu}
      />
      
      {/* Search Bar */}
      <SearchBar 
        onMenuToggle={handleMenuToggle} 
        isMenuOpen={isSidebarOpen}
        onPlaceSelect={handlePlaceSelect}
      />
      
      {/* Place Details */}
      {selectedPlace && (
        <PlaceDetails 
          place={selectedPlace} 
          onClose={handleClosePlaceDetails}
          onDirectionClick={handleShowDirections}
        />
      )}

      {/* Direction Panel */}
      {showDirections && (
        <Direction 
          onClose={handleCloseDirections} 
          mapRef={mapRef}
          startingPlace={startingPlace}
        />
      )}
      
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} />
      
      {/* Map Controls */}
      <MapControls mapRef={mapRef} />
      
      {/* Context Menu */}
      {contextMenu && (
        <MapContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          lng={contextMenu.lng}
          lat={contextMenu.lat}
          isOpen={contextMenu.isOpen}
          onClose={handleCloseContextMenu}
          onGetLocation={handleGetLocation}
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
