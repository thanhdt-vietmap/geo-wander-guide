import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import vietmapgl from '@vietmap/vietmap-gl-js/dist/vietmap-gl';
import '@vietmap/vietmap-gl-js/dist/vietmap-gl.css';
import { mapUtils } from '@/utils/utils';
import { MapLayerType } from './MapLayerSelector';

export interface MapViewRef {
  map: vietmapgl.Map | null;
  flyTo: (lng: number, lat: number) => void;
  addMarker: (lng: number, lat: number, type?: 'default' | 'start' | 'end' | 'waypoint') => void;
  removeMarkers: () => void;
  addRoute: (coordinates: [number, number][], routeId?: string, color?: string) => void;
  removeRoutes: () => void;
  fitBounds: (bounds: [[number, number], [number, number]]) => void;
  highlightRoute: (routeId: string) => void;
  setMapStyle: (styleType: MapLayerType) => void;
}

interface MapViewProps {
  className?: string;
  onContextMenu?: (e: { lngLat: [number, number] }) => void;
  onClick?: (e: { lngLat: [number, number] }) => void;
  initialMapStyle?: MapLayerType;
  onMapStyleChange?: (styleType: MapLayerType) => void;
}

const MapView = forwardRef<MapViewRef, MapViewProps>(({ 
  className = '', 
  onContextMenu, 
  onClick,
  initialMapStyle = 'vector',
  onMapStyleChange
}, ref) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<vietmapgl.Map | null>(null);
  const markers = useRef<vietmapgl.Marker[]>([]);
  const routes = useRef<string[]>([]);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [currentMapStyle, setCurrentMapStyle] = useState<MapLayerType>(initialMapStyle);

  // Pre-defined colors for multiple routes
  const routeColors = ['#0071bc', '#d92f88', '#f7941d', '#39b54a', '#662d91', '#ed1c24'];

  // Track if the user is dragging to prevent context menu on drag end
  const isDragging = useRef(false);
  const clickStartPos = useRef<[number, number] | null>(null);

  // Use useCallback to memoize event handlers and prevent unnecessary re-renders
  const handleMouseDown = useCallback((e: any) => {
    if (e.originalEvent.button === 2) { // Right mouse button
      isDragging.current = false;
    } else if (e.originalEvent.button === 0 && onClick) { // Left mouse button
      clickStartPos.current = [e.point.x, e.point.y];
      isDragging.current = false;
    }
  }, [onClick]);

  const handleMouseMove = useCallback(() => {
    isDragging.current = true;
  }, []);

  const handleContextMenu = useCallback((e: any) => {
    // Prevent default browser context menu
    e.preventDefault();
    
    // Only trigger if not dragging
    if (!isDragging.current && onContextMenu) {
      onContextMenu({
        lngLat: [e.lngLat.lng, e.lngLat.lat]
      });
    }
    isDragging.current = false;
  }, [onContextMenu]);

  const handleMouseUp = useCallback((e: any) => {
    if (e.originalEvent.button === 0 && !isDragging.current && clickStartPos.current && onClick) {
      // Check if it's a click without drag
      const currentPos = [e.point.x, e.point.y];
      const startPos = clickStartPos.current;
      
      // Calculate the distance moved during the click
      const dx = currentPos[0] - startPos[0];
      const dy = currentPos[1] - startPos[1];
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // If the distance is small, consider it a click without drag
      if (distance < 5) {  // 5 pixels threshold
        onClick({
          lngLat: [e.lngLat.lng, e.lngLat.lat]
        });
      }
    }
    
    clickStartPos.current = null;
    isDragging.current = false;
  }, [onClick]);

  // Get the appropriate map style based on the layer type
  const getMapStyle = (layerType: MapLayerType) => {
    switch (layerType) {
      case 'light':
        return mapUtils.getVietMapLightRasterTileLayer();
      case 'dark':
        return mapUtils.getVietMapDarkRasterTileLayer();
      case 'hybrid':
        return mapUtils.getVietMapHybridRasterTileLayer();
      case 'satellite':
        return mapUtils.getVietMapSatelliteTileLayer();
      case 'vector':
      default:
        return mapUtils.getVietMapVectorTile();
    }
  };

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
          },"boundary_province");

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
    },
    setMapStyle: (styleType: MapLayerType) => {
      if (map.current) {
        const newStyle = getMapStyle(styleType);
        
        if (typeof newStyle === 'string') {
          map.current.setStyle(newStyle);
        } else {
          map.current.setStyle(newStyle);
        }
        
        setCurrentMapStyle(styleType);
        if (onMapStyleChange) {
          onMapStyleChange(styleType);
        }
      }
    }
  }), [currentMapStyle, onMapStyleChange]);

  // Initialize map once
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    
    // Initialize map with selected style
    const initialStyle = getMapStyle(initialMapStyle);
    
    map.current = new vietmapgl.Map({
      container: mapContainer.current,
      style: typeof initialStyle === 'string' ? initialStyle : initialStyle,
      center: [105.8342, 21.0285], // Hanoi, Vietnam
      zoom: 10
    });

    // Set map loaded state when style is loaded
    map.current.on('load', () => {
      setIsMapLoaded(true);
    });

    // Cleanup function
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []); // Empty dependency array - only run once

  // Add event listeners after map is loaded
  useEffect(() => {
    if (!isMapLoaded || !map.current) return;

    // Register the event listeners
    map.current.on('mousedown', handleMouseDown);
    map.current.on('mousemove', handleMouseMove);
    map.current.on('contextmenu', handleContextMenu);
    map.current.on('mouseup', handleMouseUp);

    // Cleanup function to remove event listeners
    return () => {
      if (map.current) {
        map.current.off('mousedown', handleMouseDown);
        map.current.off('mousemove', handleMouseMove);
        map.current.off('contextmenu', handleContextMenu);
        map.current.off('mouseup', handleMouseUp);
      }
    };
  }, [isMapLoaded, handleMouseDown, handleMouseMove, handleContextMenu, handleMouseUp]);

  return (
    <div ref={mapContainer} className={`w-full h-full ${className}`} />
  );
});

MapView.displayName = 'MapView';

export default MapView;
