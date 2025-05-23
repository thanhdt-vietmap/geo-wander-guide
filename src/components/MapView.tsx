
import React, { useEffect, useRef } from 'react';
import vietmapgl from '@vietmap/vietmap-gl-js/dist/vietmap-gl';
import '@vietmap/vietmap-gl-js/dist/vietmap-gl.css';

interface MapViewProps {
  className?: string;
}

const MapView: React.FC<MapViewProps> = ({ className = '' }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<vietmapgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map
    map.current = new vietmapgl.Map({
      container: mapContainer.current,
      style: "https://maps.vietmap.vn/mt/tm/style.json?apikey=95f852d9f8c38e08ceacfd456b59059d0618254a50d3854c",
      center: [105.8342, 21.0285], // Hanoi, Vietnam
      zoom: 10
    });

    // Add navigation controls
    // map.current.addControl(new vietmapgl.NavigationControl(), 'top-right');

    // Add geolocate control
    // map.current.addControl(
    //   new vietmapgl.GeolocateControl({
    //     positionOptions: {
    //       enableHighAccuracy: true
    //     },
    //     trackUserLocation: true
    //   }),
    //   'top-right'
    // );

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, []);

  return (
    <div ref={mapContainer} className={`w-full h-full ${className}`} />
  );
};

export default MapView;
