import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { ArrowUpDown, Plus, Navigation } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { toast } from '../hooks/use-toast';
import SearchSuggestions from './SearchSuggestions';
import RouteDetails from './RouteDetails';
import DirectionHeader from './direction/DirectionHeader';
import VehicleSelector from './direction/VehicleSelector';
import WaypointInput from './direction/WaypointInput';
import RouteList from './direction/RouteList';
import { SecureApiClient } from '../services/secureApiClient';
import { getReverseGeocoding } from '../services/mapService';
import { ENV } from '../config/environment';
import { MapViewRef } from './MapView';

// Utility function to decode Google's polyline format
function decodePolyline(polyline: string) {
  const points: [number, number][] = [];
  let index = 0;
  const len = polyline.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;

    do {
      b = polyline.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      b = polyline.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    points.push([lng * 1e-5, lat * 1e-5]);
  }

  return points;
}

interface WayPoint {
  name: string;
  lat: number;
  lng: number;
  ref_id?: string;
}

interface SearchResult {
  ref_id: string;
  distance: number;
  address: string;
  name: string;
  display: string;
  boundaries: Array<{
    type: number;
    id: number;
    name: string;
    prefix: string;
    full_name: string;
  }>;
  categories: any[];
  entry_points: any[];
}

interface RouteInstruction {
  distance: number;
  heading: number;
  sign: number;
  interval: number[];
  text: string;
  time: number;
  street_name: string;
  last_heading: number | null;
}

interface RoutePath {
  distance: number;
  weight: number;
  time: number;
  transfers: number;
  points_encoded: boolean;
  bbox: number[];
  points: string;
  instructions: RouteInstruction[];
  snapped_waypoints: string;
}

interface RouteResponse {
  license: string;
  code: string;
  messages: any;
  paths: RoutePath[];
}

interface RouteSummary {
  id: string;
  distance: number;
  time: number;
  color: string;
}

interface DirectionProps {
  onClose: () => void;
  mapRef: React.RefObject<MapViewRef>;
  startingPlace?: {
    display: string;
    lat: number;
    lng: number;
    name?: string;
  } | null;
  onMapClick?: (activeInputRef: number | null) => boolean;
}

export interface DirectionRef {
  setEndPoint: (place: any) => void;
  addWaypoint: (place: any) => void;
  hasValidInputs: () => boolean;
  updateWaypointCoordinates: (index: number, lng: number, lat: number) => void;
}

const apiClient = SecureApiClient.getInstance();

// Direction panel width constant
const DIRECTION_PANEL_WIDTH = 500;

const Direction = forwardRef<DirectionRef, DirectionProps>(({ onClose, mapRef, startingPlace, onMapClick }, ref) => {
  const [animating, setAnimating] = useState(true);
  const [waypoints, setWaypoints] = useState<WayPoint[]>([
    { name: startingPlace?.display || "", lat: startingPlace?.lat || 0, lng: startingPlace?.lng || 0 },
    { name: "", lat: 0, lng: 0 }
  ]);
  const [activeInputIndex, setActiveInputIndex] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [vehicle, setVehicle] = useState<'car' | 'bike' | 'foot' | 'motorcycle'>('car');
  const [routeData, setRouteData] = useState<RouteResponse | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [routeSummaries, setRouteSummaries] = useState<RouteSummary[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [showRouteDetails, setShowRouteDetails] = useState(false);
  const [selectedPath, setSelectedPath] = useState<RoutePath | null>(null);
  const [autoUpdateRoute, setAutoUpdateRoute] = useState(false);
  const [pendingEndPoint, setPendingEndPoint] = useState<any>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Add animation effect
  useEffect(() => {
    const timer = setTimeout(() => setAnimating(false), 100);
    return () => clearTimeout(timer);
  }, []);

  // Handle pending end point when component mounts
  useEffect(() => {
    if (pendingEndPoint) {
      setWaypoints(prev => prev.map((wp, i) =>
        i === prev.length - 1
          ? { ...wp, name: pendingEndPoint.display, lat: pendingEndPoint.lat, lng: pendingEndPoint.lng, ref_id: pendingEndPoint.ref_id }
          : wp
      ));
      setPendingEndPoint(null);
    }
  }, [pendingEndPoint]);
  const autoFetchNewRoute = () => {
    // if (autoUpdateRoute && routeData) {

      // Use a small delay to ensure state has updated
      setTimeout(() => {
        handleGetDirections();
      }, 100);
    // }
  }
  // Function to detect if input is lat,lng format
  const detectLatLngFormat = (query: string): { lat: number; lng: number } | null => {
    const trimmed = query.trim();
    const regex = /^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/;
    const match = trimmed.match(regex);

    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);

      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng };
      }
    }

    return null;
  };

  const searchByCoordinates = async (lat: number, lng: number, index: number) => {
    setIsSearchLoading(true);
    try {
      const placeDetails = await getReverseGeocoding(lng, lat);

      setWaypoints(prev => prev.map((wp, i) =>
        i === index
          ? { ...wp, name: placeDetails.display, lat: placeDetails.lat, lng: placeDetails.lng, ref_id: placeDetails.ref_id }
          : wp
      ));

      if (mapRef.current && index === 0) {
        mapRef.current.flyTo(placeDetails.lng, placeDetails.lat);
      }

      setShowSuggestions(false);
      setActiveInputIndex(null);

      // // console.log('Reverse geocoding result for waypoint', index, ':', placeDetails);
    } catch (error) {
      // console.error('Reverse geocoding error:', error);
      toast({
        title: "Lỗi tìm kiếm tọa độ",
        description: "Không thể tìm thấy thông tin vị trí cho tọa độ này",
        variant: "destructive"
      });
    } finally {
      setIsSearchLoading(false);
    }
  };

  // New method to fill an input with location data
  const fillInputWithLocation = (location: { display: string; lat: number; lng: number; ref_id?: string }) => {
    // Find index to update: use activeInputIndex if available, or find first empty input
    let indexToUpdate = activeInputIndex;

    if (indexToUpdate === null) {
      // Find first empty input
      const emptyIndex = waypoints.findIndex(wp => wp.name === "");
      indexToUpdate = emptyIndex >= 0 ? emptyIndex : null;
    }

    // If we found an index to update, set the waypoint
    if (indexToUpdate !== null) {
      setWaypoints(prev => prev.map((wp, i) =>
        i === indexToUpdate
          ? { ...wp, name: location.display, lat: location.lat, lng: location.lng, ref_id: location.ref_id }
          : wp
      ));

      // Focus on the next empty input if available
      if (indexToUpdate < waypoints.length - 1) {
        const nextEmptyIndex = waypoints.findIndex((wp, i) => i > indexToUpdate && wp.name === "");
        if (nextEmptyIndex >= 0) {
          setTimeout(() => {
            inputRefs.current[nextEmptyIndex]?.focus();
          }, 100);
        }
      }

      return true;
    }

    return false;
  };
  useEffect(() => {
    if (waypoints.length < 2) {
      return
    }
    const validWaypoints = waypoints.filter(wp => wp && wp.lat !== 0 && wp.lng !== 0);
    // console.log('waypoints:', waypoints);
    // console.log('Valid waypoints:', validWaypoints);
    // console.log(validWaypoints.length, waypoints.length);
    // console.log(validWaypoints.length == waypoints.length);

    if (validWaypoints.length === waypoints.length) {
      autoFetchNewRoute();
    }
  }, [waypoints,vehicle]);
  // Expose methods to parent component through ref
  useImperativeHandle(ref, () => ({
    setEndPoint: (place: any) => {
      // If component is not fully mounted yet, store as pending
      if (animating) {
        setPendingEndPoint(place);
        return;
      }

      // Set the last waypoint as the end point
      setWaypoints(prev => prev.map((wp, i) =>
        i === prev.length - 1
          ? { ...wp, name: place.display, lat: place.lat, lng: place.lng, ref_id: place.ref_id }
          : wp
      ));
    },
    addWaypoint: (place: any) => {
      // Add a new waypoint before the last one (which should be the end point)
      setWaypoints(prev => {
        const newWaypoints = [...prev];
        const newWaypoint = {
          name: place.display,
          lat: place.lat,
          lng: place.lng,
          ref_id: place.ref_id
        };
        // Insert before the last waypoint (end point)
        newWaypoints.splice(newWaypoints.length - 1, 0, newWaypoint);
        return newWaypoints;
      });
    },
    hasValidInputs: () => {
      const validWaypoints = waypoints.filter(wp => wp.lat !== 0 && wp.lng !== 0);
      return validWaypoints.length >= 2;
    },
    updateWaypointCoordinates: async (index: number, lng: number, lat: number) => {
      try {
        // console.log(`Updating waypoint ${index} to coordinates: ${lng}, ${lat}`);

        // Update the waypoint coordinates immediately without removing the marker
        setWaypoints(prev => {
          const newWaypoints = prev.map((wp, i) =>
            i === index
              ? { ...wp, lat: lat, lng: lng }
              : wp
          );
          // console.log('Updated waypoints with new coordinates:', newWaypoints);
          return newWaypoints;
        });

        // Get location details from coordinates using reverse geocoding
        // Delay 1 second to ensure state is updated
        const data = await apiClient.get<any[]>('/reverse/v3', {
          lng: lng.toString(),
          lat: lat.toString()
        });

        // console.log('Reverse geocoding response:', data);

        if (data.length > 0) {
          // Update the waypoint name with reverse geocoding result
          // console.log('updating new waypoint', waypoints)
          setWaypoints(prev => {
            const newWaypoints = prev.map((wp, i) =>
              i === index
                ? { ...wp, name: data[0].display, ref_id: data[0].ref_id }
                : wp
            );
            // console.log('Updated waypoints with location name:', newWaypoints);
            return newWaypoints;
          });
          // console.log('Updated waypoint', waypoints);
        }


        // Auto-update route immediately if we have routes already calculated
      } catch (error) {
        // console.error('Error getting location details:', error);
        // Still try to update route if reverse geocoding fails but we have coordinates
        if (autoUpdateRoute && routeData) {
          setTimeout(() => {
            // console.log('Updated waypoint', waypoints);
            handleGetDirections();
          }, 100);
        }
      }
    }
  }), [waypoints, autoUpdateRoute, routeData, animating]);

  // Pre-defined colors for multiple routes
  const routeColors = ['#0071bc', '#d92f88', '#f7941d', '#39b54a', '#662d91', '#ed1c24'];

  // Update map when starting place is provided
  useEffect(() => {
    if (startingPlace && mapRef.current) {
      mapRef.current.flyTo(startingPlace.lng, startingPlace.lat);
      mapRef.current.addMarker(startingPlace.lng, startingPlace.lat, 'start');
    }
  }, [startingPlace]);

  // Initialize inputRefs array when waypoints change
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, waypoints.length);
  }, [waypoints.length]);

  useEffect(() => {
    // Clear drag state when component unmounts
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const searchPlaces = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const coordinates = detectLatLngFormat(query);
    if (coordinates && activeInputIndex !== null) {
      await searchByCoordinates(coordinates.lat, coordinates.lng, activeInputIndex);
      return;
    }

    setIsSearchLoading(true);
    try {

        const focus = mapRef?.current?.getCenter();
        const focusCoordinates = focus ? `${focus[1]},${focus[0]}` : ENV.FOCUS_COORDINATES;
      const data = await apiClient.get<SearchResult[]>('/autocomplete/v3', {
        text: query,
        focus: focusCoordinates
      });

      setSuggestions(data);
      setShowSuggestions(true);
    } catch (error) {
      // console.error('Search error:', error);
      setSuggestions([]);
      toast({
        title: "Search error",
        description: "An error occurred during search",
        variant: "destructive"
      });
    } finally {
      setIsSearchLoading(false);
    }
  };

  const fetchPlaceDetails = async (refId: string, index: number) => {
    try {
      const data = await apiClient.get<any>('/place/v3', {
        refid: refId
      });

      setWaypoints(prev => prev.map((wp, i) =>
        i === index
          ? { ...wp, name: data.display, lat: data.lat, lng: data.lng, ref_id: refId }
          : wp
      ));

      if (mapRef.current && index === 0) {
        mapRef.current.flyTo(data.lng, data.lat);
      }

      return data;
    } catch (error) {
      // console.error('Place error:', error);
      toast({
        title: "Error loading place",
        description: "An error occurred while loading place details",
        variant: "destructive"
      });
      return null;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;

    setWaypoints(prev => prev.map((wp, i) =>
      i === index ? { ...wp, name: value } : wp
    ));

    setActiveInputIndex(index);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchPlaces(value);
    }, 300);
  };

  const handleInputFocus = (index: number) => {
    setActiveInputIndex(index);
  };

  const handleSuggestionSelect = async (suggestion: SearchResult) => {
    if (activeInputIndex !== null) {
      setWaypoints(prev => prev.map((wp, i) =>
        i === activeInputIndex ? { ...wp, name: suggestion.display } : wp
      ));

      await fetchPlaceDetails(suggestion.ref_id, activeInputIndex);
    }

    setShowSuggestions(false);
    setActiveInputIndex(null);
  };

  const handleAddWaypoint = () => {
    setWaypoints(prev => [...prev, { name: "", lat: 0, lng: 0 }]);
  };

  const handleRemoveWaypoint = (index: number) => {
    if (waypoints.length <= 2) return;
    setWaypoints(prev => prev.filter((_, i) => i !== index));
  };

  const handleSwapWaypoints = () => {
    if (waypoints.length === 2) {
      setWaypoints([waypoints[1], waypoints[0]]);
    }
  };

  const handleMoveWaypoint = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      setWaypoints(prev => {
        const newWaypoints = [...prev];
        [newWaypoints[index - 1], newWaypoints[index]] = [newWaypoints[index], newWaypoints[index - 1]];
        return newWaypoints;
      });
    } else if (direction === 'down' && index < waypoints.length - 1) {
      setWaypoints(prev => {
        const newWaypoints = [...prev];
        [newWaypoints[index], newWaypoints[index + 1]] = [newWaypoints[index + 1], newWaypoints[index]];
        return newWaypoints;
      });
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    setWaypoints(prev => {
      const newWaypoints = [...prev];
      const draggedWaypoint = newWaypoints[draggedIndex];
      newWaypoints.splice(draggedIndex, 1);
      newWaypoints.splice(index, 0, draggedWaypoint);
      return newWaypoints;
    });

    setDraggedIndex(index);
  };

  const handleSelectRoute = (routeId: string) => {
    setSelectedRouteId(routeId);

    if (mapRef.current) {
      mapRef.current.highlightRoute(routeId);
    }

    const routeIndex = parseInt(routeId.replace('route-', ''));
    if (routeData?.paths && routeData.paths[routeIndex]) {
      const path = routeData.paths[routeIndex];

      if (path.bbox && path.bbox.length === 4 && mapRef.current) {
        const [minLng, minLat, maxLng, maxLat] = path.bbox;
        mapRef.current.fitBounds([[minLng, minLat], [maxLng, maxLat]]);
      }
    }
  };

  const handleShowRouteDetails = () => {
    if (!selectedRouteId || !routeData) return;

    const routeIndex = parseInt(selectedRouteId.replace('route-', ''));
    if (routeData.paths && routeData.paths[routeIndex]) {
      setSelectedPath(routeData.paths[routeIndex]);
      setShowRouteDetails(true);
    }
  };

  const handleBackFromDetails = () => {
    setShowRouteDetails(false);
    setSelectedPath(null);
  };

  const handleGetDirections = async () => {
    const validWaypoints = waypoints.filter(wp => wp.lat !== 0 && wp.lng !== 0);
    // console.log('waypoints:', waypoints);
    // console.log('Valid waypoints:', validWaypoints);
    if (validWaypoints.length < 2) {
      toast({
        title: "Invalid route",
        description: "Please select valid start and end locations",
        variant: "destructive"
      });
      return;
    }

    try {
      const params: Record<string, string> = {
        'api-version': '1.1',
        points_encoded: 'true',
        vehicle: vehicle,
        'alternative_route.max_paths': '5'
      };

      // Add each waypoint as a separate point parameter
      // const pointParams: string[] = [];
      // validWaypoints.forEach((wp) => {
      //   pointParams.push(`${wp.lat},${wp.lng}`);
      // });

      // Convert to the format expected by the API client
      const apiParams: Record<string, string> = {
        'api-version': '1.1',
        points_encoded: 'true',
        vehicle: vehicle
      };
      // Do not modify this line, it is required for the API client
      const pointParamStrings = validWaypoints.map((wp, index) => `point=${wp.lat},${wp.lng}`).join('&');
      // console.log('Direction response:', pointParamStrings);
      const data: RouteResponse = await apiClient.get(`/route?${pointParamStrings}`, apiParams);
      setRouteData(data);

      setRouteSummaries([]);
      setSelectedRouteId(null);

      if (mapRef.current) {
        mapRef.current.removeRoutes();
        mapRef.current.removeMarkers();
      }

      if (data.paths && data.paths.length > 0) {
        const newSummaries: RouteSummary[] = [];

        data.paths.forEach((path, index) => {
          const routeId = `route-${index}`;
          const color = routeColors[index % routeColors.length];

          const decodedPoints = decodePolyline(path.points);
          if (mapRef.current) {
            mapRef.current.addRoute(decodedPoints, routeId, color);
          }

          newSummaries.push({
            id: routeId,
            distance: path.distance,
            time: path.time,
            color: color
          });
        });

        setRouteSummaries(newSummaries);

        if (newSummaries.length > 0) {
          setSelectedRouteId(newSummaries[0].id);
          if (mapRef.current) {
            mapRef.current.highlightRoute(newSummaries[0].id);
          }
        }

        // Re-add markers after updating routes - using current waypoint coordinates
        if (mapRef.current) {
          validWaypoints.forEach((wp, index) => {
            const isStart = index === 0;
            const isEnd = index === validWaypoints.length - 1;
            mapRef?.current?.addMarker(
              wp.lng,
              wp.lat,
              isStart ? 'start' : isEnd ? 'end' : 'waypoint',
              true,
              index
            );
          });
        }

        const firstPath = data.paths[0];
        if (firstPath.bbox && firstPath.bbox.length === 4 && mapRef.current) {
          const [minLng, minLat, maxLng, maxLat] = firstPath.bbox;
          // Add padding left to account for Direction panel width
          mapRef.current.fitBounds([[minLng, minLat], [maxLng, maxLat]], {
            padding: {
              top: 100,
              bottom: 100,
              left: DIRECTION_PANEL_WIDTH + 50, // Direction width + extra padding
              right: 100
            }
          });
        }

        setAutoUpdateRoute(true);
      }

      toast({
        title: `${data.paths.length} route${data.paths.length > 1 ? 's' : ''} found`,
        description: "Select a route to see details",
      });
    } catch (error) {
      // console.error('Direction error:', error);
      toast({
        title: "Error getting directions",
        description: "An error occurred while calculating the route",
        variant: "destructive"
      });
    }
  };

  // If showing route details, render the RouteDetails component
  if (showRouteDetails && selectedPath) {
    return <RouteDetails path={selectedPath} onBack={handleBackFromDetails} />;
  }

  return (
    <div className={`fixed top-0 left-0 h-full z-40 transition-all duration-100 w-[500px] overflow-auto ${animating ? 'animate-in fade-in slide-in-from-left duration-100' : ''
      }`}>
      <div className="flex h-full">
        <div className="bg-white shadow-lg pt-0 w-full flex flex-col border-r">
          <DirectionHeader onClose={onClose} />

          <VehicleSelector vehicle={vehicle} onVehicleChange={setVehicle} />

          <div className="px-6 py-4 relative" ref={searchContainerRef}>
            {/* Waypoints inputs */}
            <div className="space-y-3 mb-4">
              {waypoints.map((waypoint, index) => (
                <div key={index}>
                  <WaypointInput
                    waypoint={waypoint}
                    index={index}
                    totalWaypoints={waypoints.length}
                    draggedIndex={draggedIndex}
                    activeInputIndex={activeInputIndex}
                    onInputChange={handleInputChange}
                    onInputFocus={handleInputFocus}
                    onMoveWaypoint={handleMoveWaypoint}
                    onRemoveWaypoint={handleRemoveWaypoint}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                    onSwapWaypoints={waypoints.length === 2 ? handleSwapWaypoints : undefined}
                    inputRef={el => inputRefs.current[index] = el}
                  />

                  {/* Render suggestions for the active input directly below it */}
                  {showSuggestions && activeInputIndex === index && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-50">
                      <SearchSuggestions
                        suggestions={suggestions}
                        onSelect={handleSuggestionSelect}
                        isVisible={true}
                        isLoading={isSearchLoading}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add waypoint button */}
            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
              onClick={handleAddWaypoint}
            >
              <Plus className="h-4 w-4" />
              Add stop
            </Button>

            <Separator className="my-4" />

            {/* Get directions button */}
            <Button
              className="w-full mb-4"
              onClick={handleGetDirections}
              disabled={waypoints.filter(wp => wp.lat !== 0 && wp.lng !== 0).length < 2}
            >
              <Navigation className="h-4 w-4 mr-2" />
              Get directions
            </Button>
          </div>

          <Separator />

          <RouteList
            routeSummaries={routeSummaries}
            selectedRouteId={selectedRouteId}
            onSelectRoute={handleSelectRoute}
            onShowRouteDetails={handleShowRouteDetails}
          />
        </div>
      </div>
    </div>
  );
});

Direction.displayName = 'Direction';

export default Direction;
