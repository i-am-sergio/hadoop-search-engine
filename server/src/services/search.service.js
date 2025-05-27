// Simulación de datos - en producción esto vendría de Hadoop/HDFS
const mockVideos = [
  {
    camera_id: "cam_01",
    location: "Calle Principal 123",
    thumbnail: "/thumbnails/1.jpg",
    priority: "media",
    duration: 120,
    video_file: "videovigilancia001.mp4",
    date: "2025-05-03",
    object_counts: {
      bicycle: 13,
      dog: 10,
      car: 10,
    },
  },
  // ... más videos
];

export const basicSearchService = async (query, limit = 10, offset = 0) => {
  // En producción: aquí conectarías con Hadoop/HDFS para la búsqueda real
  const searchTerm = query.toLowerCase();
  
  const filteredVideos = mockVideos.filter(video => {
    // Buscar en los objetos detectados
    const objectKeys = Object.keys(video.object_counts || {});
    return objectKeys.some(obj => obj.toLowerCase().includes(searchTerm));
  }).slice(offset, offset + limit);

  return {
    results: filteredVideos,
    total: filteredVideos.length,
    limit,
    offset
  };
};


// ... código anterior ...

export const advancedSearchService = async ({ entities, logic, date_range, duration }) => {
  // En producción: aquí conectarías con Hadoop/HDFS para la búsqueda real
  
  const searchEntities = entities.map(e => e.toLowerCase());
  
  const filteredVideos = mockVideos.filter(video => {
    // Filtrar por fecha si se especificó
    if (date_range) {
      const videoDate = new Date(video.date);
      const startDate = new Date(date_range.start);
      const endDate = new Date(date_range.end);
      
      if (videoDate < startDate || videoDate > endDate) {
        return false;
      }
    }
    
    // Filtrar por duración si se especificó
    if (duration) {
      if ((duration.min && video.duration < duration.min) || 
          (duration.max && video.duration > duration.max)) {
        return false;
      }
    }
    
    // Filtrar por objetos según la lógica especificada
    const objectKeys = Object.keys(video.object_counts || {});
    const lowerObjectKeys = objectKeys.map(obj => obj.toLowerCase());
    
    if (logic === 'AND') {
      return searchEntities.every(entity => 
        lowerObjectKeys.some(obj => obj.includes(entity))
      );
    } else if (logic === 'OR') {
      return searchEntities.some(entity => 
        lowerObjectKeys.some(obj => obj.includes(entity))
      );
    } else if (logic === 'NOT') {
      return !searchEntities.some(entity => 
        lowerObjectKeys.some(obj => obj.includes(entity))
      );
    }
    
    return false;
  });

  return {
    results: filteredVideos,
    total: filteredVideos.length
  };
};