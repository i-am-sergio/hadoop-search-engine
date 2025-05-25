import React, { useState } from 'react';
import SvgIcon from './SvgIcon'; // Import our SVG wrapper component
import SearchIcon from '../assets/search.svg';
import AccountCircleIcon from '../assets/account_circle.svg';

interface SearchBoxProps {
  onSearch: (query: string) => void;
}

const SearchBox: React.FC<SearchBoxProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-white text-gray-800 font-sans pt-5">
      <div className="w-full max-w-[900px] flex justify-between items-center px-5 py-2 box-border">
        <div className="text-2xl font-bold flex items-center">
          <span
            className="text-4xl font-bold mr-1"
            style={{
              background: 'linear-gradient(to right, #4285F4, #EA4335, #FBBC05, #34A853)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            D
          </span>
          exo Corp
        </div>
        <div className="flex items-center space-x-4">
          <SvgIcon src={AccountCircleIcon} alt="Account" className="cursor-pointer p-1 rounded-full hover:bg-gray-100" width={32} height={32} />
        </div>
      </div>

      {/* Search Input Area */}
      <div className="flex-grow flex flex-col justify-center items-center w-full px-5 box-border">
        <form onSubmit={handleSearch} className="w-full max-w-[584px] flex flex-col items-center space-y-5">
          <div className="flex items-center w-full border border-gray-300 rounded-full px-4 py-2 shadow-md hover:shadow-lg focus-within:border-blue-500 transition-all duration-200">
            <SvgIcon src={SearchIcon} alt="Search" className="text-gray-500 cursor-pointer mx-1" width={20} height={20} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search or ask Gemini..."
              className="flex-grow border-none outline-none text-base px-2 bg-transparent"
            />
          </div>
          {/* Hidden submit button to allow form submission on Enter */}
          <button type="submit" className="hidden"></button>
        </form>
      </div>

      {/* Action Buttons - Google style */}
      <div className="flex space-x-4 mb-12">
        <button
          type="submit"
          className="bg-gray-50 border border-gray-100 rounded px-4 py-2 text-gray-700 text-sm cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all duration-150"
          onClick={handleSearch}
        >
          Gemini Search
        </button>
        <button
          className="bg-gray-50 border border-gray-100 rounded px-4 py-2 text-gray-700 text-sm cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all duration-150"
        >
          I'm Feeling Lucky
        </button>
      </div>

      {/* Footer - Minimalist */}
      <div className="w-full py-5 text-center text-gray-600 text-xs mt-auto border-t border-gray-200">
        <p className="m-0">
          A minimal interface inspired by Google and Gemini.
        </p>
      </div>
    </div>
  );
};

export default SearchBox;