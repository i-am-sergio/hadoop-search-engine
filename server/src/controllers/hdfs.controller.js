import { readHDFSFile } from '../services/hdfs.service.js';

/**
 * Controlador que lee el archivo de HDFS y devuelve su contenido como texto.
 * Ruta sugerida: GET /hdfs/file
 */
export const getHDFSFileContent = async (req, res) => {
  try {
    const content = await readHDFSFile(); // Usa la ruta por defecto
    res.status(200).json({ content });
  } catch (err) {
    res.status(500).json({ error: 'Error al leer el archivo desde HDFS', details: err.message });
  }
};
