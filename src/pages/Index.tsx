
import React, { useState } from 'react';
import MapView from '@/components/MapView';
import SearchBar from '@/components/SearchBar';
import Sidebar from '@/components/Sidebar';
import MapControls from '@/components/MapControls';

const Index = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleMenuToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-50">
      {/* Map Container */}
      <MapView className="absolute inset-0" />
      
      {/* Search Bar */}
      <SearchBar 
        onMenuToggle={handleMenuToggle} 
        isMenuOpen={isSidebarOpen}
      />
      
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} />
      
      {/* Map Controls */}
      <MapControls />
      
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
