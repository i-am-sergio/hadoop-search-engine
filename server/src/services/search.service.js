import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadEntityToFileMap } from '../utils/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const jsonDir = path.join(__dirname, '../../jsons');

let entityFileMap = {};

// Cargar entidad-archivo al iniciar
(async () => {
  entityFileMap = await loadEntityToFileMap();
})();

export const performBasicSearch = async (entities) => {
  const seenFiles = new Set();
  const combinedResults = [];

  for (const entity of entities) {
    const key = entity.toLowerCase();
    const files = entityFileMap[key];
    if (!files || files.length === 0) continue;

    for (const filename of files) {
      if (seenFiles.has(filename)) continue; // evita duplicados

      const filePath = path.join(jsonDir, filename);
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const parsed = JSON.parse(content);
        combinedResults.push(...(Array.isArray(parsed) ? parsed : [parsed]));
        seenFiles.add(filename);
      } catch (err) {
        // Ignora errores de lectura o JSON inválido
        continue;
      }
    }
  }

  return combinedResults;
};
