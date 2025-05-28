
import React from 'react';
import { MapPin } from 'lucide-react';

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

interface SearchSuggestionsProps {
  suggestions: SearchResult[];
  onSelect: (suggestion: SearchResult) => void;
  isVisible: boolean;
  isLoading?: boolean;
}

const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({ 
  suggestions, 
  onSelect, 
  isVisible,
  isLoading = false
}) => {
  if (!isVisible) return null;

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
          <span className="text-sm text-gray-500">Loading suggestions...</span>
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
        <div className="py-3 text-center text-sm text-gray-500">
          No results found
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto z-50">
      {suggestions.map((suggestion) => (
        <div
          key={suggestion.ref_id}
          className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
          onClick={() => onSelect(suggestion)}
        >
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {suggestion.name}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {suggestion.address}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SearchSuggestions;
