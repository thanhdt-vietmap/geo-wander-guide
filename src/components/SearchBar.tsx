import React, { useState, useEffect, useRef } from 'react';
import { Search, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SearchSuggestions from './SearchSuggestions';
import { toast } from '@/hooks/use-toast';
import { SecureApiClient } from '@/services/secureApiClient';
import { ENV } from '@/config/environment';

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
}

interface SearchBarProps {
  onMenuToggle: () => void;
  isMenuOpen: boolean;
  onPlaceSelect?: (place: PlaceDetails) => void;
}

const apiClient = SecureApiClient.getInstance();

const SearchBar: React.FC<SearchBarProps> = ({ 
  onMenuToggle, 
  isMenuOpen, 
  onPlaceSelect 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [isPlaceLoading, setIsPlaceLoading] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const API_KEY = '506862bb03a3d71632bdeb7674a3625328cb7e5a9b011841';
  const FOCUS_COORDINATES = '21.0285,105.8342'; // Hanoi coordinates

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

  const fetchPlaceDetails = async (refId: string) => {
    setIsPlaceLoading(true);
    try {
      const data: PlaceDetails = await apiClient.get('/place/v3', {
        refid: refId
      });
      
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
    <div className="absolute top-6 left-6 z-20 flex items-center gap-4">
      <Button
        variant="outline"
        size="icon"
        onClick={onMenuToggle}
        className="bg-white shadow-md hover:bg-gray-50 flex-shrink-0 w-10 h-10 rounded-lg border-gray-200"
      >
        {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>
      
      <div className="w-96 relative" ref={searchContainerRef}>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
          <Input
            type="text"
            placeholder="Tìm kiếm bằng VietMap"
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
