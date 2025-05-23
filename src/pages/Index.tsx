
import React, { useState, useRef } from 'react';
import MapView, { MapViewRef } from '@/components/MapView';
import SearchBar from '@/components/SearchBar';
import Sidebar from '@/components/Sidebar';
import MapControls from '@/components/MapControls';
import PlaceDetails from '@/components/PlaceDetails';
import Direction from '@/components/Direction';

interface PlaceDetails {
  display: string;
  name: string;
  hs_num: string;
  street: string;
  address: string;
  city_id: number;
  city: string;
  district_id: number;
  district: string;
  ward_id: number;
  ward: string;
  lat: number;
  lng: number;
}

const Index = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(null);
  const [isPlaceDetailCollapsed, setIsPlaceDetailCollapsed] = useState(false);
  const [showDirections, setShowDirections] = useState(false);
  const [startingPlace, setStartingPlace] = useState<PlaceDetails | null>(null);
  const mapRef = useRef<MapViewRef>(null);

  const handleMenuToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handlePlaceSelect = (place: PlaceDetails) => {
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

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-50">
      {/* Map Container */}
      <MapView ref={mapRef} className="absolute inset-0" />
      
      
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
