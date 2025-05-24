import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Search, X, ChevronUp, ChevronDown, ArrowUpDown, Plus, Navigation, Map as MapIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import SearchSuggestions from './SearchSuggestions';
import RouteDetails from './RouteDetails';
import { SecureApiClient } from '@/services/secureApiClient';
import { ENV } from '@/config/environment';

// Utility function to decode Google's polyline format
function decodePolyline(polyline: string) {
  const points = [];
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
  mapRef: React.RefObject<any>;
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
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const isMobile = window.innerWidth <= 768;

  // Add animation effect
  useEffect(() => {
    const timer = setTimeout(() => setAnimating(false), 100);
    return () => clearTimeout(timer);
  }, []);

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

  // Expose methods to parent component through ref
  useImperativeHandle(ref, () => ({
    setEndPoint: (place: any) => {
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
        console.log(`Updating waypoint ${index} to coordinates: ${lng}, ${lat}`);
        
        // Get location details from coordinates using reverse geocoding
        const data = await apiClient.get<any[]>('/reverse/v3', {
          lng: lng.toString(),
          lat: lat.toString()
        });
        
        console.log('Reverse geocoding response:', data);
        
        if (data.length > 0) {
          // Update the waypoint with new coordinates and name
          setWaypoints(prev => {
            const newWaypoints = prev.map((wp, i) => 
              i === index 
                ? { ...wp, name: data[0].display, lat: lat, lng: lng, ref_id: data[0].ref_id }
                : wp
            );
            console.log('Updated waypoints:', newWaypoints);
            return newWaypoints;
          });
          
          // Auto-update route if we have enough valid waypoints and routes are already calculated
          if (autoUpdateRoute && routeData) {
            // Wait a bit for state to update, then call route API
            setTimeout(() => {
              handleGetDirections();
            }, 300);
          }
        }
      } catch (error) {
        console.error('Error getting location details:', error);
        // Update coordinates even if reverse geocoding fails
        setWaypoints(prev => prev.map((wp, i) => 
          i === index 
            ? { ...wp, lat: lat, lng: lng }
            : wp
        ));
        
        // Still try to update route if reverse geocoding fails but we have coordinates
        if (autoUpdateRoute && routeData) {
          setTimeout(() => {
            handleGetDirections();
          }, 300);
        }
      }
    }
  }), [waypoints, autoUpdateRoute, routeData]);

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

    setIsSearchLoading(true);
    try {
      const data = await apiClient.get<SearchResult[]>('/autocomplete/v3', {
        text: query,
        focus: ENV.FOCUS_COORDINATES
      });
      
      setSuggestions(data);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Search error:', error);
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
      
      // Update the waypoint at the specified index
      setWaypoints(prev => prev.map((wp, i) => 
        i === index 
          ? { ...wp, name: data.display, lat: data.lat, lng: data.lng, ref_id: refId }
          : wp
      ));

      // Center map on this point if it's the first selection
      if (mapRef.current && index === 0) {
        mapRef.current.flyTo(data.lng, data.lat);
      }

      return data;
    } catch (error) {
      console.error('Place error:', error);
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

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      searchPlaces(value);
    }, 300);
  };

  const handleInputFocus = (index: number) => {
    setActiveInputIndex(index);
  };

  const handleSuggestionSelect = async (suggestion: SearchResult) => {
    if (activeInputIndex !== null) {
      // Update the input field with the selected suggestion
      setWaypoints(prev => prev.map((wp, i) => 
        i === activeInputIndex ? { ...wp, name: suggestion.display } : wp
      ));
      
      // Fetch and store the details
      await fetchPlaceDetails(suggestion.ref_id, activeInputIndex);
    }
    
    setShowSuggestions(false);
    setActiveInputIndex(null);
  };

  const handleAddWaypoint = () => {
    setWaypoints(prev => [...prev, { name: "", lat: 0, lng: 0 }]);
  };

  const handleRemoveWaypoint = (index: number) => {
    if (waypoints.length <= 2) return; // Keep at least start and end points
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

    // Reorder waypoints
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
    
    // Highlight the selected route on the map
    if (mapRef.current) {
      mapRef.current.highlightRoute(routeId);
    }
    
    // Find the route path data by its ID
    const routeIndex = parseInt(routeId.replace('route-', ''));
    if (routeData?.paths && routeData.paths[routeIndex]) {
      const path = routeData.paths[routeIndex];
      
      // Fit map to this route's bounds
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
    // Validate that we have valid coordinates for all waypoints
    const validWaypoints = waypoints.filter(wp => wp.lat !== 0 && wp.lng !== 0);
    
    if (validWaypoints.length < 2) {
      toast({
        title: "Invalid route",
        description: "Please select valid start and end locations",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Construct the points query params
      const params: Record<string, string> = {
        'api-version': '1.1',
        points_encoded: 'true',
        vehicle: vehicle,
        'alternative_route.max_paths': '5'
      };

      // Add points as separate parameters
      validWaypoints.forEach((wp, index) => {
        params[`point`] = `${wp.lat},${wp.lng}`;
      });
      
      const data: RouteResponse = await apiClient.get('/route', params);
      setRouteData(data);
      
      // Clear previous route summaries and selected route
      setRouteSummaries([]);
      setSelectedRouteId(null);
      
      // Remove any existing routes and markers
      if (mapRef.current) {
        mapRef.current.removeRoutes();
        mapRef.current.removeMarkers();
      }
      
      // Draw routes on the map and create summaries
      if (data.paths && data.paths.length > 0) {
        const newSummaries: RouteSummary[] = [];
        
        data.paths.forEach((path, index) => {
          const routeId = `route-${index}`;
          const color = routeColors[index % routeColors.length];
          
          // Decode and add the route to the map
          const decodedPoints = decodePolyline(path.points);
          if (mapRef.current) {
            mapRef.current.addRoute(decodedPoints, routeId, color);
          }
          
          // Add to summaries
          newSummaries.push({
            id: routeId,
            distance: path.distance,
            time: path.time,
            color: color
          });
        });
        
        // Set route summaries
        setRouteSummaries(newSummaries);
        
        // Auto-select first route
        if (newSummaries.length > 0) {
          setSelectedRouteId(newSummaries[0].id);
          if (mapRef.current) {
            mapRef.current.highlightRoute(newSummaries[0].id);
          }
        }
        
        // Add draggable markers for waypoints
        if (mapRef.current) {
          validWaypoints.forEach((wp, index) => {
            const isStart = index === 0;
            const isEnd = index === validWaypoints.length - 1;
            mapRef.current.addMarker(
              wp.lng, 
              wp.lat, 
              isStart ? 'start' : isEnd ? 'end' : 'waypoint',
              true, // Make markers draggable
              index // Pass the index for tracking
            );
          });
        }
        
        // Fit the map to the bounds of the first route
        const firstPath = data.paths[0];
        if (firstPath.bbox && firstPath.bbox.length === 4 && mapRef.current) {
          const [minLng, minLat, maxLng, maxLat] = firstPath.bbox;
          mapRef.current.fitBounds([[minLng, minLat], [maxLng, maxLat]]);
        }
        
        // Enable auto-update after first successful route calculation
        setAutoUpdateRoute(true);
      }
      
      toast({
        title: `${data.paths.length} route${data.paths.length > 1 ? 's' : ''} found`,
        description: "Select a route to see details",
      });
    } catch (error) {
      console.error('Direction error:', error);
      toast({
        title: "Error getting directions",
        description: "An error occurred while calculating the route",
      });
    }
  };

  // If showing route details, render the RouteDetails component
  if (showRouteDetails && selectedPath) {
    return <RouteDetails path={selectedPath} onBack={handleBackFromDetails} />;
  }

  return (
    <div className={`fixed top-0 left-0 h-full z-40 transition-all duration-100 w-[500px] overflow-auto ${
      animating ? 'animate-in fade-in slide-in-from-left duration-100' : ''
    }`}>
      <div className="flex h-full">
        <div className="bg-white shadow-lg pt-0 w-full flex flex-col border-r">
          
          {/* Background Image */}
          <div 
            className="w-full h-[150px] bg-cover bg-center relative flex items-center justify-center" 
            style={{ backgroundImage: "url('/lovable-uploads/759ebf50-d075-4366-98b3-99771c255fa9.png')" }}
          >
            <Button 
              variant="outline" 
              size="icon" 
              onClick={onClose} 
              className="absolute top-6 right-6 bg-white rounded-full h-10 w-10 shadow-md"
            >
              <X className="h-5 w-5" />
            </Button>
            
          </div>

            {/* Travel mode selection */}
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2 mt-[10px] ml-[10px]">Travel mode</h3>
              <div className="flex gap-2 px-[30px]">
                {[
                  { id: 'car', icon: <span>🚗</span>, label: 'Car' },
                  { id: 'motorcycle', icon: <span>🏍️</span>, label: 'Motorcycle' },
                  { id: 'bike', icon: <span>🚲</span>, label: 'Bike' },
                  { id: 'foot', icon: <span>🚶</span>, label: 'Walk' }
                ].map(mode => (
                  <Button
                    key={mode.id}
                    variant={vehicle === mode.id ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1"
                    onClick={() => setVehicle(mode.id as any)}
                  >
                    <span className="mr-1">{mode.icon}</span>
                    <span>{mode.label}</span>
                  </Button>
                ))
                
                }

              </div>
              
            </div>
          <div className="px-6 py-4 relative" ref={searchContainerRef}>
            {/* Waypoints inputs */}
            <div className="space-y-3 mb-4">
              {waypoints.map((waypoint, index) => (
                <div 
                  key={index} 
                  className={`relative flex items-center gap-2 ${
                    draggedIndex === index ? 'opacity-50 bg-gray-100' : ''
                  }`}
                  draggable={waypoints.length > 2}
                  onDragStart={() => handleDragStart(index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, index)}
                >
                  {/* Reorder buttons for >2 waypoints */}
                  {waypoints.length > 2 && (
                    <div className="flex flex-col">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 p-0"
                        onClick={() => handleMoveWaypoint(index, 'up')}
                        disabled={index === 0}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 p-0"
                        onClick={() => handleMoveWaypoint(index, 'down')}
                        disabled={index === waypoints.length - 1}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  
                  <div className="flex-1 relative">
                    <Input
                      placeholder={index === 0 ? "Choose starting point" : index === waypoints.length - 1 ? "Choose destination" : "Add stop"}
                      value={waypoint.name}
                      onChange={(e) => handleInputChange(e, index)}
                      onFocus={() => handleInputFocus(index)}
                      className="pl-10 pr-8"
                      ref={el => inputRefs.current[index] = el}
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    
                    {/* Remove button for waypoints (not for first/last when only 2) */}
                    {(waypoints.length > 2 || (waypoints.length > 2 && (index !== 0 && index !== waypoints.length - 1))) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6"
                        onClick={() => handleRemoveWaypoint(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  {/* Swap button for exactly 2 waypoints */}
                  {waypoints.length === 2 && index === 0 && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleSwapWaypoints}
                    >
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  )}

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
          
          {/* Route summaries */}
          {routeSummaries.length > 0 && (
            <div className="flex-1 overflow-auto px-4 py-2">
              <h3 className="font-medium mb-3">Available routes</h3>
              <div className="space-y-2">
                {routeSummaries.map((route) => (
                  <div
                    key={route.id}
                    className={`p-3 border rounded-md cursor-pointer transition-all ${
                      selectedRouteId === route.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => handleSelectRoute(route.id)}
                  >
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-10 rounded-full mr-3" 
                        style={{ backgroundColor: route.color }}
                      />
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <span className="font-medium">{(route.distance / 1000).toFixed(2)} km</span>
                          <span className="text-gray-600">{Math.round(route.time / 60000)} mins</span>
                        </div>
                      </div>
                    </div>
                    
                    {selectedRouteId === route.id && (
                      <div className="mt-3 flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={handleShowRouteDetails}
                        >
                          <MapIcon className="h-4 w-4" />
                          View details
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

Direction.displayName = 'Direction';

export default Direction;
