import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import vietmapgl from '@vietmap/vietmap-gl-js/dist/vietmap-gl';
import '@vietmap/vietmap-gl-js/dist/vietmap-gl.css';
import { mapUtils } from '@/utils/utils';

export interface MapViewRef {
  map: any;
  flyTo: (lng: number, lat: number) => void;
  addMarker: (lng: number, lat: number, type?: 'default' | 'start' | 'end' | 'waypoint', draggable?: boolean, index?: number) => void;
  removeMarkers: () => void;
  addRoute: (coordinates: [number, number][], routeId?: string, color?: string) => void;
  removeRoutes: () => void;
  fitBounds: (bounds: [[number, number], [number, number]]) => void;
  highlightRoute: (routeId: string) => void;
  setMapStyle: (styleType: string) => void;
  rotateMap: (degrees: number) => void;
  resetNorth: () => void;
  toggle3D: () => void;
  getCurrentLocation: () => Promise<any>;
  getCenter: () => [number, number] | null;
  setMarkerDragCallback: (callback: ((index: number, lng: number, lat: number) => void) | null) => void;
}

interface MapViewProps {
  className?: string;
  onContextMenu?: (e: { lngLat: [number, number] }) => void;
  onClick?: (e: { lngLat: [number, number] }) => void;
  initialMapStyle?: string;
  onMapStyleChange?: (styleType: string) => void;
}

const MapView = forwardRef<MapViewRef, MapViewProps>(({ 
  className = '', 
  onContextMenu, 
  onClick, 
  initialMapStyle = 'vector', 
  onMapStyleChange 
}, ref) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<vietmapgl.Map>(null);
  const markers = useRef<{ marker: any; index?: number }[]>([]);
  const routes = useRef<string[]>([]);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [currentMapStyle, setCurrentMapStyle] = useState(initialMapStyle);
  const [is3DMode, setIs3DMode] = useState(false);
  const locationMarker = useRef<any>(null);
  const markerDragCallback = useRef<((index: number, lng: number, lat: number) => void) | null>(null);

  // Pre-defined colors for multiple routes
  const routeColors = [
    '#0071bc',
    '#d92f88', 
    '#f7941d',
    '#39b54a',
    '#662d91',
    '#ed1c24'
  ];

  // Track if the user is dragging to prevent context menu on drag end
  const isDragging = useRef(false);
  const clickStartPos = useRef<[number, number] | null>(null);

  // Use useCallback to memoize event handlers and prevent unnecessary re-renders
  const handleMouseDown = useCallback((e: any) => {
    if (e.originalEvent.button === 2) {
      isDragging.current = false;
    } else if (e.originalEvent.button === 0 && onClick) {
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
      if (distance < 5) {
        onClick({
          lngLat: [e.lngLat.lng, e.lngLat.lat]
        });
      }
    }
    clickStartPos.current = null;
    isDragging.current = false;
  }, [onClick]);

  // Get the appropriate map style based on the layer type
  const getMapStyle = (layerType: string) => {
    switch (layerType) {
      case 'light':
        return mapUtils.getVietMapLightRasterTileLayer();
      case 'dark':
        return mapUtils.getVietMapDarkRasterTileLayer();
      case 'raster':
        return mapUtils.getVietMapRasterTileLayer();
      case 'hybrid':
        return mapUtils.getVietMapHybridRasterTileLayer();
      case 'satellite':
        return mapUtils.getVietMapSatelliteTileLayer();
      case 'vector-light':
        return mapUtils.getVietMapLightVectorTile();
      case 'vector-dark':
        return mapUtils.getVietMapVectorDarkTile();
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
          zoom: 14,
          essential: true,
          duration:500
        });
      }
    },
    getCenter: () => {
      if (map.current) {
        const center = map.current.getCenter();
        return [center.lng, center.lat];
      }
      return null;
    },
    addMarker: (lng: number, lat: number, type: 'default' | 'start' | 'end' | 'waypoint' = 'default', draggable: boolean = false, index?: number) => {
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
          color: colors[type],
          draggable: draggable
        })
        .setLngLat([lng, lat])
        .addTo(map.current);

        // Add drag event listener if draggable
        if (draggable && typeof index === 'number') {
          marker.on('dragend', () => {
            const lngLat = marker.getLngLat();
            if (markerDragCallback.current) {
              markerDragCallback.current(index, lngLat.lng, lngLat.lat);
            }
          });
        }

        markers.current.push({ marker, index });
      }
    },
    removeMarkers: () => {
      markers.current.forEach(({ marker }) => marker.remove());
      markers.current = [];
    },
    addRoute: (coordinates: [number, number][], routeId: string = 'route', color?: string) => {
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
          }, "boundary_province");

          routes.current.push(routeId);
        } else {
          // Update existing source

          const source = map.current.getSource(routeId) 
          // check if source is  vietmapgl.GeoJSONSource;
          
          if (source && source instanceof vietmapgl.GeoJSONSource && typeof source.setData === 'function') {
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
        routes.current.forEach((routeId) => {
          if (map.current.getLayer(routeId)) {
            map.current.removeLayer(routeId);
          }
          if (map.current.getSource(routeId)) {
            map.current.removeSource(routeId);
          }
        });
        routes.current = [];
      }
    },
    fitBounds: (bounds: [[number, number], [number, number]]) => {
      if (map.current) {
        map.current.fitBounds(bounds, { padding: 50 });
      }
    },
    highlightRoute: (routeId: string) => {
      if (map.current) {
        // First set all routes to less opacity
        routes.current.forEach((id) => {
          if (map.current.getLayer(id)) {
            map.current.setPaintProperty(id, 'line-opacity', 0.5);
            map.current.setPaintProperty(id, 'line-width', 3);
          }
        });

        // Then highlight the selected route
        if (map.current.getLayer(routeId)) {
          map.current.setPaintProperty(routeId, 'line-opacity', 1);
          map.current.setPaintProperty(routeId, 'line-width', 5);
        }
      }
    },
    setMapStyle: (styleType: string) => {
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
    },
    rotateMap: (degrees: number) => {
      if (map.current) {
        map.current.rotateTo(degrees, { duration: 300 });
      }
    },
    resetNorth: () => {
      if (map.current) {
        map.current.resetNorth({ duration: 300 });
      }
    },
    toggle3D: () => {
      if (map.current) {
        const newPitch = is3DMode ? 0 : 60;
        map.current.easeTo({
          pitch: newPitch,
          duration: 300
        });
        setIs3DMode(!is3DMode);
      }
    },
    getCurrentLocation: async () => {
      return new Promise((resolve) => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { longitude, latitude } = position.coords;
              
              // Fly to user location
              if (map.current) {
                map.current.flyTo({
                  center: [longitude, latitude],
                  zoom: 16,
                  essential: true
                });

                // Remove previous location marker if exists
                if (locationMarker.current) {
                  locationMarker.current.remove();
                }

                // Create a pulsing dot for the location
                locationMarker.current = new vietmapgl.Marker({
                  color: '#4285F4'
                })
                .setLngLat([longitude, latitude])
                .addTo(map.current);
              }
              
              resolve(position);
            },
            (error) => {
              console.error('Error getting location:', error);
              resolve(null);
            },
            {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0
            }
          );
        } else {
          console.error('Geolocation is not supported by this browser.');
          resolve(null);
        }
      });
    },
    setMarkerDragCallback: (callback: ((index: number, lng: number, lat: number) => void) | null) => {
      markerDragCallback.current = callback;
    }
  }), [currentMapStyle, onMapStyleChange, is3DMode]);

  // Initialize map once
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize map with selected style
    const initialStyle = getMapStyle(initialMapStyle);
    
    map.current = new vietmapgl.Map({
      container: mapContainer.current,
      style: typeof initialStyle === 'string' ? initialStyle : initialStyle,
      center: [105.8342, 21.0285],
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
    <div 
      ref={mapContainer} 
      className={`w-full h-full ${className}`}
    />
  );
});

MapView.displayName = 'MapView';

export default MapView;
