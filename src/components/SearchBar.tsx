
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
    <div className="absolute top-4 left-4 right-4 z-10 flex items-center gap-3">
      <Button
        variant="outline"
        size="icon"
        onClick={onMenuToggle}
        className="bg-white shadow-lg hover:bg-gray-50 flex-shrink-0"
      >
        {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>
      
      <div className="flex-1 relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Tìm kiếm địa điểm hoặc địa chỉ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-3 bg-white shadow-lg border-0 focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg"
          />
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
