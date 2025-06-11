import React from 'react';
import VideoPlayer from './VideoPlayer';

interface VideoInformationProps {
  title: string;
  description: string;
  hdfs_path: string;
  onClose: () => void;
}

const VideoInformation: React.FC<VideoInformationProps> = ({ title, description, hdfs_path, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
      <div className="bg-gray-900 text-gray-200 rounded-2xl shadow-2xl w-[900px] max-w-full p-6 flex gap-6 relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-white text-xl hover:text-red-400"
        >
          ✕
        </button>

        <div className="flex-1">
          {/* <VideoPlayer /> */}
          <VideoPlayer videoPathInHDFS={hdfs_path} />
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-[#5dcf7b] mb-4">{title}</h2>
          <p className="text-gray-300">{description}</p>
        </div>
      </div>
    </div>
  );
};

export default VideoInformation;
