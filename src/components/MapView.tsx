
import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import vietmapgl from '@vietmap/vietmap-gl-js/dist/vietmap-gl';
import '@vietmap/vietmap-gl-js/dist/vietmap-gl.css';

export interface MapViewRef {
  map: vietmapgl.Map | null;
  flyTo: (lng: number, lat: number) => void;
  addMarker: (lng: number, lat: number, type?: 'default' | 'start' | 'end' | 'waypoint') => void;
  removeMarkers: () => void;
  addRoute: (coordinates: [number, number][]) => void;
  removeRoutes: () => void;
  fitBounds: (bounds: [[number, number], [number, number]]) => void;
}

interface MapViewProps {
  className?: string;
}

const MapView = forwardRef<MapViewRef, MapViewProps>(({ className = '' }, ref) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<vietmapgl.Map | null>(null);
  const markers = useRef<vietmapgl.Marker[]>([]);
  const routes = useRef<any[]>([]);

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
    addMarker: (lng: number, lat: number, type = 'default') => {
      if (map.current) {
        // Create marker with different colors based on type
        const colors = {
          default: '#FF0000',
          start: '#00FF00',
          end: '#0000FF',
          waypoint: '#FFA500'
        };

        // Create new marker
        const marker = new vietmapgl.Marker({ 
          color: colors[type]
        })
          .setLngLat([lng, lat])
          .addTo(map.current);
        
        markers.current.push(marker);
      }
    },
    removeMarkers: () => {
      markers.current.forEach(marker => marker.remove());
      markers.current = [];
    },
    addRoute: (coordinates: [number, number][]) => {
      if (map.current) {
        // Check if the source already exists
        if (!map.current.getSource('route')) {
          map.current.addSource('route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: coordinates
              }
            }
          });

          map.current.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#0071bc',
              'line-width': 4
            }
          });

          routes.current.push('route');
        } else {
          // Update existing source
          const source = map.current.getSource('route') as mapboxgl.GeoJSONSource;
          if (source && typeof source.setData === 'function') {
            source.setData({
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: coordinates
              }
            });
          }
        }
      }
    },
    removeRoutes: () => {
      if (map.current) {
        routes.current.forEach(routeId => {
          if (map.current!.getLayer(routeId)) {
            map.current!.removeLayer(routeId);
          }
          if (map.current!.getSource(routeId)) {
            map.current!.removeSource(routeId);
          }
        });
        routes.current = [];
      }
    },
    fitBounds: (bounds: [[number, number], [number, number]]) => {
      if (map.current) {
        map.current.fitBounds(bounds, {
          padding: 50
        });
      }
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
