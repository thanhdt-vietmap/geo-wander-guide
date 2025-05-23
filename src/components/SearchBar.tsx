
import React, { useState } from 'react';
import { Search, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SearchBarProps {
  onMenuToggle: () => void;
  isMenuOpen: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ onMenuToggle, isMenuOpen }) => {
  const [searchQuery, setSearchQuery] = useState('');

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
      
      <div className="w-96">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
          <Input
            type="text"
            placeholder="Tìm kiếm Google Maps"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-4 py-3 h-12 bg-white shadow-md border-gray-200 focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg text-base"
          />
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
