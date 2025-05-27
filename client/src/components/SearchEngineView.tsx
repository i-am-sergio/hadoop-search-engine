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
  type VideoJson = {
    camera_id: string;
    location: string;
    priority: string;
    video_file: string;
    date: string;
    timeslots: {
      hour: string;
      object_counts: {
        [key: string]: number;
      };
    }[];
    alerts: any[];
  };
  
  const [selectedVideo, setSelectedVideo] = useState<null | VideoJson>(null);

  const [hasSearched, setHasSearched] = useState(false);
  const [currentQuery, setCurrentQuery] = useState(''); // To keep track of the last searched query

  const handleSearchSubmit = (query: string) => {
    setCurrentQuery(query); // Save the query
    console.log('Searching for:', query);
    setHasSearched(true); // Indicate that a search has been performed
    onSearch(query); // Call the external onSearch 
  };

  // Simulated video data resembling the actual JSON structure
  const videoResults: VideoJson[] = Array.from({ length: 10 }, (_, i) => ({
    camera_id: `cam_${i + 1}`,
    location: `Ubicación ${i + 1}`,
    priority: i % 2 === 0 ? 'alta' : 'media',
    video_file: `video_${i + 1}.mpg`,
    date: `2024-01-${String(i + 1).padStart(2, '0')}`,
    timeslots: [
      {
        hour: '00:00-01:00',
        object_counts: {
          car: Math.floor(Math.random() * 200),
          person: Math.floor(Math.random() * 50),
          truck: Math.floor(Math.random() * 20),
          airplane: Math.floor(Math.random() * 10),
        },
      },
    ],
    alerts: [],
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
              {videoResults.map((video, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedVideo(video)}
                  className="flex bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-all duration-200 hover:bg-gray-700 cursor-pointer"
                >
                  <div className="w-1/3 flex-shrink-0 aspect-video bg-gray-700 overflow-hidden">
                    <img
                      src={SampleMiniature}
                      alt={video.video_file}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="w-2/3 p-4 flex flex-col justify-center">
                    <h3 className="text-lg font-medium text-[#5dcf7b] mb-1">{video.video_file}</h3>
                    <p className="text-gray-300 text-sm mb-2 line-clamp-2">
                      {video.location} | {video.priority} | {video.date}
                    </p>
                    <div className="text-gray-400 text-xs">
                      {Object.entries(video.timeslots[0].object_counts).map(([obj, count]) => (
                        <span key={obj} className="mr-2">
                          {obj}: {count}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {selectedVideo && (
                <VideoInformation
                  video={selectedVideo}
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