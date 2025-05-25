import React, { useState } from 'react';
import SvgIcon from './SvgIcon'; // Assuming SvgIcon is a wrapper for your SVG assets

import SearchIcon from '../assets/search.svg'; // Example: your search icon

interface SearchInputAreaProps {
  onSearch: (query: string) => void;
  initialQuery?: string;
  isCompact?: boolean; // New prop to control size and padding
}

const SearchInputArea: React.FC<SearchInputAreaProps> = ({ onSearch, initialQuery = '', isCompact = false }) => {
  const [query, setQuery] = useState(initialQuery);

  // Update query when initialQuery changes (e.g., when a search is performed and the input needs to show the queried text)
  React.useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const inputPaddingClass = isCompact ? 'py-1 pl-4 pr-1' : 'py-2 pl-5 pr-2'; // Smaller padding when compact
  const buttonPaddingClass = isCompact ? 'p-1' : 'p-2'; // Smaller button padding when compact

  return (
    <form onSubmit={handleSearch} className={`w-full flex ${isCompact ? 'max-w-md' : 'max-w-2xl flex-col items-center'} px-0`}> {/* Adjust max-width and flex for compact mode */}
      <div className={`flex items-center w-full border border-gray-700 rounded-full shadow-md focus-within:border-blue-500 transition-all duration-200 bg-gray-800 ${inputPaddingClass}`}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask Gemini anything..."
          className="flex-grow border-none outline-none text-base bg-transparent placeholder-gray-500 text-gray-100"
        />
        <div className="flex items-center space-x-1 ml-2">
          <button type="submit" className={`rounded-full bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-200 ${buttonPaddingClass}`}>
            <SvgIcon src={SearchIcon} alt="Search" className="text-white" width={isCompact ? 20 : 24} height={isCompact ? 20 : 24} /> {/* Adjust icon size */}
          </button>
        </div>
      </div>
    </form>
  );
};

export default SearchInputArea;