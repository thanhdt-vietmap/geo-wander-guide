import React, { useState, useEffect, useRef } from 'react';
import { Search, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SearchSuggestions from './SearchSuggestions';
import { toast } from '@/hooks/use-toast';
import { SecureApiClient } from '@/services/secureApiClient';
import { getReverseGeocoding } from '@/services/mapService';
import { ENV } from '@/config/environment';
import { useUrlPlaceLoader } from '@/hooks/useUrlPlaceLoader';
import { MapViewRef } from './MapView';

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

interface PlaceDetails {
  display: string;
  name: string;
  hs_num: string;
  street: string;
  address: string;
  city_id: number;
  city: string;
  district_id: number;
  district: string;
  ward_id: number;
  ward: string;
  lat: number;
  lng: number;
  ref_id?: string;
}

interface SearchBarProps {
  onMenuToggle: () => void;
  isMenuOpen: boolean;
  onPlaceSelect?: (place: PlaceDetails) => void;
  onClose?: () => void;
  mapRef?: React.RefObject<MapViewRef>; // Optional map reference for future use
}

const apiClient = SecureApiClient.getInstance();

const SearchBar: React.FC<SearchBarProps> = ({ 
  onMenuToggle, 
  isMenuOpen, 
  onPlaceSelect,
  onClose,
  mapRef
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [isPlaceLoading, setIsPlaceLoading] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Handle URL place loading
  const handleUrlPlaceLoad = (place: PlaceDetails) => {
    setSearchQuery(place.display);
    setShowSuggestions(false);
    if (onPlaceSelect) {
      onPlaceSelect(place);
    }
  };

  useUrlPlaceLoader(null, handleUrlPlaceLoad);

  // Function to detect if input is lat,lng format
  const detectLatLngFormat = (query: string): { lat: number; lng: number } | null => {
    // Remove extra spaces and check for comma separated numbers
    const trimmed = query.trim();
    const regex = /^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/;
    const match = trimmed.match(regex);
    
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      
      // Basic validation for reasonable lat/lng ranges
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng };
      }
    }
    
    return null;
  };

  const searchByCoordinates = async (lat: number, lng: number) => {
    setIsSearchLoading(true);
    try {
      const placeDetails = await getReverseGeocoding(lng, lat);
      
      if (onPlaceSelect) {
        onPlaceSelect(placeDetails);
      }
      
      setSearchQuery(placeDetails.display);
      setShowSuggestions(false);
      
      console.log('Reverse geocoding result:', placeDetails);
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      toast({
        title: "Lỗi tìm kiếm tọa độ",
        description: "Không thể tìm thấy thông tin vị trí cho tọa độ này",
        variant: "destructive"
      });
    } finally {
      setIsSearchLoading(false);
    }
  };

  const searchPlaces = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Check if input is in lat,lng format
    const coordinates = detectLatLngFormat(query);
    if (coordinates) {
      await searchByCoordinates(coordinates.lat, coordinates.lng);
      return;
    }

    setIsSearchLoading(true);
    try {
      // focus: lat,lng: 21.0285,105.8342
      const focus = mapRef?.current?.getCenter();
      const focusCoordinates = focus ? `${focus[1]},${focus[0]}` : ENV.FOCUS_COORDINATES;
      const data = await apiClient.get<SearchResult[]>('/autocomplete/v3', {
        text: query,
        focus: focusCoordinates
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

  const fetchPlaceDetails = async (refId: string) => {
    setIsPlaceLoading(true);
    try {
      const data: PlaceDetails = await apiClient.get('/place/v3', {
        refid: refId
      });
      data.ref_id = refId; // Ensure ref_id is set
      console.log('Place details:', data);
      if (onPlaceSelect) {
        onPlaceSelect(data);
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
    } finally {
      setIsPlaceLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

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
    setSearchQuery(suggestion.display);
    setShowSuggestions(false);
    
    // Fetch place details
    const placeDetails = await fetchPlaceDetails(suggestion.ref_id);
    console.log('Selected place details:', placeDetails);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    onClose();
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="absolute top-6 left-6 z-20 flex items-start gap-4">
      <Button
        variant="outline"
        size="icon"
        onClick={onMenuToggle}
        className="bg-white shadow-md hover:bg-gray-50 flex-shrink-0 w-12 h-12 rounded-lg border-gray-200"
      >
        {isMenuOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
      </Button>
      
      <div className="w-96 relative" ref={searchContainerRef}>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
          <Input
            type="text"
            placeholder="Tìm kiếm địa điểm hoặc nhập tọa độ (vd: 21.0285, 105.8342)"
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            className="pl-12 pr-12 py-3 h-12 bg-white shadow-md border-gray-200 focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg text-base"
          />
          {searchQuery && (
            <button 
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              onClick={clearSearch}
            >
              <X className="h-5 w-5" />
            </button>
          )}
          
          {isSearchLoading && !isPlaceLoading && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          )}
        </div>
        
        <SearchSuggestions
          suggestions={suggestions}
          onSelect={handleSuggestionSelect}
          isVisible={showSuggestions}
          isLoading={isPlaceLoading}
        />
      </div>
    </div>
  );
};

export default SearchBar;
