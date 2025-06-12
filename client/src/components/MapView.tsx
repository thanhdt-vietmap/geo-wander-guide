import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import vietmapgl from '@vietmap/vietmap-gl-js/dist/vietmap-gl';
import '@vietmap/vietmap-gl-js/dist/vietmap-gl.css';
import { mapUtils } from '../utils/utils';

export interface MapViewRef {
  map: any;
  flyTo: (lng: number, lat: number) => void;
  addMarker: (lng: number, lat: number, type?: 'default' | 'start' | 'end' | 'waypoint', draggable?: boolean, index?: number) => void;
  removeMarkers: () => void;
  addRoute: (coordinates: [number, number][], routeId?: string, color?: string) => void;
  removeRoutes: () => void;
  fitBounds: (bounds: [[number, number], [number, number]], options?: { padding?: number | { top?: number; bottom?: number; left?: number; right?: number } }) => void;
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
  const map = useRef<vietmapgl.Map | null>(null);
  const markers = useRef<{ marker: any; index?: number }[]>([]);
  const routes = useRef<string[]>([]);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [currentMapStyle, setCurrentMapStyle] = useState(initialMapStyle);
  const [is3DMode, setIs3DMode] = useState(false);
  const locationMarker = useRef<any>(null);
  const markerDragCallback = useRef<((index: number, lng: number, lat: number) => void) | null>(null);
  
  // Store route and marker data for restoration after style change
  const savedRoutes = useRef<Array<{
    id: string;
    coordinates: [number, number][];
    color: string;
    isHighlighted: boolean;
  }>>([]);
  const savedMarkers = useRef<Array<{
    lng: number;
    lat: number;
    type: 'default' | 'start' | 'end' | 'waypoint';
    draggable: boolean;
    index?: number;
  }>>([]);

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
  const rightClickStartPos = useRef<[number, number] | null>(null);
  const rightClickTimeout = useRef<NodeJS.Timeout | null>(null);

  // Detect OS for platform-specific right-click handling
  // macOS: Uses native contextmenu event from map library (works reliably)
  // Windows: Requires additional mouseup handling + direct DOM event listener
  const isMacOS = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const isWindows = /Win/.test(navigator.platform);

  // Use useCallback to memoize event handlers and prevent unnecessary re-renders
  const handleMouseDown = useCallback((e: any) => {
    if (e.originalEvent.button === 2) {
      // Right mouse button
      isDragging.current = false;
      rightClickStartPos.current = [e.point.x, e.point.y];
      
      // Clear any existing timeout
      if (rightClickTimeout.current) {
        clearTimeout(rightClickTimeout.current);
        rightClickTimeout.current = null;
      }
    } else if (e.originalEvent.button === 0 && onClick) {
      // Left mouse button
      clickStartPos.current = [e.point.x, e.point.y];
      isDragging.current = false;
    }
  }, [onClick]);

  const handleMouseMove = useCallback(() => {
    if (!isDragging.current) {
      isDragging.current = true;
      
      // Clear right click timeout if user starts dragging
      if (rightClickTimeout.current) {
        clearTimeout(rightClickTimeout.current);
        rightClickTimeout.current = null;
      }
    }
  }, []);

  const handleContextMenu = useCallback((e: any) => {
    // Prevent default browser context menu
    e.preventDefault();
    e.originalEvent?.preventDefault();
    
    // Only trigger if not dragging and we have onContextMenu handler
    if (!isDragging.current && onContextMenu) {
      // Clear any pending timeout before triggering
      if (rightClickTimeout.current) {
        clearTimeout(rightClickTimeout.current);
        rightClickTimeout.current = null;
      }
      
      onContextMenu({
        lngLat: [e.lngLat.lng, e.lngLat.lat]
      });
    }
    isDragging.current = false;
  }, [onContextMenu]);

  const handleMouseUp = useCallback((e: any) => {
    if (e.originalEvent.button === 2) {
      // Right mouse button up - handle for Windows compatibility
      if (!isDragging.current && rightClickStartPos.current && onContextMenu && isWindows) {
        const currentPos = [e.point.x, e.point.y];
        const startPos = rightClickStartPos.current;
        
        // Calculate the distance moved during the right click
        const dx = currentPos[0] - startPos[0];
        const dy = currentPos[1] - startPos[1];
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // If the distance is small, consider it a right click without drag
        if (distance < 5) {
          // Use a small timeout to ensure contextmenu event doesn't override this
          rightClickTimeout.current = setTimeout(() => {
            if (onContextMenu) {
              onContextMenu({
                lngLat: [e.lngLat.lng, e.lngLat.lat]
              });
            }
            rightClickTimeout.current = null;
          }, 10);
        }
      }
      rightClickStartPos.current = null;
    } else if (e.originalEvent.button === 0 && !isDragging.current && clickStartPos.current && onClick) {
      // Left mouse button - existing logic
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
    
    // Reset dragging state after a short delay to ensure proper cleanup
    setTimeout(() => {
      isDragging.current = false;
    }, 50);
  }, [onClick, onContextMenu, isWindows]);

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
        return mapUtils.getVietMapHybridVectorTileLayer();
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
        // Save marker data for restoration after style change
        const markerData = { lng, lat, type, draggable, index };
        const existingIndex = savedMarkers.current.findIndex(m => 
          m.lng === lng && m.lat === lat && m.type === type && m.index === index
        );
        
        if (existingIndex >= 0) {
          savedMarkers.current[existingIndex] = markerData;
        } else {
          savedMarkers.current.push(markerData);
        }

        // Create marker with different colors based on type
        const colors = {
          default: '#FF0000',
          start: '#FF0000',
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
      // Also clear saved markers data
      savedMarkers.current = [];
    },
    addRoute: (coordinates: [number, number][], routeId: string = 'route', color?: string) => {
      if (map.current) {
        // Use provided color or get one from the predefined colors
        const routeColor = color || routeColors[routes.current.length % routeColors.length];

        // Save route data for restoration after style change
        const routeData = {
          id: routeId,
          coordinates,
          color: routeColor,
          isHighlighted: false
        };
        
        const existingIndex = savedRoutes.current.findIndex(r => r.id === routeId);
        if (existingIndex >= 0) {
          savedRoutes.current[existingIndex] = routeData;
        } else {
          savedRoutes.current.push(routeData);
        }

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

          // Check if boundary_province layer exists before using it as beforeId
          const beforeId = map.current.getLayer("boundary_province") ? "boundary_province" : undefined;
          
          // Add border layer for route (for selection highlight)
          map.current.addLayer({
            id: `${routeId}-border`,
            type: 'line',
            source: routeId,
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#FFFFFF',
              'line-width': 8,
              'line-opacity': 0 // Initially hidden
            }
          }, beforeId);

          // Add main route layer
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
          }, beforeId);

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
          // Remove main route layer
          if (map?.current?.getLayer(routeId)) {
            map.current.removeLayer(routeId);
          }
          // Remove border layer
          if (map?.current?.getLayer(`${routeId}-border`)) {
            map.current.removeLayer(`${routeId}-border`);
          }
          // Remove source
          if (map.current?.getSource(routeId)) {
            map.current.removeSource(routeId);
          }
        });
        routes.current = [];
        // Also clear saved routes data
        savedRoutes.current = [];
      }
    },
    fitBounds: (bounds: [[number, number], [number, number]], options?: { padding?: number | { top?: number; bottom?: number; left?: number; right?: number } }) => {
      if (map.current) {
        const defaultPadding = 50;
        let paddingConfig: any = { padding: defaultPadding };
        
        if (options?.padding) {
          if (typeof options.padding === 'number') {
            paddingConfig = { padding: options.padding };
          } else {
            // Use object padding format for MapboxGL/VietMapGL
            paddingConfig = {
              padding: {
                top: options.padding.top || defaultPadding,
                bottom: options.padding.bottom || defaultPadding,
                left: options.padding.left || defaultPadding,
                right: options.padding.right || defaultPadding
              }
            };
          }
        }
        
        map.current.fitBounds(bounds, paddingConfig);
      }
    },
    highlightRoute: (routeId: string) => {
      if (map.current) {
        // Update saved routes highlight status
        savedRoutes.current.forEach(route => {
          route.isHighlighted = route.id === routeId;
        });

        // First set all routes to less opacity and hide borders
        routes.current.forEach((id) => {
          if (map.current?.getLayer(id)) {
            map.current.setPaintProperty(id, 'line-opacity', 0.5);
            map.current.setPaintProperty(id, 'line-width', 3);
          }
          // Hide border for non-selected routes
          if (map.current?.getLayer(`${id}-border`)) {
            map.current.setPaintProperty(`${id}-border`, 'line-opacity', 0);
          }
        });

        // Then highlight the selected route and show its border
        if (map.current.getLayer(routeId)) {
          map.current.setPaintProperty(routeId, 'line-opacity', 1);
          map.current.setPaintProperty(routeId, 'line-width', 5);
        }
        
        // Show border for selected route
        if (map.current.getLayer(`${routeId}-border`)) {
          map.current.setPaintProperty(`${routeId}-border`, 'line-opacity', 1);
          map.current.setPaintProperty(`${routeId}-border`, 'line-width', 8);
        }
      }
    },
    setMapStyle: (styleType: string) => {
      if (map.current) {
        const newStyle = getMapStyle(styleType);
        
        // Clear current markers and routes visually (but keep saved data)
        markers.current.forEach(({ marker }) => marker.remove());
        markers.current = [];
        
        // Set the new style
        map.current.setStyle(newStyle as any);
        setCurrentMapStyle(styleType);
        if (onMapStyleChange) {
          onMapStyleChange(styleType);
        }
        
        // Set up listener for when the new style is loaded to restore routes and markers
        const handleStyleLoad = () => {
          // Add additional delay to ensure style is fully loaded
          setTimeout(() => {
            if (!map.current) return;
            
            // Restore all saved routes
            savedRoutes.current.forEach(routeData => {
              if (map.current) {
                try {
                  // Add the route source and layer
                  map.current.addSource(routeData.id, {
                    type: 'geojson',
                    data: {
                      type: 'Feature',
                      properties: {},
                      geometry: {
                        type: 'LineString',
                        coordinates: routeData.coordinates
                      }
                    }
                  });

                  // Check if boundary_province layer exists before using it as beforeId
                  const beforeId = map.current.getLayer("boundary_province") ? "boundary_province" : undefined;

                  // Add border layer for route (for selection highlight)
                  map.current.addLayer({
                    id: `${routeData.id}-border`,
                    type: 'line',
                    source: routeData.id,
                    layout: {
                      'line-join': 'round',
                      'line-cap': 'round'
                    },
                    paint: {
                      'line-color': '#FFFFFF',
                      'line-width': routeData.isHighlighted ? 8 : 8,
                      'line-opacity': routeData.isHighlighted ? 1 : 0
                    }
                  }, beforeId);

                  // Add main route layer
                  map.current.addLayer({
                    id: routeData.id,
                    type: 'line',
                    source: routeData.id,
                    layout: {
                      'line-join': 'round',
                      'line-cap': 'round'
                    },
                    paint: {
                      'line-color': routeData.color,
                      'line-width': routeData.isHighlighted ? 5 : 4,
                      'line-opacity': routeData.isHighlighted ? 1 : 0.5
                    }
                  }, beforeId);

                  // Add to routes tracking
                  if (!routes.current.includes(routeData.id)) {
                    routes.current.push(routeData.id);
                  }
                } catch (error) {
                  console.warn('Error restoring route:', routeData.id, error);
                }
              }
            });

            // Restore all saved markers
            savedMarkers.current.forEach(markerData => {
              if (map.current) {
                try {
                  const colors = {
                    default: '#FF0000',
                    start: '#FF0000',
                    end: '#0000FF',
                    waypoint: '#FFA500'
                  };

                  const marker = new vietmapgl.Marker({
                    color: colors[markerData.type],
                    draggable: markerData.draggable
                  })
                  .setLngLat([markerData.lng, markerData.lat])
                  .addTo(map.current);

                  // Add drag event listener if draggable
                  if (markerData.draggable && typeof markerData.index === 'number') {
                    marker.on('dragend', () => {
                      const lngLat = marker.getLngLat();
                      if (markerDragCallback.current) {
                        markerDragCallback.current(markerData.index!, lngLat.lng, lngLat.lat);
                      }
                    });
                  }

                  markers.current.push({ marker, index: markerData.index });
                } catch (error) {
                  console.warn('Error restoring marker:', markerData, error);
                }
              }
            });

            // console.log('Routes and markers restored after style change');
          }, 500); // 500ms delay to ensure style is fully loaded
        };

        // Use both 'style.load' and 'styledata' events for better reliability
        map.current.once('style.load', handleStyleLoad);
        
        // Fallback: also listen for styledata event
        const handleStyleData = (e: any) => {
          if (e.dataType === 'style') {
            // Remove the style.load listener since we're handling it here
            map.current?.off('style.load', handleStyleLoad);
            handleStyleLoad();
            map.current?.off('styledata', handleStyleData);
          }
        };
        
        map.current.on('styledata', handleStyleData);
        
        // Fallback timeout in case events don't fire
        setTimeout(() => {
          if (map.current) {
            map.current.off('style.load', handleStyleLoad);
            map.current.off('styledata', handleStyleData);
            // Only call handleStyleLoad if routes haven't been restored yet
            if (savedRoutes.current.length > 0 && routes.current.length === 0) {
              console.log('Fallback: restoring routes after timeout');
              handleStyleLoad();
            }
          }
        }, 2000);
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

                // Use default SDK location marker (no custom color or styling)
                locationMarker.current = new vietmapgl.Marker()
                .setLngLat([longitude, latitude])
                .addTo(map.current);
              }
              
              resolve(position);
            },
            (error) => {
              // console.error('Error getting location:', error);
              resolve(null);
            },
            {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0
            }
          );
        } else {
          // console.error('Geolocation is not supported by this browser.');
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
      style: initialStyle as any,
      center: [105.8342, 21.0285],
      zoom: 10,
      maxZoom: 20
    });

    // Set map loaded state when style is loaded
    map.current.on('load', () => {
      setIsMapLoaded(true);
      // map.current?.addControl(new vietmapgl.GeolocateControl(
      //   {
      //     positionOptions: {
      //       enableHighAccuracy: true
      //     },
      //     trackUserLocation: true,
      //     showAccuracyCircle: false,
      //     showUserLocation: true
      //   }

      // ), 'top-right');
    });

    // Cleanup function
    return () => {
      if (map.current) {
        map?.current?.remove();
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

    // Additional direct event listener for Windows compatibility only
    const mapElement = mapContainer.current;
    let handleDirectContextMenu: ((e: MouseEvent) => void) | null = null;

    if (isWindows && mapElement && onContextMenu) {
      handleDirectContextMenu = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Only trigger if not dragging
        if (!isDragging.current && onContextMenu && map.current) {
          // Convert screen coordinates to map coordinates
          const rect = mapElement.getBoundingClientRect();
          if (rect) {
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const lngLat = map.current.unproject([x, y]);
            
            // Clear any pending timeout
            if (rightClickTimeout.current) {
              clearTimeout(rightClickTimeout.current);
              rightClickTimeout.current = null;
            }
            
            onContextMenu({
              lngLat: [lngLat.lng, lngLat.lat]
            });
          }
        }
        
        // Reset dragging state after handling
        setTimeout(() => {
          isDragging.current = false;
        }, 100);
      };

      mapElement.addEventListener('contextmenu', handleDirectContextMenu, { passive: false });
    }

    // Cleanup function to remove event listeners
    return () => {
      // Clear any pending timeout
      if (rightClickTimeout.current) {
        clearTimeout(rightClickTimeout.current);
        rightClickTimeout.current = null;
      }
      
      if (map.current) {
        map.current.off('mousedown', handleMouseDown);
        map.current.off('mousemove', handleMouseMove);
        map.current.off('contextmenu', handleContextMenu);
        map.current.off('mouseup', handleMouseUp);
      }

      if (handleDirectContextMenu && mapElement && isWindows) {
        mapElement.removeEventListener('contextmenu', handleDirectContextMenu);
      }
    };
  }, [isMapLoaded, handleMouseDown, handleMouseMove, handleContextMenu, handleMouseUp, onContextMenu, isWindows]);

  return (
    <div 
      ref={mapContainer} 
      className={`w-full h-full ${className}`}
    />
  );
});

MapView.displayName = 'MapView';

export default MapView;
