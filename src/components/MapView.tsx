
import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import vietmapgl from '@vietmap/vietmap-gl-js/dist/vietmap-gl';
import '@vietmap/vietmap-gl-js/dist/vietmap-gl.css';

export interface MapViewRef {
  map: vietmapgl.Map | null;
  flyTo: (lng: number, lat: number) => void;
  addMarker: (lng: number, lat: number) => void;
  removeMarkers: () => void;
}

interface MapViewProps {
  className?: string;
}

const MapView = forwardRef<MapViewRef, MapViewProps>(({ className = '' }, ref) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<vietmapgl.Map | null>(null);
  const markers = useRef<vietmapgl.Marker[]>([]);

  // Expose map methods to parent components
  useImperativeHandle(ref, () => ({
    map: map.current,
    flyTo: (lng: number, lat: number) => {
      if (map.current) {
        map.current.flyTo({
          center: [lng, lat],
          zoom: 16,
          essential: true
        });
      }
    },
    addMarker: (lng: number, lat: number) => {
      if (map.current) {
        // Remove existing markers first
        markers.current.forEach(marker => marker.remove());
        markers.current = [];
        
        // Create new marker
        const marker = new vietmapgl.Marker({ color: '#FF0000' })
          .setLngLat([lng, lat])
          .addTo(map.current);
        
        markers.current.push(marker);
      }
    },
    removeMarkers: () => {
      markers.current.forEach(marker => marker.remove());
      markers.current = [];
    }
  }));

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map
    map.current = new vietmapgl.Map({
      container: mapContainer.current,
      style: "https://maps.vietmap.vn/mt/tm/style.json?apikey=95f852d9f8c38e08ceacfd456b59059d0618254a50d3854c",
      center: [105.8342, 21.0285], // Hanoi, Vietnam
      zoom: 10
    });

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, []);

  return (
    <div ref={mapContainer} className={`w-full h-full ${className}`} />
  );
});

MapView.displayName = 'MapView';

export default MapView;
