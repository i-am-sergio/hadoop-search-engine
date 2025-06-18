import React, { useState } from 'react';
import SearchInputArea from './SearchInputArea';
import SvgIcon from './SvgIcon';

import AccountCircleIcon from '../assets/account_circle.svg';
import SampleMiniature from '../assets/sample_miniature.png';
import VideoInformation from './VideoInformation';
import { extractCocoClassesFromText } from '../utils/searchProcessor';

interface VideoResult {
  camera_id: number;
  location: string;
  priority: string;
  video_file: string;
  date: string;
  timeslots: [string, { [key: string]: number }][];
  alerts: any[];
  video_path_in_hdfs: string;
}

interface SearchEngineViewProps {
  onSearch: (query: string) => void;
}

const SearchEngineView: React.FC<SearchEngineViewProps> = ({ onSearch }) => {
  const [selectedVideo, setSelectedVideo] = useState<null | {
    title: string;
    description: string;
    hdfsPath: string;
  }>(null);

  const [hasSearched, setHasSearched] = useState(false);
  const [currentQuery, setCurrentQuery] = useState('');
  const [videoResults, setVideoResults] = useState<VideoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearchSubmit = async (query: string) => {
    setCurrentQuery(query);
    setHasSearched(true);
    setLoading(true);
    setError(null);

    try {
      const searchTerms = extractCocoClassesFromText(query);
      const queryParam = searchTerms.join(',');
      const response = await fetch(`http://localhost:4000/search?q=${queryParam}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data || !Array.isArray(data.videos)) {
        throw new Error("Formato de respuesta no válido");
      }

      setVideoResults(data.videos);
      onSearch(query);
    } catch (e) {
      console.error("Error fetching search results:", e);
      setError("No se pudieron cargar los resultados de la búsqueda. Inténtalo de nuevo más tarde.");
      setVideoResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-900 text-gray-200 font-sans">
      {hasSearched && (
        <header className="w-full sticky top-0 z-10 bg-gray-900 border-b border-gray-700 shadow-lg">
          <div className="max-w-[1200px] mx-auto flex items-center px-6 py-4">
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

            {loading && <p className="text-gray-400">Cargando resultados...</p>}
            {error && <p className="text-red-500">{error}</p>}

            {!loading && !error && videoResults.length === 0 && (
              <p className="text-gray-400">No se encontraron videos para "{currentQuery}".</p>
            )}

            <div className="space-y-6">
              {videoResults.map((video, index) => (
                <div
                  key={`${video.video_file}-${index}`}
                  onClick={() =>
                    setSelectedVideo({
                      title: `Cámara ${video.camera_id} - ${video.video_file}`,
                      description: `Ubicación: ${video.location}, Prioridad: ${video.priority}, Fecha: ${video.date}`,
                      hdfsPath: video.video_path_in_hdfs
                    })
                  }
                  className="flex bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-all duration-200 hover:bg-gray-700 cursor-pointer"
                >
                  <div className="w-1/3 flex-shrink-0 aspect-video bg-gray-700 overflow-hidden">
                    <img
                      src={SampleMiniature}
                      alt={`Video de la cámara ${video.camera_id}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="w-2/3 p-4 flex flex-col justify-center">
                    <h3 className="text-lg font-medium text-[#5dcf7b] mb-1">{`Video de la cámara ${video.camera_id} (${video.location})`}</h3>
                    <p className="text-gray-300 text-sm mb-2 line-clamp-2">
                      Archivo: {video.video_file} <br />
                      Fecha: {video.date} <br />
                      Objetos detectados en el primer timeslot: {
                        video.timeslots[0]
                          ? Object.entries(video.timeslots[0][1])
                              .map(([obj, count]) => `${obj}: ${count}`)
                              .join(', ')
                          : 'Sin datos'
                      }
                    </p>
                    <span className="text-gray-500 text-xs">Prioridad: {video.priority}</span>
                  </div>
                </div>
              ))}
              {selectedVideo && (
                <VideoInformation
                  title={selectedVideo.title}
                  description={selectedVideo.description}
                  hdfs_path={selectedVideo.hdfsPath}
                  onClose={() => setSelectedVideo(null)}
                />
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="w-full py-4 text-center text-gray-400 text-sm border-t border-gray-700">
        <p className="m-0">
          Hecho con ❤️ por el grupo 8 de Big Data.
        </p>
      </footer>
    </div>
  );
};

export default SearchEngineView;
