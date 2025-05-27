import React from 'react';
import VideoPlayer from './VideoPlayer';

interface VideoInformationProps {
  video: {
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
  onClose: () => void;
}

const VideoInformation: React.FC<VideoInformationProps> = ({ video, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
      <div className="bg-gray-900 text-gray-200 rounded-2xl shadow-2xl w-[1000px] max-w-full p-6 flex gap-6 relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-white text-xl hover:text-red-400"
        >
          ✕
        </button>

        {/* Video a la izquierda */}
        <div className="flex-1">
          <VideoPlayer videoFile={video.video_file} />
        </div>

        {/* Información a la derecha */}
        <div className="flex-1 flex flex-col gap-2 overflow-y-auto max-h-[500px]">
          <h2 className="text-2xl font-bold text-[#5dcf7b] mb-2">{video.video_file}</h2>
          <p><strong>📍 Ubicación:</strong> {video.location}</p>
          <p><strong>🎥 Cámara:</strong> {video.camera_id}</p>
          <p><strong>📅 Fecha:</strong> {video.date}</p>
          <p><strong>⚠️ Prioridad:</strong> {video.priority}</p>
          
          {video.timeslots.map((slot, index) => (
            <div key={index} className="mt-4">
              <p><strong>🕒 Hora:</strong> {slot.hour}</p>
              <p className="mt-2 font-semibold">🧾 Conteo de objetos:</p>
              <ul className="list-disc list-inside text-sm ml-2">
                {Object.entries(slot.object_counts).map(([object, count]) => (
                  <li key={object}>
                    {object}: {count}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {video.alerts.length > 0 && (
            <div className="mt-4">
              <p className="font-semibold">🚨 Alertas:</p>
              <ul className="list-disc list-inside ml-2">
                {video.alerts.map((alert, idx) => (
                  <li key={idx}>{JSON.stringify(alert)}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default VideoInformation;
