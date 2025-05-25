const VideoPlayer = () => {
  return (
    <div>
      <h2>Reproducción por streaming</h2>
      <video
        width="720"
        controls
        preload="auto"
        style={{ borderRadius: '8px' }}
      >
        <source src="http://localhost:5000/video/1.mp4" type="video/mp4" />
        Tu navegador no soporta la reproducción de video.
      </video>
    </div>
  );
};

export default VideoPlayer;
