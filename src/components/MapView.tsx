
import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import vietmapgl from '@vietmap/vietmap-gl-js/dist/vietmap-gl';
import '@vietmap/vietmap-gl-js/dist/vietmap-gl.css';

export interface MapViewRef {
  map: vietmapgl.Map | null;
  flyTo: (lng: number, lat: number) => void;
  addMarker: (lng: number, lat: number, type?: 'default' | 'start' | 'end' | 'waypoint') => void;
  removeMarkers: () => void;
  addRoute: (coordinates: [number, number][], routeId?: string, color?: string) => void;
  removeRoutes: () => void;
  fitBounds: (bounds: [[number, number], [number, number]]) => void;
  highlightRoute: (routeId: string) => void;
}

interface MapViewProps {
  className?: string;
  onContextMenu?: (e: { lngLat: [number, number] }) => void;
}

const MapView = forwardRef<MapViewRef, MapViewProps>(({ className = '', onContextMenu }, ref) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<vietmapgl.Map | null>(null);
  const markers = useRef<vietmapgl.Marker[]>([]);
  const routes = useRef<string[]>([]);

  // Pre-defined colors for multiple routes
  const routeColors = ['#0071bc', '#d92f88', '#f7941d', '#39b54a', '#662d91', '#ed1c24'];

  // Track if the user is dragging to prevent context menu on drag end
  const isDragging = useRef(false);

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
    addRoute: (coordinates: [number, number][], routeId = 'route', color) => {
      if (map.current) {
        // Use provided color or get one from the predefined colors
        const routeColor = color || routeColors[routes.current.length % routeColors.length];
        
        // Check if the source already exists
        if (!map.current.getSource(routeId)) {
          map.current.addSource(routeId, {
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
            id: routeId,
            type: 'line',
            source: routeId,
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': routeColor,
              'line-width': 4
            }
          });

          routes.current.push(routeId);
        } else {
          // Update existing source
          const source = map.current.getSource(routeId) as vietmapgl.GeoJSONSource;
          if (source && typeof source.setData === 'function') {
            source.setData({
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: coordinates
              }
            });
            
            // Update the color if the layer exists
            if (map.current.getLayer(routeId)) {
              map.current.setPaintProperty(routeId, 'line-color', routeColor);
            }
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
    },
    highlightRoute: (routeId: string) => {
      if (map.current) {
        // First set all routes to less opacity
        routes.current.forEach(id => {
          if (map.current!.getLayer(id)) {
            map.current!.setPaintProperty(id, 'line-opacity', 0.5);
            map.current!.setPaintProperty(id, 'line-width', 3);
          }
        });
        
        // Then highlight the selected route
        if (map.current.getLayer(routeId)) {
          map.current.setPaintProperty(routeId, 'line-opacity', 1);
          map.current.setPaintProperty(routeId, 'line-width', 5);
        }
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

    // Add event listeners for right-click
    if (onContextMenu) {
      map.current.on('mousedown', (e) => {
        if (e.originalEvent.button === 2) { // Right mouse button
          isDragging.current = false;
        }
      });

      map.current.on('mousemove', () => {
        isDragging.current = true;
      });

      map.current.on('contextmenu', (e) => {
        // Only trigger if not dragging
        if (!isDragging.current) {
          e.preventDefault();
          onContextMenu({
            lngLat: [e.lngLat.lng, e.lngLat.lat]
          });
        }
        isDragging.current = false;
      });
    }

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, [onContextMenu]);

  return (
    <div ref={mapContainer} className={`w-full h-full ${className}`} />
  );
});

MapView.displayName = 'MapView';

export default MapView;
