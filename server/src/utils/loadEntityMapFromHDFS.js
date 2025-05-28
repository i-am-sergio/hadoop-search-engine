import { readHDFSFile } from '../services/hdfs.service.js';

/**
 * Carga el mapa de entidad → archivos a partir del contenido HDFS.
 */
export const loadEntityToFileMap = async () => {
  const hashTable = {};

  try {
    const content = await readHDFSFile();
    const lines = content.split('\n').filter(Boolean);

    for (const line of lines) {
      // Extraer entidad y la parte restante como string de archivos
      const [entity, ...fileParts] = line.trim().split(/\s+/);
      const filesStr = fileParts.join(' ');
      if (!entity || !filesStr) continue;

      const files = filesStr.split(',').map(f => f.trim()).filter(Boolean);

      if (!hashTable[entity]) {
        hashTable[entity] = new Set();
      }

      files.forEach(file => hashTable[entity].add(file));
    }

    // Convertimos los sets a arrays
    for (const key in hashTable) {
      hashTable[key] = Array.from(hashTable[key]);
    }

    return hashTable;
  } catch (err) {
    console.error('Error cargando el mapa desde HDFS:', err.message);
    return {};
  }
};
