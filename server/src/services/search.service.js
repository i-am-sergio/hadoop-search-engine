import { Writable } from 'stream';
import webhdfs from 'webhdfs';
import { loadEntityToFileMap } from '../utils/loadEntityMapFromHDFS.js';

const hdfs = webhdfs.createClient({
  user: 'hadoop',
  host: 'paul',
  port: 9870,
  path: '/webhdfs/v1'
});

let entityFileMap = {};

(async () => {
  entityFileMap = await loadEntityToFileMap();
})();

const readCleanJSONFromHDFS = (remoteFilePath) => {
  return new Promise((resolve, reject) => {
    let fileContent = '';

    const writable = new Writable({
      write(chunk, encoding, callback) {
        fileContent += chunk.toString();
        callback();
      }
    });

    hdfs.createReadStream(remoteFilePath)
      .on('error', (err) => {
        console.error('Error leyendo archivo HDFS:', remoteFilePath);
        reject(err);
      })
      .pipe(writable)
      .on('finish', () => {
        try {
          const firstBraceIndex = fileContent.indexOf('{');
          const cleaned = fileContent.slice(firstBraceIndex, fileContent.lastIndexOf('}') + 1);
          const parsed = JSON.parse(cleaned);
          resolve(parsed);
        } catch (err) {
          console.error(`Error al parsear JSON desde ${remoteFilePath}:`, err.message);
          resolve(null);
        }
      });
  });
};

// 👉 Nueva función: agrega la ruta completa del video en HDFS
const addVideoHDFSPath = (json) => {
  const videoFile = json.video_file;
  if (videoFile) {
    json.video_path_in_hdfs = `/user/hadoop/inputVideos/${videoFile}`;
  }
  return json;
};

export const performBasicSearch = async (entities) => {
  const seenFiles = new Set();
  const combinedResults = [];

  for (const entity of entities) {
    const key = entity.toLowerCase();
    const files = entityFileMap[key];
    if (!files || files.length === 0) continue;

    for (const filename of files) {
      if (seenFiles.has(filename)) continue;

      const hdfsPath = `/user/hadoop/output/${filename}`;

      try {
        const parsed = await readCleanJSONFromHDFS(hdfsPath);
        if (parsed) {
          const enriched = addVideoHDFSPath(parsed);  // 👈 aplicamos la función aquí
          combinedResults.push(enriched);
          seenFiles.add(filename);
        }
      } catch (err) {
        console.error(`Error procesando archivo ${filename}`, err.message);
      }
    }
  }

  // Imprimir los resultados enriquecidos
  console.log('Resultados con ruta de video HDFS:');
  console.log(combinedResults);

  return combinedResults;
};
