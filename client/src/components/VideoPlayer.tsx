import React from 'react';

interface VideoPlayerProps {
  videoPathInHDFS: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoPathInHDFS }) => {
  const encodedPath = encodeURIComponent(videoPathInHDFS);
  const videoUrl = `http://localhost:5000/video/hdfs?path=${encodedPath}`;

  return (
    <div>
      {/* <h2>Reproducción por streaming desde HDFS</h2> */}
      <video
        width="720"
        controls
        preload="auto"
        style={{ borderRadius: '8px' }}
      >
        <source src={videoUrl} type="video/mp4" />
        Tu navegador no soporta la reproducción de video.
      </video>
    </div>
  );
};

export default VideoPlayer;
