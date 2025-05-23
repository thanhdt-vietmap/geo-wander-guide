import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronUp, ChevronDown, ArrowUpDown, Plus, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import SearchSuggestions from './SearchSuggestions';

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

interface RouteResponse {
  license: string;
  code: string;
  messages: any;
  paths: Array<{
    distance: number;
    weight: number;
    time: number;
    transfers: number;
    points_encoded: boolean;
    bbox: number[];
    points: string;
    instructions: RouteInstruction[];
    snapped_waypoints: string;
  }>;
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
}

const Direction: React.FC<DirectionProps> = ({ onClose, mapRef, startingPlace }) => {
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
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const isMobile = window.innerWidth <= 768;

  const API_KEY = '506862bb03a3d71632bdeb7674a3625328cb7e5a9b011841';
  const FOCUS_COORDINATES = '21.0285,105.8342'; // Hanoi coordinates

  // Update map when starting place is provided
  useEffect(() => {
    if (startingPlace && mapRef.current) {
      mapRef.current.flyTo(startingPlace.lng, startingPlace.lat);
      mapRef.current.addMarker(startingPlace.lng, startingPlace.lat, 'start');
    }
  }, [startingPlace]);

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
      const response = await fetch(
        `https://maps.vietmap.vn/api/autocomplete/v3?apikey=${API_KEY}&text=${encodeURIComponent(query)}&focus=${FOCUS_COORDINATES}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
        setShowSuggestions(true);
      } else {
        console.error('Search API error:', response.status);
        setSuggestions([]);
        toast({
          title: "Search failed",
          description: "Could not fetch search results",
          variant: "destructive"
        });
      }
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
      const response = await fetch(
        `https://maps.vietmap.vn/api/place/v3?apikey=${API_KEY}&refid=${encodeURIComponent(refId)}`
      );
      
      if (response.ok) {
        const data = await response.json();
        
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
      } else {
        console.error('Place API error:', response.status);
        toast({
          title: "Failed to load place details",
          description: "Could not fetch place details",
          variant: "destructive"
        });
        return null;
      }
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
      const pointParams = validWaypoints.map(wp => `point=${wp.lat},${wp.lng}`).join('&');
      const url = `https://maps.vietmap.vn/api/route?api-version=1.1&apikey=${API_KEY}&${pointParams}&points_encoded=true&vehicle=${vehicle}`;
      
      const response = await fetch(url);
      
      if (response.ok) {
        const data: RouteResponse = await response.json();
        setRouteData(data);
        
        // Draw the route on the map if available
        if (mapRef.current && data.paths && data.paths.length > 0) {
          const path = data.paths[0];
          const decodedPoints = decodePolyline(path.points);
          
          // Remove any existing routes
          mapRef.current.removeRoutes();
          
          // Add route to the map
          mapRef.current.addRoute(decodedPoints);
          
          // Add markers for waypoints
          mapRef.current.removeMarkers();
          validWaypoints.forEach((wp, index) => {
            const isStart = index === 0;
            const isEnd = index === validWaypoints.length - 1;
            mapRef.current.addMarker(wp.lng, wp.lat, isStart ? 'start' : isEnd ? 'end' : 'waypoint');
          });
          
          // Fit the map to the route bounds
          if (path.bbox && path.bbox.length === 4) {
            const [minLng, minLat, maxLng, maxLat] = path.bbox;
            mapRef.current.fitBounds([[minLng, minLat], [maxLng, maxLat]]);
          }
        }
        
        toast({
          title: "Route found",
          description: `Distance: ${(data.paths[0].distance / 1000).toFixed(2)} km, Time: ${Math.round(data.paths[0].time / 60000)} mins`,
        });
      } else {
        console.error('Direction API error:', response.status);
        toast({
          title: "Failed to get directions",
          description: "Could not calculate route",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Direction error:', error);
      toast({
        title: "Error getting directions",
        description: "An error occurred while calculating the route",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="fixed top-0 left-0 h-full z-40 transition-all duration-300">
      <div className="flex h-full">
        <div className="bg-white shadow-lg pt-0 w-[500px] flex flex-col h-full border-r">
          
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
          <div className="px-6 py-4" ref={searchContainerRef}>
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
                      onFocus={() => setActiveInputIndex(index)}
                      className="pl-10 pr-8"
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
                </div>
              ))}
              
              {/* Search suggestions */}
              {showSuggestions && activeInputIndex !== null && (
                <div className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
                  <SearchSuggestions
                    suggestions={suggestions}
                    onSelect={handleSuggestionSelect}
                    isVisible={showSuggestions}
                    isLoading={isSearchLoading}
                  />
                </div>
              )}
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
          
          {/* Route instructions */}
          {routeData && (
            <div className="flex-1 overflow-auto px-4 py-2">
              <h3 className="font-medium mb-2">Route details</h3>
              {routeData.paths[0]?.instructions.map((instruction, index) => (
                <div 
                  key={index} 
                  className="py-2 px-3 border-l-2 border-blue-500 mb-2 hover:bg-gray-50"
                >
                  <p className="text-sm">{instruction.text}</p>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{(instruction.distance / 1000).toFixed(2)} km</span>
                    <span>{Math.round(instruction.time / 60000)} mins</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Direction;
