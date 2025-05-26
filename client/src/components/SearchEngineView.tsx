import React, { useState } from 'react';
import SearchInputArea from './SearchInputArea'; // Import our search input component
import SvgIcon from './SvgIcon'; // Assuming SvgIcon is a wrapper for your SVG assets

import AccountCircleIcon from '../assets/account_circle.svg';
import SampleMiniature from '../assets/sample_miniature.png'
import VideoInformation from './VideoInformation';

interface SearchEngineViewProps {
  onSearch: (query: string) => void;
}

const SearchEngineView: React.FC<SearchEngineViewProps> = ({ onSearch }) => {
  const [selectedVideo, setSelectedVideo] = useState<null | {
    title: string;
    description: string;
  }>(null);

  const [hasSearched, setHasSearched] = useState(false);
  const [currentQuery, setCurrentQuery] = useState(''); // To keep track of the last searched query

  const handleSearchSubmit = (query: string) => {
    setCurrentQuery(query); // Save the query
    console.log('Searching for:', query);
    setHasSearched(true); // Indicate that a search has been performed
    onSearch(query); // Call the external onSearch 
  };

  // Dummy video data for demonstration (increased quantity for scrolling effect)
  const videoResults = Array.from({ length: 20 }, (_, i) => ({ // Generates 20 dummy videos
    id: i + 1,
    title: `Video sobre Apache Hadoop ${i + 1}`,
    description: `Aprende los fundamentos de Hadoop y su ecosistema en este video número ${i + 1}. Explora casos de uso y ejemplos prácticos para Big Data.`,
    duration: `15:${String(i * 2).padStart(2, '0')}`,
    imageUrl: SampleMiniature
  }));


  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-900 text-gray-200 font-sans">
      {hasSearched && (
        <header className="w-full sticky top-0 z-10 bg-gray-900 border-b border-gray-700 shadow-lg"> {/* Added sticky, top-0, z-10, and shadow-lg */}
          <div className="max-w-[1200px] mx-auto flex items-center px-6 py-4"> {/* Centered content */}
            <div className="flex items-center flex-shrink-0 mr-4">
              <span
                className="text-3xl font-bold ml-2"
                style={{
                  background: 'linear-gradient(to right, #4285F4, #5dcf7b)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Hadoop
              </span>
            </div>

            <div className="flex-grow flex justify-center">
              <SearchInputArea onSearch={handleSearchSubmit} initialQuery={currentQuery} isCompact={true} />
            </div>

            <div className="flex items-center flex-shrink-0 ml-4">
              <SvgIcon src={AccountCircleIcon} alt="Account" className="cursor-pointer rounded-full hover:bg-gray-700 text-gray-400" width={36} height={36} />
            </div>
          </div>
        </header>
      )}

      {/* Adjusted main class to add padding-top when header is present */}
      <main className={`flex-grow flex flex-col items-center w-full px-5 ${hasSearched ? 'pt-8' : 'justify-center pb-20'}`}>
        {!hasSearched && (
          <>
            <div className="text-6xl font-extrabold mb-10 mt-20 leading-tight" style={{
              background: 'linear-gradient(to right, #4285F4, #5dcf7b)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Hadoop
            </div>
            <SearchInputArea onSearch={handleSearchSubmit} />
          </>
        )}

        {hasSearched && (
          <div className="w-full max-w-3xl mt-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-100">Resultados de video para "{currentQuery}"</h2>
            <div className="space-y-6">
              {/*aqui empieza*/}
              {videoResults.map(video => (
                <div
                  key={video.id}
                  onClick={() =>
                    setSelectedVideo({ title: video.title, description: video.description })
                  }
                  className="flex bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-all duration-200 hover:bg-gray-700 cursor-pointer"
                >
                  <div className="w-1/3 flex-shrink-0 aspect-video bg-gray-700 overflow-hidden">
                    <img
                      src={video.imageUrl}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="w-2/3 p-4 flex flex-col justify-center">
                    <h3 className="text-lg font-medium text-[#5dcf7b] mb-1">{video.title}</h3>
                    <p className="text-gray-300 text-sm mb-2 line-clamp-2">{video.description}</p>
                    <span className="text-gray-500 text-xs">{video.duration}</span>
                  </div>
                </div>
              ))}
              {selectedVideo && (
                <VideoInformation
                  title={selectedVideo.title}
                  description={selectedVideo.description}
                  onClose={() => setSelectedVideo(null)}
                />
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer - Minimalist */}
      <footer className="w-full py-4 text-center text-gray-400 text-sm border-t border-gray-700">
        <p className="m-0">
          Hecho con ❤️ por el grupo 8 de Big Data.
        </p>
      </footer>
    </div>
  );
};

export default SearchEngineView;