import { streamVideoService } from '../services/video.services.js';
import { streamHDFSVideoService } from '../services/video.services.js';

export const streamHDFSVideo = async (req, res) => {
  try {
    const { path: videoPathInHDFS } = req.query;
    console.log(req.query)
    const range = req.headers.range;

    if (!range) {
      return res.status(400).send("Se requiere el encabezado Range");
    }
    console.log("Path del video en HDFS: ", videoPathInHDFS);
    await streamHDFSVideoService(videoPathInHDFS, range, res);
  } catch (error) {
    if (error.message === 'Ruta HDFS inválida') {
      return res.status(400).send('Ruta HDFS inválida.');
    }
    if (error.message === 'Archivo no encontrado en HDFS') {
      return res.status(404).send('Archivo no encontrado en HDFS.');
    }
    console.error(error);
    res.status(500).send('Error al procesar el video desde HDFS');
  }
};


export const streamVideo = async (req, res) => {
  try {
    const { filename } = req.params;
    const range = req.headers.range;

    if (!range) {
      return res.status(400).send("Se requiere el encabezado Range");
    }

    await streamVideoService(filename, range, res);
  } catch (error) {
    if (error.message === 'Acceso no permitido') {
      return res.status(400).send('Acceso no permitido.');
    }
    if (error.message === 'Archivo no encontrado') {
      return res.status(404).send('Archivo no encontrado.');
    }
    console.error(error);
    res.status(500).send('Error al procesar el video');
  }
};